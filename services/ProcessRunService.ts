import { Prisma } from "@prisma/client";
import { NotificationService } from "./NotificationService";
import { EmailService } from "./EmailService";

export class ProcessRunService {
  static async initializeWorkItemStages(
    tx: Prisma.TransactionClient,
    workItemId: string,
    processVersionId: string,
    stageAssignments?: Record<string, string>
  ): Promise<string> {
    const version = await tx.processTemplateVersion.findUnique({
      where: { id: processVersionId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { capability: true }
        }
      }
    });

    if (!version) {
      throw new Error("Process version not found");
    }

    if (version.stages.length === 0) {
      throw new Error("Cannot instantiate a process with no stages");
    }

    const firstStageTemplate = version.stages[0];
    const firstAssignee = stageAssignments?.[firstStageTemplate.id];
    const hasFirstAssignee = firstAssignee && firstAssignee !== "none";

    // Create the first stage as READY
    const firstStage = await tx.workItemStage.create({
      data: {
        workItemId,
        stageTemplateId: firstStageTemplate.id,
        status: 'READY',
        capabilityId: firstStageTemplate.capabilityId,
        isPoolItem: hasFirstAssignee ? false : firstStageTemplate.isDefaultOpenPool,
        assignedUserId: hasFirstAssignee ? firstAssignee : null,
      }
    });

    // Send assignment notification for first stage
    if (hasFirstAssignee) {
      const assigneeUser = await tx.user.findUnique({ where: { id: firstAssignee }, select: { email: true, name: true } });
      const workItem = await tx.workItem.findUnique({ where: { id: workItemId } });
      await NotificationService.createForStageAssignee(
        tx,
        firstStage.id,
        firstAssignee,
        "ASSIGNMENT",
        "Stage Assigned",
        `You have been assigned to stage "${firstStageTemplate.name}" of Work Item.`,
        `/employee/work/${workItemId}`
      );
      if (assigneeUser) {
        EmailService.sendStageAssigned({
          recipientEmail: assigneeUser.email,
          recipientName: assigneeUser.name,
          stageName: firstStageTemplate.name,
          workNumber: workItem?.workNumber ?? "",
          workTitle: workItem?.title ?? "",
          workItemId,
        });
      }
    }

    // Create the rest of the stages as LOCKED
    for (let i = 1; i < version.stages.length; i++) {
      const stageTemplate = version.stages[i];
      const assignee = stageAssignments?.[stageTemplate.id];
      const hasAssignee = assignee && assignee !== "none";

      const restStage = await tx.workItemStage.create({
        data: {
          workItemId,
          stageTemplateId: stageTemplate.id,
          status: 'LOCKED',
          capabilityId: stageTemplate.capabilityId,
          isPoolItem: hasAssignee ? false : stageTemplate.isDefaultOpenPool,
          assignedUserId: hasAssignee ? assignee : null,
        }
      });

      // Send assignment notification for subsequent stages too (so they know they are assigned)
      if (hasAssignee) {
        const assigneeUser = await tx.user.findUnique({ where: { id: assignee }, select: { email: true, name: true } });
        const workItem = await tx.workItem.findUnique({ where: { id: workItemId } });
        await NotificationService.createForStageAssignee(
          tx,
          restStage.id,
          assignee,
          "ASSIGNMENT",
          "Stage Assigned (Scheduled)",
          `You have been assigned to stage "${stageTemplate.name}" (currently locked) of Work Item.`,
          `/employee/work/${workItemId}`
        );
        if (assigneeUser) {
          EmailService.sendStageAssigned({
            recipientEmail: assigneeUser.email,
            recipientName: assigneeUser.name,
            stageName: stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workTitle: workItem?.title ?? "",
            workItemId,
          });
        }
      }
    }

    return firstStage.id;
  }
}
