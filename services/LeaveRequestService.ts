import { prisma } from "@/lib/db/prisma";
import { LeaveType, LeaveRequestStatus, NotificationType } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { NotificationService } from "./NotificationService";
import { EmailService } from "./EmailService";

export class LeaveRequestService {
  static calculateDays(start: Date, end: Date) {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  static async requestLeave(userId: string, data: {
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new AppError("User not found", "NOT_FOUND", 404);

    const requestedDays = this.calculateDays(data.startDate, data.endDate);

    let allowed = 0;
    let used = 0;

    if (data.type === LeaveType.PAID) {
      allowed = user.allowedPaid;
      used = user.usedPaid;
    } else if (data.type === LeaveType.CASUAL) {
      allowed = user.allowedCasual;
      used = user.usedCasual;
    } else if (data.type === LeaveType.SICK) {
      allowed = user.allowedSick;
      used = user.usedSick;
    }

    if (used + requestedDays > allowed) {
      throw new AppError(
        `Insufficient ${data.type.toLowerCase()} leaves balance. Available: ${allowed - used} days, Requested: ${requestedDays} days.`,
        "INSUFFICIENT_BALANCE"
      );
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || null,
        status: LeaveRequestStatus.PENDING
      }
    });

    // Notify TLs (in-app + email)
    const tls = await prisma.user.findMany({
      where: { role: "TEAM_LEADER", deletedAt: null },
      select: { id: true, email: true }
    });
    await NotificationService.createForTLs(
      null,
      NotificationType.APPROVAL_REQUIRED,
      "WORK_ITEM",
      leaveRequest.id,
      "Leave Request",
      `${user.name} has requested ${requestedDays} day(s) of ${data.type.toLowerCase()} leave starting ${data.startDate.toLocaleDateString()}.`,
      "/tl/approvals"
    );
    EmailService.sendLeaveRequestSubmitted({
      tlEmails: tls.map(t => t.email),
      employeeName: user.name,
      leaveType: data.type,
      startDate: data.startDate.toLocaleDateString("en-IN"),
      endDate: data.endDate.toLocaleDateString("en-IN"),
      days: requestedDays,
      reason: data.reason,
    });

    return leaveRequest;
  }

  static async approveLeave(requestId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      });

      if (!request) throw new AppError("Leave request not found", "NOT_FOUND", 404);
      if (request.status !== LeaveRequestStatus.PENDING) {
        throw new AppError("Leave request is already processed", "ALREADY_PROCESSED");
      }

      const days = this.calculateDays(request.startDate, request.endDate);

      const updateData: any = {};
      if (request.type === LeaveType.PAID) {
        updateData.usedPaid = { increment: days };
      } else if (request.type === LeaveType.CASUAL) {
        updateData.usedCasual = { increment: days };
      } else if (request.type === LeaveType.SICK) {
        updateData.usedSick = { increment: days };
      }

      await tx.user.update({
        where: { id: request.userId },
        data: updateData
      });

      const updatedRequest = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: LeaveRequestStatus.APPROVED }
      });

      // Send alert notification to user
      await NotificationService.createNotification(tx, {
        userId: request.userId,
        type: NotificationType.SYSTEM_ALERT,
        title: "Leave Approved",
        body: `Your request for ${days} days of ${request.type.toLowerCase()} leave starting ${new Date(request.startDate).toLocaleDateString()} has been approved.`,
        link: "/employee/leaves"
      });

      // Email
      EmailService.sendLeaveApproved({
        recipientEmail: request.user.email,
        recipientName: request.user.name,
        leaveType: request.type,
        startDate: new Date(request.startDate).toLocaleDateString("en-IN"),
        endDate: new Date(request.endDate).toLocaleDateString("en-IN"),
        days,
      });

      return updatedRequest;
    });
  }

  static async rejectLeave(requestId: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new AppError("Leave request not found", "NOT_FOUND", 404);
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new AppError("Leave request is already processed", "ALREADY_PROCESSED");
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: LeaveRequestStatus.REJECTED }
    });

    // Notify user
    await NotificationService.createNotification(null, {
      userId: request.userId,
      type: NotificationType.SYSTEM_ALERT,
      title: "Leave Request Rejected",
      body: `Your request for ${request.type.toLowerCase()} leave starting ${new Date(request.startDate).toLocaleDateString()} has been rejected.`,
      link: "/employee/leaves"
    });

    // Email (fetch user details first)
    const rejectedUser = await prisma.user.findUnique({ where: { id: request.userId }, select: { email: true, name: true } });
    if (rejectedUser) {
      EmailService.sendLeaveRejected({
        recipientEmail: rejectedUser.email,
        recipientName: rejectedUser.name,
        leaveType: request.type,
        startDate: new Date(request.startDate).toLocaleDateString("en-IN"),
        endDate: new Date(request.endDate).toLocaleDateString("en-IN"),
      });
    }

    return updatedRequest;
  }

  static async updateLeaveAllowances(userId: string, data: {
    allowedPaid: number;
    allowedCasual: number;
    allowedSick: number;
  }) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        allowedPaid: data.allowedPaid,
        allowedCasual: data.allowedCasual,
        allowedSick: data.allowedSick
      }
    });

    // Notify employee of balance modification
    await NotificationService.createNotification(null, {
      userId,
      type: NotificationType.SYSTEM_ALERT,
      title: "Leave Balances Adjusted",
      body: `Your allowed leave allocations have been updated by your Team Leader. (Paid: ${data.allowedPaid}, Casual: ${data.allowedCasual}, Sick: ${data.allowedSick})`,
      link: "/employee/leaves"
    });

    EmailService.sendLeaveBalanceUpdated({
      recipientEmail: updatedUser.email,
      recipientName: updatedUser.name,
      allowedPaid: data.allowedPaid,
      allowedCasual: data.allowedCasual,
      allowedSick: data.allowedSick,
    });

    return updatedUser;
  }

  static async getUserLeaveRequests(userId: string) {
    return prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  static async listPendingLeaveRequests() {
    return prisma.leaveRequest.findMany({
      where: { status: LeaveRequestStatus.PENDING },
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });
  }
}
