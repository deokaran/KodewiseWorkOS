import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import { ProcessStageCreateSchema, ProcessStageUpdateSchema, ProcessStageReorderSchema } from "@/lib/validations/process-stage.schema";

export class ProcessStageService {
  static async create(data: z.infer<typeof ProcessStageCreateSchema>) {
    return prisma.$transaction(async (tx) => {
      let order = data.order;
      if (order === undefined) {
        const lastStage = await tx.processStageTemplate.findFirst({
          where: { versionId: data.versionId },
          orderBy: { order: 'desc' }
        });
        order = lastStage ? lastStage.order + 1 : 0;
      } else {
        // shift existing stages down if we are inserting
        await tx.processStageTemplate.updateMany({
          where: { versionId: data.versionId, order: { gte: order } },
          data: { order: { increment: 1 } }
        });
      }

      return tx.processStageTemplate.create({
        data: {
          versionId: data.versionId,
          name: data.name,
          order,
          capabilityId: data.capabilityId || null,
          estimatedDurationMins: data.estimatedDurationMins,
          instructions: data.instructions,
          requiresTLApproval: data.requiresTLApproval,
          requiresManualClientAcceptance: data.requiresManualClientAcceptance,
          isDefaultOpenPool: data.isDefaultOpenPool,
          deadlineRule: data.deadlineRule as any,
        }
      });
    });
  }

  static async update(data: z.infer<typeof ProcessStageUpdateSchema>) {
    return prisma.processStageTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        capabilityId: data.capabilityId || null,
        estimatedDurationMins: data.estimatedDurationMins,
        instructions: data.instructions,
        requiresTLApproval: data.requiresTLApproval,
        requiresManualClientAcceptance: data.requiresManualClientAcceptance,
        isDefaultOpenPool: data.isDefaultOpenPool,
        deadlineRule: data.deadlineRule as any,
      }
    });
  }

  static async reorder(data: z.infer<typeof ProcessStageReorderSchema>) {
    return prisma.$transaction(async (tx) => {
      // data.stageIds is an array of IDs in the new order
      for (let i = 0; i < data.stageIds.length; i++) {
        await tx.processStageTemplate.update({
          where: { id: data.stageIds[i] },
          data: { order: i }
        });
      }
    });
  }

  static async delete(id: string) {
    return prisma.processStageTemplate.delete({
      where: { id }
    });
  }
}
