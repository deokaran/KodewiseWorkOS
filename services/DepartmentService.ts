import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { DepartmentCreateSchema, DepartmentUpdateSchema } from "@/lib/validations/department.schema";
import { z } from "zod";

export class DepartmentService {
  static async list() {
    return prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: "asc" }
    });
  }

  static async getById(id: string) {
    return prisma.department.findUnique({
      where: { id }
    });
  }

  static async create(data: z.infer<typeof DepartmentCreateSchema>) {
    const existing = await prisma.department.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new AppError("Department name already exists", "NAME_EXISTS");
    }

    return prisma.department.create({
      data: { name: data.name }
    });
  }

  static async update(data: z.infer<typeof DepartmentUpdateSchema>) {
    const existing = await prisma.department.findUnique({ where: { id: data.id } });
    if (!existing) throw new AppError("Department not found", "NOT_FOUND", 404);

    const dupName = await prisma.department.findFirst({
      where: { name: data.name, id: { not: data.id } }
    });
    if (dupName) {
      throw new AppError("Department name already in use", "NAME_EXISTS");
    }

    return prisma.department.update({
      where: { id: data.id },
      data: { name: data.name }
    });
  }

  static async delete(id: string) {
    const usersCount = await prisma.user.count({ where: { departmentId: id, deletedAt: null } });
    if (usersCount > 0) {
      throw new AppError("Cannot delete department with active users assigned", "DEPT_HAS_USERS");
    }

    return prisma.department.delete({ where: { id } });
  }
}
