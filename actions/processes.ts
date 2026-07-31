"use server";

import { requireRole } from "@/lib/auth/utils";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { ProcessTemplateCreateSchema, ProcessTemplateUpdateSchema } from "@/lib/validations/process.schema";
import { revalidatePath } from "next/cache";

export async function createProcessAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ProcessTemplateCreateSchema.parse(data);
    const process = await ProcessTemplateService.create(parsed);
    revalidatePath("/tl/processes");
    return { success: true as const, data: process };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create process" };
  }
}

export async function updateProcessAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ProcessTemplateUpdateSchema.parse(data);
    const process = await ProcessTemplateService.update(parsed);
    revalidatePath("/tl/processes");
    revalidatePath(`/tl/processes/${process.id}`);
    return { success: true as const, data: process };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update process" };
  }
}

export async function archiveProcessAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ProcessTemplateService.archive(id);
    revalidatePath("/tl/processes");
    revalidatePath(`/tl/processes/${id}`);
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to archive process" };
  }
}
