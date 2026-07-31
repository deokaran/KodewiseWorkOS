import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { WorkItemCreateSchema, WorkItemUpdateSchema } from "@/lib/validations/work-item.schema";
import { z } from "zod";
import { WorkNumberService } from "./WorkNumberService";
import { ProcessRunService } from "./ProcessRunService";
import { NotificationService } from "./NotificationService";
import { EmailService } from "./EmailService";
import { decrypt } from "@/lib/crypto";

function decryptClientInWorkItem<T extends {
  client?: {
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}>(item: T): T {
  if (item && item.client) {
    item.client = {
      ...item.client,
      contactPerson: decrypt(item.client.contactPerson),
      email: decrypt(item.client.email),
      phone: decrypt(item.client.phone),
      address: decrypt(item.client.address),
    };
  }
  return item;
}

export class WorkItemService {
  static async list(filters?: any) {
    const items = await prisma.workItem.findMany({
      where: { ...filters },
      include: {
        primaryBrandTag: true,
        client: true,
        workType: true,
        processVersion: {
          include: { template: true }
        },
        currentStage: {
          include: { stageTemplate: true }
        },
        tags: {
          include: { tag: true }
        },
        createdBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return items.map(decryptClientInWorkItem);
  }

  static async getById(id: string) {
    const item = await prisma.workItem.findUnique({
      where: { id },
      include: {
        primaryBrandTag: true,
        client: true,
        workType: true,
        processVersion: {
          include: { template: true }
        },
        currentStage: {
          include: { stageTemplate: true }
        },
        stages: {
          include: {
            stageTemplate: true,
            capability: true,
            assignedUser: true
          },
          orderBy: {
            stageTemplate: { order: 'asc' }
          }
        },
        tags: {
          include: { tag: true }
        },
        parent: true,
        children: true,
        createdBy: true,
        auditLogs: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return item ? decryptClientInWorkItem(item) : null;
  }

  static async create(data: z.infer<typeof WorkItemCreateSchema>, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 0. Verify and fallback userId to avoid constraint violations after database seeds
      let dbUser = await tx.user.findUnique({ where: { id: userId } });
      if (!dbUser) {
        dbUser = await tx.user.findFirst({ where: { role: 'TEAM_LEADER' } });
      }
      const actualUserId = dbUser ? dbUser.id : userId;

      // 1. Get published process version
      let templateId = data.processTemplateId;
      if (!templateId || templateId === "none") {
        const adhoc = await tx.processTemplate.findFirst({
          where: { name: { contains: "General" } },
          include: { versions: { where: { isPublished: true } } }
        }) || await tx.processTemplate.findFirst({
          include: { versions: { where: { isPublished: true } } }
        });
        if (adhoc) {
          templateId = adhoc.id;
        }
      }

      const template = await tx.processTemplate.findUnique({
        where: { id: templateId || undefined },
        include: { versions: { where: { isPublished: true } } }
      });

      if (!template || template.versions.length === 0) {
        throw new AppError("Process Template not found or has no published version", "NOT_FOUND", 404);
      }
      
      const processVersionId = template.versions[0].id;

      // 2. Generate Work Number
      const workNumber = await WorkNumberService.generateWorkNumber(tx, data.primaryBrandTagId, data.clientId);

      // 3. Create Work Item shell
      const workItem = await tx.workItem.create({
        data: {
          workNumber,
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority,
          primaryBrandTagId: data.primaryBrandTagId,
          clientId: data.clientId,
          workTypeId: data.workTypeId,
          processVersionId,
          parentId: data.parentId,
          estimatedEnd: data.estimatedEnd,
          createdById: actualUserId,
          tags: {
            create: data.tags.map(tagId => ({ tagId }))
          }
        }
      });

      // 4. Initialize Process Run (clone stages)
      const assignments = { ...data.stageAssignments };
      if ((!data.processTemplateId || data.processTemplateId === "none") && data.assigneeId) {
        const firstStageTemplate = await tx.processStageTemplate.findFirst({
          where: { versionId: processVersionId }
        });
        if (firstStageTemplate) {
          assignments[firstStageTemplate.id] = data.assigneeId;
        }
      }

      const firstStageId = await ProcessRunService.initializeWorkItemStages(tx, workItem.id, processVersionId, assignments);

      // 5. Update WorkItem with currentStageId
      const finalWorkItem = await tx.workItem.update({
        where: { id: workItem.id },
        data: { currentStageId: firstStageId }
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'CREATED',
          workItemId: workItem.id,
          userId: actualUserId,
          metadata: { message: "Work item created" }
        }
      });

      // 7. Notification (in-app + email)
      const tls = await tx.user.findMany({
        where: { role: "TEAM_LEADER", deletedAt: null },
        select: { id: true, email: true, name: true }
      });

      await NotificationService.createForTLs(
        tx,
        "ASSIGNMENT",
        "WORK_ITEM",
        workItem.id,
        "New Work Item Created",
        `Work Item ${workItem.workNumber} (${workItem.title}) has been created.`,
        `/tl/work/${workItem.id}`
      );

      // Email all TLs
      for (const tl of tls) {
        EmailService.sendWorkItemCreated({
          recipientEmail: tl.email,
          recipientName: tl.name,
          workNumber: workItem.workNumber,
          title: workItem.title,
          brand: (workItem as any).primaryBrandTag?.name ?? "N/A",
          priority: (workItem as any).priority ?? "NORMAL",
          workItemId: workItem.id,
        });
      }

      return finalWorkItem;
    });
  }

  static async update(data: z.infer<typeof WorkItemUpdateSchema>, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.workItem.findUnique({
        where: { id: data.id },
        include: { tags: true }
      });

      if (!existing) throw new AppError("Work Item not found", "NOT_FOUND", 404);

      // Delete existing tags and recreate
      await tx.workItemTag.deleteMany({
        where: { workItemId: data.id }
      });

      const updated = await tx.workItem.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          clientId: data.clientId,
          workTypeId: data.workTypeId,
          estimatedEnd: data.estimatedEnd,
          tags: {
            create: data.tags.map(tagId => ({ tagId }))
          }
        }
      });

      return updated;
    });
  }

  static async archive(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.workItem.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          action: 'WORK_ARCHIVED',
          workItemId: id,
          userId,
          metadata: { message: "Work item archived" }
        }
      });

      return updated;
    });
  }
}
