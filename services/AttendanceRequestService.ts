import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { NotificationService } from "./NotificationService";
import { EmailService } from "./EmailService";
import { NotificationType } from "@prisma/client";

export class AttendanceRequestService {
  static async listPendingRequests() {
    return prisma.attendanceRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendance: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async createRequest(userId: string, data: {
    clockIn: Date;
    clockOut?: Date | null;
    workLocation: "IN_OFFICE" | "WORK_FROM_HOME";
    reason?: string | null;
    attendanceId?: string | null;
  }) {
    const type = data.attendanceId ? "UPDATE" : "CREATE";

    const [request, employee] = await Promise.all([
      prisma.attendanceRequest.create({
        data: {
          userId,
          attendanceId: data.attendanceId || undefined,
          type,
          clockIn: data.clockIn,
          clockOut: data.clockOut || undefined,
          workLocation: data.workLocation,
          reason: data.reason,
          status: "PENDING"
        }
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    ]);

    // Notify all TLs
    const tls = await prisma.user.findMany({
      where: { role: "TEAM_LEADER", deletedAt: null },
      select: { id: true, email: true }
    });

    await NotificationService.createForTLs(
      null,
      NotificationType.APPROVAL_REQUIRED,
      "WORK_ITEM",
      request.id,
      "Attendance Request",
      `${employee?.name ?? "An employee"} submitted a manual attendance ${
        type === "CREATE" ? "creation" : "update"
      } request.`,
      "/tl/approvals"
    );

    // Fire-and-forget email to all TLs
    EmailService.sendAttendanceRequestSubmitted({
      tlEmails: tls.map(t => t.email),
      employeeName: employee?.name ?? "Employee",
      type: type as "CREATE" | "UPDATE",
      clockIn: data.clockIn.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      clockOut: data.clockOut
        ? data.clockOut.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : undefined,
      reason: data.reason ?? undefined,
    });

    return request;
  }

  static async approveRequest(requestId: string) {
    const request = await prisma.attendanceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new AppError("Attendance request not found", "NOT_FOUND", 404);
    if (request.status !== "PENDING") throw new AppError("Request already processed", "ALREADY_PROCESSED");

    const employee = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { name: true, email: true }
    });

    await prisma.$transaction(async (tx) => {
      if (request.type === "UPDATE" && request.attendanceId) {
        await tx.attendance.update({
          where: { id: request.attendanceId },
          data: {
            clockIn: request.clockIn,
            clockOut: request.clockOut,
            workLocation: request.workLocation
          }
        });
      } else {
        await tx.attendance.create({
          data: {
            userId: request.userId,
            clockIn: request.clockIn,
            clockOut: request.clockOut,
            workLocation: request.workLocation
          }
        });
      }

      await tx.attendanceRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });

      // Update punctuality streak if the manual attendance request was punctual
      const checkInTime = request.clockIn;
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(checkInTime.getTime() + istOffset);
      const hours = istDate.getUTCHours();
      const minutes = istDate.getUTCMinutes();
      const isPunctual = hours < 10 || (hours === 10 && minutes <= 20);

      if (isPunctual) {
        const emp = await tx.user.findUnique({ where: { id: request.userId } });
        if (emp) {
          let newStreak = emp.consecutivePunctualDays + 1;
          let extraPaid = 0;
          if (newStreak >= 20) {
            newStreak = 0;
            extraPaid = 1;

            // In-app notification
            await NotificationService.createNotification(tx, {
              userId: request.userId,
              type: NotificationType.SYSTEM_ALERT,
              title: "Discipline Reward Earned!",
              body: "Congratulations! You completed 20 consecutive punctual working days and earned +1 paid leave.",
              link: "/employee/leaves"
            });

            // Email reward
            EmailService.sendPunctualityReward({
              recipientEmail: emp.email,
              recipientName: emp.name,
              newPaidBalance: emp.allowedPaid + 1,
            });
          }

          await tx.user.update({
            where: { id: request.userId },
            data: {
              consecutivePunctualDays: newStreak,
              allowedPaid: extraPaid > 0 ? { increment: 1 } : undefined
            }
          });
        }
      }

      await NotificationService.createNotification(tx, {
        userId: request.userId,
        type: NotificationType.SYSTEM_ALERT,
        title: "Attendance Request Approved",
        body: "Your manual attendance request has been approved and records updated.",
        link: "/employee/profile"
      });
    });

    // Fire-and-forget email
    if (employee) {
      EmailService.sendAttendanceRequestApproved({
        recipientEmail: employee.email,
        recipientName: employee.name,
        clockIn: request.clockIn.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        clockOut: request.clockOut
          ? request.clockOut.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
          : undefined,
      });
    }
  }

  static async rejectRequest(requestId: string) {
    const request = await prisma.attendanceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new AppError("Attendance request not found", "NOT_FOUND", 404);
    if (request.status !== "PENDING") throw new AppError("Request already processed", "ALREADY_PROCESSED");

    const employee = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { name: true, email: true }
    });

    await prisma.attendanceRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" }
    });

    await NotificationService.createNotification(null, {
      userId: request.userId,
      type: NotificationType.SYSTEM_ALERT,
      title: "Attendance Request Rejected",
      body: "Your manual attendance modification request has been rejected.",
      link: "/employee/profile"
    });

    // Fire-and-forget email
    if (employee) {
      EmailService.sendAttendanceRequestRejected({
        recipientEmail: employee.email,
        recipientName: employee.name,
        clockIn: request.clockIn.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    }
  }
}
