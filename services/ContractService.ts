import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { ContractCreateSchema, ContractUpdateSchema } from "@/lib/validations/contract.schema";
import { z } from "zod";

export class ContractService {
  static async listByClient(clientId: string) {
    return prisma.contract.findMany({
      where: { clientId },
      orderBy: { startDate: "desc" }
    });
  }

  static async create(data: z.infer<typeof ContractCreateSchema>) {
    return prisma.$transaction(async (tx) => {
      // If setting this one as active, we should probably deactivate others for this client
      // But the requirement just says "Only one active contract at a time."
      if (data.isActive) {
        await tx.contract.updateMany({
          where: { clientId: data.clientId, isActive: true },
          data: { isActive: false }
        });
      }

      return tx.contract.create({
        data: {
          clientId: data.clientId,
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyTarget: data.monthlyTarget,
          notes: data.notes,
          isActive: data.isActive
        }
      });
    });
  }

  static async update(data: z.infer<typeof ContractUpdateSchema>) {
    const existing = await prisma.contract.findUnique({ where: { id: data.id } });
    if (!existing) throw new AppError("Contract not found", "NOT_FOUND", 404);

    return prisma.$transaction(async (tx) => {
      if (data.isActive && !existing.isActive) {
        await tx.contract.updateMany({
          where: { clientId: existing.clientId, isActive: true, id: { not: data.id } },
          data: { isActive: false }
        });
      }

      return tx.contract.update({
        where: { id: data.id },
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyTarget: data.monthlyTarget,
          notes: data.notes,
          isActive: data.isActive
        }
      });
    });
  }

  static async deactivate(id: string) {
    return prisma.contract.update({
      where: { id },
      data: { isActive: false }
    });
  }
}
