import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { ProcessTemplateCreateSchema, ProcessTemplateUpdateSchema } from "@/lib/validations/process.schema";
import { z } from "zod";

export class ProcessTemplateService {
  static async list() {
    return prisma.processTemplate.findMany({
      where: { deletedAt: null },
      include: {
        versions: {
          where: { deletedAt: null },
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: { capability: true }
            }
          },
          orderBy: { version: 'desc' }
        },
        _count: {
          select: { versions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getById(id: string) {
    return prisma.processTemplate.findUnique({
      where: { id },
      include: {
        versions: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: { stages: true, workItems: true }
            }
          },
          orderBy: { version: 'desc' }
        }
      }
    });
  }

  static async create(data: z.infer<typeof ProcessTemplateCreateSchema>) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.processTemplate.create({
        data: {
          name: data.name,
          description: data.description,
        }
      });

      // Automatically create v1
      await tx.processTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          isPublished: false
        }
      });

      return template;
    });
  }

  static async update(data: z.infer<typeof ProcessTemplateUpdateSchema>) {
    return prisma.processTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
      }
    });
  }

  static async archive(id: string) {
    return prisma.processTemplate.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
