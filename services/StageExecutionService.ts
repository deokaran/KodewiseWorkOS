import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { StageProgressionService } from "./StageProgressionService";
import { StageStatus } from "@prisma/client";
import { NotificationService } from "./NotificationService";
import { EmailService } from "./EmailService";

export class StageExecutionService {
  static async startStage(stageId: string, userId: string, userRole: string) {
    return prisma.$transaction(async (tx) => {
      const stage = await tx.workItemStage.findUnique({
        where: { id: stageId },
        include: { stageTemplate: true }
      });

      if (!stage) throw new AppError("Stage not found", "NOT_FOUND", 404);
      if (stage.status !== "READY" && stage.status !== "REJECTED") {
         throw new AppError(`Cannot start stage in status ${stage.status}`, "INVALID_STATE", 400);
      }

      if (stage.assignedUserId && stage.assignedUserId !== userId && userRole !== "TEAM_LEADER") {
        throw new AppError("This stage is assigned to another user", "FORBIDDEN", 403);
      }

      const updated = await tx.workItemStage.update({
        where: { id: stageId },
        data: {
          status: "IN_PROGRESS",
          assignedUserId: stage.assignedUserId || userId, // Assign if not already
          startedAt: stage.startedAt || new Date(),
          statusChangedAt: new Date()
        }
      });
      
      await tx.auditLog.create({
        data: {
          action: 'STARTED',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, message: `Started stage ${stage.stageTemplate.name}` }
        }
      });

      // Notify and Email all TLs
      const assigneeUser = await tx.user.findUnique({
        where: { id: stage.assignedUserId || userId },
        select: { name: true }
      });
      const workItem = await tx.workItem.findUnique({
        where: { id: stage.workItemId },
        select: { workNumber: true, title: true }
      });
      const tls = await tx.user.findMany({
        where: { role: "TEAM_LEADER", deletedAt: null },
        select: { id: true, email: true, name: true }
      });

      const { NotificationType } = await import("@prisma/client");
      await NotificationService.createForTLs(
        tx,
        NotificationType.SYSTEM_ALERT,
        "WORK_ITEM_STAGE",
        stage.id,
        "Stage Started",
        `${assigneeUser?.name ?? "An employee"} started working on stage "${stage.stageTemplate.name}" of Work Item ${workItem?.workNumber}.`,
        `/tl/work/${stage.workItemId}`
      );

      EmailService.sendStageStarted({
        tlEmails: tls.map(t => t.email),
        employeeName: assigneeUser?.name ?? "Employee",
        stageName: stage.stageTemplate.name,
        workNumber: workItem?.workNumber ?? "",
        workTitle: workItem?.title ?? "",
        workItemId: stage.workItemId
      });

      return updated;
    });
  }

  static async submitStage(stageId: string, userId: string, userRole: string) {
    return prisma.$transaction(async (tx) => {
      const stage = await tx.workItemStage.findUnique({
        where: { id: stageId },
        include: { stageTemplate: true }
      });

      if (!stage) throw new AppError("Stage not found", "NOT_FOUND", 404);
      if (stage.status !== "IN_PROGRESS" && stage.status !== "REJECTED") {
        throw new AppError("Only in-progress stages can be submitted", "INVALID_STATE", 400);
      }

      if (stage.assignedUserId && stage.assignedUserId !== userId && userRole !== "TEAM_LEADER") {
        throw new AppError("This stage is assigned to another user", "FORBIDDEN", 403);
      }

      // NO TL APPROVAL and NO CLIENT ACCEPTANCE -> COMPLETE directly
      const requiresAction = stage.stageTemplate.requiresTLApproval || stage.stageTemplate.requiresManualClientAcceptance;
      
      const nextStatus = requiresAction ? "SUBMITTED" : "COMPLETED";

      const updated = await tx.workItemStage.update({
        where: { id: stageId },
        data: {
          status: nextStatus,
          submittedAt: new Date(),
          statusChangedAt: new Date(),
          ...(nextStatus === "COMPLETED" ? { completedAt: new Date() } : {})
        }
      });

      await tx.auditLog.create({
        data: {
          action: nextStatus === "COMPLETED" ? 'STAGE_COMPLETED' : 'SUBMITTED',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, message: `Submitted stage ${stage.stageTemplate.name}` }
        }
      });

      if (nextStatus === "SUBMITTED") {
        // Get work item and submitter info for emails
        const workItem = await tx.workItem.findUnique({
          where: { id: stage.workItemId },
          include: { primaryBrandTag: true }
        });
        const submitter = stage.assignedUserId
          ? await tx.user.findUnique({ where: { id: stage.assignedUserId }, select: { name: true } })
          : null;
        const tls = await tx.user.findMany({
          where: { role: "TEAM_LEADER", deletedAt: null },
          select: { id: true, email: true, name: true }
        });

        await NotificationService.createForTLs(
          tx,
          "APPROVAL_REQUIRED",
          "WORK_ITEM_STAGE",
          stage.id,
          "Stage Requires Approval",
          `Stage ${stage.stageTemplate.name} has been submitted and requires review.`,
          `/tl/work/${stage.workItemId}`
        );

        // Email each TL
        for (const tl of tls) {
          EmailService.sendStageSubmittedToTL({
            recipientEmail: tl.email,
            recipientName: tl.name,
            employeeName: submitter?.name ?? "An employee",
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workTitle: workItem?.title ?? "",
            workItemId: stage.workItemId,
          });
        }

        // Email other co-assignees assigned to other stages of this work item
        const siblingStages = await tx.workItemStage.findMany({
          where: { workItemId: stage.workItemId, id: { not: stage.id } },
          include: { assignedUser: true }
        });

        const otherAssignees = siblingStages
          .map(s => s.assignedUser)
          .filter((u): u is NonNullable<typeof u> => u !== null && u.id !== stage.assignedUserId);

        const uniqueOtherAssignees = Array.from(new Map(otherAssignees.map(u => [u.id, u])).values());

        for (const coEmp of uniqueOtherAssignees) {
          EmailService.sendStageSubmittedToCoAssignee({
            recipientEmail: coEmp.email,
            recipientName: coEmp.name,
            employeeName: submitter?.name ?? "An employee",
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workTitle: workItem?.title ?? "",
            workItemId: stage.workItemId,
          });
        }
      }

      if (nextStatus === "COMPLETED") {
        const workItem = await tx.workItem.findUnique({
          where: { id: stage.workItemId }
        });
        const assignee = stage.assignedUserId
          ? await tx.user.findUnique({ where: { id: stage.assignedUserId }, select: { email: true, name: true } })
          : null;
        const tls = await tx.user.findMany({
          where: { role: "TEAM_LEADER", deletedAt: null },
          select: { id: true, email: true, name: true }
        });

        // Notify and email assignee (if any)
        if (stage.assignedUserId && assignee) {
          await NotificationService.createForStageAssignee(
            tx,
            stage.id,
            stage.assignedUserId,
            "TL_APPROVED",
            "Stage Completed",
            `Stage ${stage.stageTemplate.name} has been completed.`,
            `/employee/work/${stage.workItemId}`
          );
          EmailService.sendStageCompletedDirectly({
            recipientEmail: assignee.email,
            recipientName: assignee.name,
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workTitle: workItem?.title ?? "",
            workItemId: stage.workItemId
          });
        }

        // Notify and email all TLs
        await NotificationService.createForTLs(
          tx,
          "SYSTEM_ALERT",
          "WORK_ITEM_STAGE",
          stage.id,
          "Stage Completed Directly",
          `Stage ${stage.stageTemplate.name} of Work Item ${workItem?.workNumber} was completed directly by ${assignee?.name ?? "an employee"}.`,
          `/tl/work/${stage.workItemId}`
        );

        for (const tl of tls) {
          EmailService.sendStageCompletedDirectly({
            recipientEmail: tl.email,
            recipientName: tl.name,
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workTitle: workItem?.title ?? "",
            workItemId: stage.workItemId
          });
        }

        await StageProgressionService.unlockNextStage(tx, stage.workItemId, stage.id);
      }

      return updated;
    });
  }
  
  static async approveStage(stageId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const stage = await tx.workItemStage.findUnique({
        where: { id: stageId },
        include: { stageTemplate: true }
      });

      if (!stage) throw new AppError("Stage not found", "NOT_FOUND", 404);
      if (stage.status !== "SUBMITTED") {
        throw new AppError("Stage is not pending review", "INVALID_STATE", 400);
      }

      // First move to APPROVED temporarily
      await tx.workItemStage.update({
        where: { id: stageId },
        data: { status: "APPROVED", statusChangedAt: new Date() }
      });
      
      // Then automatically move to COMPLETED
      const updated = await tx.workItemStage.update({
        where: { id: stageId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          statusChangedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'TL_APPROVED',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, message: `Approved stage ${stage.stageTemplate.name}` }
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'STAGE_COMPLETED',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, message: `Completed stage ${stage.stageTemplate.name}` }
        }
      });

      if (stage.assignedUserId) {
        const assignee = await tx.user.findUnique({ where: { id: stage.assignedUserId }, select: { email: true, name: true } });
        const workItem = await tx.workItem.findUnique({ where: { id: stage.workItemId } });
        await NotificationService.createForStageAssignee(
          tx,
          stage.id,
          stage.assignedUserId,
          "TL_APPROVED",
          "Stage Approved",
          `Your submission for stage ${stage.stageTemplate.name} was approved.`,
          `/employee/work/${stage.workItemId}`
        );
        if (assignee) {
          EmailService.sendStageApproved({
            recipientEmail: assignee.email,
            recipientName: assignee.name,
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workItemId: stage.workItemId,
          });
        }
      }

      await StageProgressionService.unlockNextStage(tx, stage.workItemId, stage.id);

      return updated;
    });
  }

  static async markClientAccepted(stageId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const stage = await tx.workItemStage.findUnique({
        where: { id: stageId },
        include: { stageTemplate: true }
      });

      if (!stage) throw new AppError("Stage not found", "NOT_FOUND", 404);
      if (stage.status !== "SUBMITTED" && stage.status !== "COMPLETED") { // Sometimes it might be submitted
        throw new AppError("Stage cannot be client accepted in current status", "INVALID_STATE", 400);
      }

      const updated = await tx.workItemStage.update({
        where: { id: stageId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          statusChangedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CLIENT_ACCEPTED_BY_TL',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, message: `Client accepted stage ${stage.stageTemplate.name}` }
        }
      });

      if (stage.assignedUserId) {
        const assignee = await tx.user.findUnique({ where: { id: stage.assignedUserId }, select: { email: true, name: true } });
        const workItem = await tx.workItem.findUnique({ where: { id: stage.workItemId } });
        await NotificationService.createForStageAssignee(
          tx,
          stage.id,
          stage.assignedUserId,
          "CLIENT_ACCEPTED_BY_TL",
          "Client Accepted",
          `The client has accepted the work for stage ${stage.stageTemplate.name}.`,
          `/employee/work/${stage.workItemId}`
        );
        if (assignee) {
          EmailService.sendClientAccepted({
            recipientEmail: assignee.email,
            recipientName: assignee.name,
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workItemId: stage.workItemId,
          });
        }
      }

      await StageProgressionService.unlockNextStage(tx, stage.workItemId, stage.id);

      return updated;
    });
  }

  static async rejectStage(stageId: string, userId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const stage = await tx.workItemStage.findUnique({
        where: { id: stageId },
        include: { stageTemplate: true }
      });

      if (!stage) throw new AppError("Stage not found", "NOT_FOUND", 404);
      if (stage.status !== "SUBMITTED") {
        throw new AppError("Stage cannot be rejected in current status", "INVALID_STATE", 400);
      }

      const updated = await tx.workItemStage.update({
        where: { id: stageId },
        data: {
          status: "REJECTED",
          statusChangedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'TL_REJECTED',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, reason, message: `Rejected stage ${stage.stageTemplate.name}` }
        }
      });

      if (stage.assignedUserId) {
        const assignee = await tx.user.findUnique({ where: { id: stage.assignedUserId }, select: { email: true, name: true } });
        const workItem = await tx.workItem.findUnique({ where: { id: stage.workItemId } });
        await NotificationService.createForStageAssignee(
          tx,
          stage.id,
          stage.assignedUserId,
          "TL_REJECTED",
          "Stage Rejected",
          `Your submission for stage ${stage.stageTemplate.name} was rejected. Reason: ${reason}`,
          `/employee/work/${stage.workItemId}`
        );
        if (assignee) {
          EmailService.sendStageRejected({
            recipientEmail: assignee.email,
            recipientName: assignee.name,
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            reason,
            workItemId: stage.workItemId,
          });
        }
      }

      return updated;
    });
  }

  static async skipStage(stageId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const stage = await tx.workItemStage.findUnique({
        where: { id: stageId },
        include: { stageTemplate: true }
      });

      if (!stage) throw new AppError("Stage not found", "NOT_FOUND", 404);

      const updated = await tx.workItemStage.update({
        where: { id: stageId },
        data: {
          status: "SKIPPED",
          statusChangedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'SKIPPED',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, message: `Skipped stage ${stage.stageTemplate.name}` }
        }
      });

      if (stage.assignedUserId) {
        const assignee = await tx.user.findUnique({ where: { id: stage.assignedUserId }, select: { email: true, name: true } });
        const workItem = await tx.workItem.findUnique({ where: { id: stage.workItemId } });
        await NotificationService.createForStageAssignee(
          tx,
          stage.id,
          stage.assignedUserId,
          "SYSTEM_ALERT",
          "Stage Skipped",
          `Your assigned stage "${stage.stageTemplate.name}" was skipped.`,
          `/employee/work/${stage.workItemId}`
        );
        if (assignee) {
          EmailService.sendStageSkipped({
            recipientEmail: assignee.email,
            recipientName: assignee.name,
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workItemId: stage.workItemId
          });
        }
      }

      await StageProgressionService.unlockNextStage(tx, stage.workItemId, stage.id);

      return updated;
    });
  }

  static async cancelStage(stageId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const stage = await tx.workItemStage.findUnique({
        where: { id: stageId },
        include: { stageTemplate: true }
      });

      if (!stage) throw new AppError("Stage not found", "NOT_FOUND", 404);

      const updated = await tx.workItemStage.update({
        where: { id: stageId },
        data: {
          status: "CANCELLED",
          statusChangedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CANCELLED',
          workItemId: stage.workItemId,
          userId,
          metadata: { stageId, message: `Cancelled stage ${stage.stageTemplate.name}` }
        }
      });

      if (stage.assignedUserId) {
        const assignee = await tx.user.findUnique({ where: { id: stage.assignedUserId }, select: { email: true, name: true } });
        const workItem = await tx.workItem.findUnique({ where: { id: stage.workItemId } });
        await NotificationService.createForStageAssignee(
          tx,
          stage.id,
          stage.assignedUserId,
          "SYSTEM_ALERT",
          "Stage Cancelled",
          `Your assigned stage "${stage.stageTemplate.name}" was cancelled.`,
          `/employee/work/${stage.workItemId}`
        );
        if (assignee) {
          EmailService.sendStageCancelled({
            recipientEmail: assignee.email,
            recipientName: assignee.name,
            stageName: stage.stageTemplate.name,
            workNumber: workItem?.workNumber ?? "",
            workItemId: stage.workItemId
          });
        }
      }

      await StageProgressionService.unlockNextStage(tx, stage.workItemId, stage.id);

      return updated;
    });
  }
}
