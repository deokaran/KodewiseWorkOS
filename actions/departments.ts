"use server";

import { requireRole } from "@/lib/auth/utils";
import { DepartmentService } from "@/services/DepartmentService";
import { DepartmentCreateSchema, DepartmentUpdateSchema } from "@/lib/validations/department.schema";
import { revalidatePath } from "next/cache";

export async function createDepartmentAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = DepartmentCreateSchema.parse(data);
    const department = await DepartmentService.create(parsed);
    revalidatePath("/tl/settings/departments");
    return { success: true as const, data: department };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create department" };
  }
}

export async function updateDepartmentAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = DepartmentUpdateSchema.parse(data);
    const department = await DepartmentService.update(parsed);
    revalidatePath("/tl/settings/departments");
    return { success: true as const, data: department };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update department" };
  }
}

export async function deleteDepartmentAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");
    await DepartmentService.delete(id);
    revalidatePath("/tl/settings/departments");
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete department" };
  }
}
