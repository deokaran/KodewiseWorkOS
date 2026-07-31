import { prisma } from "@/lib/db/prisma";
import { NotificationType, NotificationEntityType } from "@prisma/client";

export class NotificationService {
  static async createNotification(
    tx: any,
    data: {
      userId: string;
      type: NotificationType;
      entityType?: NotificationEntityType;
      entityId?: string;
      title: string;
      body: string;
      link?: string;
    }
  ) {
    const db = tx || prisma;
    return db.notification.create({ data });
  }

  static async createMany(
    tx: any,
    data: {
      userId: string;
      type: NotificationType;
      entityType?: NotificationEntityType;
      entityId?: string;
      title: string;
      body: string;
      link?: string;
    }[]
  ) {
    if (data.length === 0) return;
    const db = tx || prisma;
    return db.notification.createMany({ data });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async getUserNotifications(userId: string, filterUnread: boolean = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(filterUnread ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  static async createForStageAssignee(
    tx: any,
    stageId: string,
    assigneeUserId: string,
    type: NotificationType,
    title: string,
    body: string,
    link: string
  ) {
    return this.createNotification(tx, {
      userId: assigneeUserId,
      type,
      entityType: "WORK_ITEM_STAGE",
      entityId: stageId,
      title,
      body,
      link,
    });
  }

  static async createForTLs(
    tx: any,
    type: NotificationType,
    entityType: NotificationEntityType,
    entityId: string,
    title: string,
    body: string,
    link: string
  ) {
    const db = tx || prisma;
    const tls = await db.user.findMany({
      where: { role: "TEAM_LEADER", deletedAt: null },
      select: { id: true },
    });
    
    if (tls.length === 0) return;

    return this.createMany(
      tx,
      tls.map((tl: any) => ({
        userId: tl.id,
        type,
        entityType,
        entityId,
        title,
        body,
        link,
      }))
    );
  }
}
