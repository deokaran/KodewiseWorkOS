import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { WorkTypeCreateSchema, WorkTypeUpdateSchema } from "@/lib/validations/work-type.schema";
import { z } from "zod";

export class WorkTypeService {
  static async list() {
    return prisma.workType.findMany({
      orderBy: { name: "asc" }
    });
  }

  static async create(data: z.infer<typeof WorkTypeCreateSchema>) {
    return prisma.workType.create({
      data: {
        name: data.name,
        isDeliverable: data.isDeliverable
      }
    });
  }

  static async update(data: z.infer<typeof WorkTypeUpdateSchema>) {
    return prisma.workType.update({
      where: { id: data.id },
      data: {
        name: data.name,
        isDeliverable: data.isDeliverable
      }
    });
  }
}
