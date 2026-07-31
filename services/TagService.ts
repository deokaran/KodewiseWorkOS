import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { TagCreateSchema, TagUpdateSchema } from "@/lib/validations/tag.schema";
import { z } from "zod";
import { TagType } from "@prisma/client";

export class TagService {
  static async list() {
    return prisma.tag.findMany({
      where: { deletedAt: null },
      include: { brandSequence: true },
      orderBy: { name: "asc" }
    });
  }

  static async create(data: z.infer<typeof TagCreateSchema>) {
    return prisma.$transaction(async (tx) => {
      const tag = await tx.tag.create({
        data: {
          name: data.name,
          type: data.type,
          color: data.color,
          icon: data.icon,
        }
      });

      if (data.type === TagType.BRAND && data.prefix) {
        await tx.brandSequence.create({
          data: {
            tagId: tag.id,
            prefix: data.prefix,
            lastNumber: 0
          }
        });
      }

      return tag;
    });
  }

  static async update(data: z.infer<typeof TagUpdateSchema>) {
    return prisma.tag.update({
      where: { id: data.id },
      data: {
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
      }
    });
  }

  static async softDelete(id: string) {
    return prisma.tag.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
