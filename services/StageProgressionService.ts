import { Prisma } from "@prisma/client";
import { NotificationService } from "./NotificationService";
import { EmailService } from "./EmailService";

export class StageProgressionService {
  static async unlockNextStage(tx: Prisma.TransactionClient, workItemId: string, currentStageId: string) {
    const workItem = await tx.workItem.findUnique({
      where: { id: workItemId },
      include: {
        stages: {
          include: { stageTemplate: true },
          orderBy: { stageTemplate: { order: 'asc' } }
        }
      }
    });

    if (!workItem) return;

    const currentIndex = workItem.stages.findIndex((s) => s.id === currentStageId);
    
    // If this was the last stage, mark the whole work item as completed
    if (currentIndex === -1 || currentIndex === workItem.stages.length - 1) {
      await tx.workItem.update({
        where: { id: workItemId },
        data: {
          status: 'COMPLETED',
          actualEnd: new Date()
        }
      });
      // Try to find the user who completed the last stage to log this against them, 
      // or just use system context. If we want it exact, we might need userId passed in, 
      // but let's just log it without userId or use the assigned user of the last stage.
      const lastAssigned = currentIndex >= 0 ? workItem.stages[currentIndex].assignedUserId : null;
      if (lastAssigned) {
        await tx.auditLog.create({
          data: {
            action: 'STAGE_COMPLETED',
            workItemId,
            userId: lastAssigned,
            metadata: { message: `Work Item Completed` }
          }
        });
      }

      // Notify and Email creator and TLs
      const { NotificationType } = await import("@prisma/client");
      const tls = await tx.user.findMany({
        where: { role: "TEAM_LEADER", deletedAt: null },
        select: { id: true, email: true, name: true }
      });
      const creator = await tx.user.findUnique({
        where: { id: workItem.createdById },
        select: { id: true, email: true, name: true }
      });

      const notifyUserIds = new Set<string>();
      tls.forEach(t => notifyUserIds.add(t.id));
      if (creator) notifyUserIds.add(creator.id);

      for (const uid of notifyUserIds) {
        await NotificationService.createNotification(tx, {
          userId: uid,
          type: NotificationType.SYSTEM_ALERT,
          entityType: 'WORK_ITEM',
          entityId: workItemId,
          title: "Work Item Completed",
          body: `Work Item ${workItem.workNumber} (${workItem.title}) has been fully completed.`,
          link: `/tl/work/${workItemId}`
        });
      }

      const emailRecipients = new Map<string, string>(); // email -> name
      tls.forEach(t => emailRecipients.set(t.email, t.name));
      if (creator) emailRecipients.set(creator.email, creator.name);

      const brandInfo = await tx.tag.findUnique({ where: { id: workItem.primaryBrandTagId }, select: { name: true } });
      const brandName = brandInfo?.name || "Football Counter";

      for (const [email, name] of emailRecipients.entries()) {
        EmailService.sendWorkItemCompleted({
          recipientEmail: email,
          recipientName: name,
          workNumber: workItem.workNumber,
          title: workItem.title,
          brand: brandName,
          workItemId
        });
      }

      return;
    }

    const nextStage = workItem.stages[currentIndex + 1];
    
    // Unlock the next stage as READY
    const nextStatus = 'READY';

    await tx.workItemStage.update({
      where: { id: nextStage.id },
      data: {
        status: nextStatus,
        statusChangedAt: new Date()
      }
    });
    
    // Update the work item's current stage pointer
    await tx.workItem.update({
        where: { id: workItemId },
        data: { currentStageId: nextStage.id }
    });

    if (nextStage.assignedUserId) {
      const assignee = await tx.user.findUnique({ where: { id: nextStage.assignedUserId }, select: { email: true, name: true } });
      await NotificationService.createForStageAssignee(
        tx,
        nextStage.id,
        nextStage.assignedUserId,
        "STAGE_READY",
        "Stage is Ready",
        `Stage ${nextStage.stageTemplate.name} is now ready to start.`,
        `/employee/work/${workItemId}`
      );
      if (assignee) {
        EmailService.sendNextStageReady({
          recipientEmail: assignee.email,
          recipientName: assignee.name,
          stageName: nextStage.stageTemplate.name,
          workNumber: workItem.workNumber,
          workTitle: workItem.title,
          workItemId,
        });
      }
    }
  }
}
