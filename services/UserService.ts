import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { UserCreateSchema, UserUpdateSchema } from "@/lib/validations/user.schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { EmailService } from "./EmailService";
import { sanitizeForClient } from "@/lib/utils";

export class UserService {
  static async listByRole(role: "TEAM_LEADER" | "EMPLOYEE", activeBrandName?: string) {
    const users = await prisma.user.findMany({
      where: { 
        role, 
        deletedAt: null,
        ...(activeBrandName && role === "EMPLOYEE" ? {
          brand: {
            name: activeBrandName,
            type: "BRAND"
          }
        } : {})
      },
      include: { capabilities: true, brand: true, department: true },
      orderBy: { name: "asc" },
    });
    return sanitizeForClient(users);
  }

  static async list(activeBrandName?: string) {
    const users = await prisma.user.findMany({
      where: { 
        deletedAt: null,
        ...(activeBrandName ? {
          OR: [
            { role: "TEAM_LEADER" },
            {
              brand: {
                name: activeBrandName,
                type: "BRAND"
              }
            }
          ]
        } : {})
      },
      include: { capabilities: true, brand: true, department: true },
      orderBy: { createdAt: "desc" },
    });
    return sanitizeForClient(users);
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { capabilities: true, department: true },
    });
    return sanitizeForClient(user);
  }

  static async create(data: z.infer<typeof UserCreateSchema>) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError("Email already in use", "EMAIL_EXISTS");
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const primaryRole = data.roles.includes("TEAM_LEADER") ? "TEAM_LEADER" : "EMPLOYEE";

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: primaryRole,
        roles: data.roles,
        brandId: data.brandId,
        departmentId: data.departmentId,
        allowedPaid: data.allowedPaid ?? 12,
        allowedCasual: data.allowedCasual ?? 8,
        allowedSick: data.allowedSick ?? 10,
        capabilities: data.capabilities ? {
          connect: data.capabilities.map(id => ({ id }))
        } : undefined
      },
      include: { capabilities: true, department: true }
    });
  }

  static async update(data: z.infer<typeof UserUpdateSchema>) {
    const user = await prisma.user.findUnique({ where: { id: data.id } });
    if (!user) throw new AppError("User not found", "NOT_FOUND", 404);

    const primaryRole = data.roles.includes("TEAM_LEADER") ? "TEAM_LEADER" : "EMPLOYEE";

    let consecutivePunctualDays = data.consecutivePunctualDays !== undefined ? data.consecutivePunctualDays : user.consecutivePunctualDays;
    let allowedPaid = data.allowedPaid ?? user.allowedPaid;
    const allowedCasual = data.allowedCasual ?? user.allowedCasual;
    const allowedSick = data.allowedSick ?? user.allowedSick;
    let extraPaid = 0;

    if (data.consecutivePunctualDays !== undefined && data.consecutivePunctualDays >= 20) {
      extraPaid = Math.floor(data.consecutivePunctualDays / 20);
      allowedPaid += extraPaid;
      consecutivePunctualDays = data.consecutivePunctualDays % 20;
    }

    const balancesChanged = allowedPaid !== user.allowedPaid || 
                            allowedCasual !== user.allowedCasual || 
                            allowedSick !== user.allowedSick;

    const updated = await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        role: primaryRole,
        roles: data.roles,
        brandId: data.brandId,
        departmentId: data.departmentId,
        allowedPaid,
        allowedCasual,
        allowedSick,
        consecutivePunctualDays,
        capabilities: data.capabilities ? {
          set: data.capabilities.map(id => ({ id }))
        } : undefined
      },
      include: { capabilities: true, department: true }
    });

    if (extraPaid > 0) {
      const { NotificationType } = await import("@prisma/client");
      const { NotificationService } = await import("./NotificationService");
      try {
        await NotificationService.createNotification(null, {
          userId: user.id,
          type: NotificationType.SYSTEM_ALERT,
          title: "Discipline Reward Earned!",
          body: `Congratulations! You completed ${extraPaid * 20} consecutive punctual working days and earned +${extraPaid} paid leave.`,
          link: "/employee/leaves"
        });
        EmailService.sendPunctualityReward({
          recipientEmail: updated.email,
          recipientName: updated.name,
          newPaidBalance: allowedPaid,
        });
      } catch (notifErr) {
        console.error("Failed to send punctuality reward notification:", notifErr);
      }
    }

    if (balancesChanged) {
      const { NotificationType } = await import("@prisma/client");
      const { NotificationService } = await import("./NotificationService");
      try {
        await NotificationService.createNotification(null, {
          userId: user.id,
          type: NotificationType.SYSTEM_ALERT,
          title: "Leave Balances Adjusted",
          body: `Your allowed leave allocations have been updated by your Team Leader. (Paid: ${allowedPaid}, Casual: ${allowedCasual}, Sick: ${allowedSick})`,
          link: "/employee/leaves"
        });
        EmailService.sendLeaveBalanceUpdated({
          recipientEmail: updated.email,
          recipientName: updated.name,
          allowedPaid,
          allowedCasual,
          allowedSick,
        });
      } catch (notifErr) {
        console.error("Failed to send leave adjustment notification:", notifErr);
      }
    }

    const profileChanges: string[] = [];
    if (data.name && data.name !== user.name) profileChanges.push("Full Name");
    if (data.email && data.email !== user.email) profileChanges.push("Official Email");
    if (data.brandId !== undefined && data.brandId !== user.brandId) profileChanges.push("Brand Space");
    if (data.departmentId !== undefined && data.departmentId !== user.departmentId) profileChanges.push("Department");

    if (profileChanges.length > 0) {
      try {
        EmailService.sendUserProfileUpdated({
          recipientEmail: updated.email,
          recipientName: updated.name,
          updatedFields: profileChanges
        });
        if (data.email && data.email !== user.email && user.email) {
          EmailService.sendUserProfileUpdated({
            recipientEmail: user.email,
            recipientName: user.name,
            updatedFields: ["Official Email Address Updated"]
          });
        }
      } catch (err) {
        console.error("Failed to send profile update email:", err);
      }
    }

    return updated;
  }

  static async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
