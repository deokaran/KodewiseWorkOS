import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import { ProcessVersionCreateSchema, ProcessVersionUpdateSchema } from "@/lib/validations/process-version.schema";

export class ProcessVersionService {
  static async getById(id: string) {
    return prisma.processTemplateVersion.findUnique({
      where: { id },
      include: {
        template: true,
        stages: {
          orderBy: { order: 'asc' },
          include: { capability: true }
        }
      }
    });
  }

  static async duplicate(versionId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.processTemplateVersion.findUnique({
        where: { id: versionId },
        include: { stages: { orderBy: { order: 'asc' } } }
      });

      if (!existing) throw new AppError("Version not found", "NOT_FOUND", 404);

      // get latest version number
      const latest = await tx.processTemplateVersion.findFirst({
        where: { templateId: existing.templateId },
        orderBy: { version: 'desc' }
      });

      const nextVersion = (latest?.version || 0) + 1;

      const newVersion = await tx.processTemplateVersion.create({
        data: {
          templateId: existing.templateId,
          version: nextVersion,
          isPublished: false,
        }
      });

      // copy stages
      if (existing.stages.length > 0) {
        await tx.processStageTemplate.createMany({
          data: existing.stages.map(stage => ({
            versionId: newVersion.id,
            name: stage.name,
            order: stage.order,
            capabilityId: stage.capabilityId,
            estimatedDurationMins: stage.estimatedDurationMins,
            instructions: stage.instructions,
            requiresTLApproval: stage.requiresTLApproval,
            requiresManualClientAcceptance: stage.requiresManualClientAcceptance,
            isDefaultOpenPool: stage.isDefaultOpenPool,
            deadlineRule: stage.deadlineRule as any,
          }))
        });
      }

      return newVersion;
    });
  }

  static async publish(id: string) {
    return prisma.$transaction(async (tx) => {
      const version = await tx.processTemplateVersion.findUnique({
        where: { id }
      });

      if (!version) throw new AppError("Version not found", "NOT_FOUND", 404);

      // Unpublish all other versions of this template
      await tx.processTemplateVersion.updateMany({
        where: { templateId: version.templateId, id: { not: id } },
        data: { isPublished: false }
      });

      return tx.processTemplateVersion.update({
        where: { id },
        data: { isPublished: true }
      });
    });
  }

  static async unpublish(id: string) {
    return prisma.processTemplateVersion.update({
      where: { id },
      data: { isPublished: false }
    });
  }

  static async archive(id: string) {
    return prisma.processTemplateVersion.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
