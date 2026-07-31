"use server";

import { requireRole } from "@/lib/auth/utils";
import { WorkTypeService } from "@/services/WorkTypeService";
import { WorkTypeCreateSchema, WorkTypeUpdateSchema } from "@/lib/validations/work-type.schema";
import { revalidatePath } from "next/cache";

export async function createWorkTypeAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = WorkTypeCreateSchema.parse(data);
    const workType = await WorkTypeService.create(parsed);
    revalidatePath("/tl/settings/work-types");
    return { success: true as const, data: workType };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create work type" };
  }
}

export async function updateWorkTypeAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = WorkTypeUpdateSchema.parse(data);
    const workType = await WorkTypeService.update(parsed);
    revalidatePath("/tl/settings/work-types");
    return { success: true as const, data: workType };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update work type" };
  }
}
