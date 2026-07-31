import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { EventTypeCreateSchema, EventTypeUpdateSchema } from "@/lib/validations/event-type.schema";
import { z } from "zod";

export class EventTypeService {
  static async list() {
    return prisma.eventType.findMany({
      orderBy: { name: "asc" }
    });
  }

  static async create(data: z.infer<typeof EventTypeCreateSchema>) {
    return prisma.eventType.create({
      data: {
        name: data.name,
        color: data.color
      }
    });
  }

  static async update(data: z.infer<typeof EventTypeUpdateSchema>) {
    return prisma.eventType.update({
      where: { id: data.id },
      data: {
        name: data.name,
        color: data.color
      }
    });
  }
}
