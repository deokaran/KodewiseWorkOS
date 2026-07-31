import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { CapabilityCreateSchema, CapabilityUpdateSchema } from "@/lib/validations/capability.schema";
import { z } from "zod";

export class CapabilityService {
  static async list() {
    return prisma.capability.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: "asc" }
    });
  }

  static async create(data: z.infer<typeof CapabilityCreateSchema>) {
    return prisma.capability.create({
      data: { name: data.name }
    });
  }

  static async update(data: z.infer<typeof CapabilityUpdateSchema>) {
    return prisma.capability.update({
      where: { id: data.id },
      data: { name: data.name }
    });
  }
}
