"use server";

import { requireRole } from "@/lib/auth/utils";
import { ProcessStageService } from "@/services/ProcessStageService";
import { ProcessStageCreateSchema, ProcessStageUpdateSchema, ProcessStageReorderSchema } from "@/lib/validations/process-stage.schema";
import { revalidatePath } from "next/cache";

export async function createProcessStageAction(data: unknown, processId: string, versionId: string) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ProcessStageCreateSchema.parse(data);
    const stage = await ProcessStageService.create(parsed);
    revalidatePath(`/tl/processes/${processId}`);
    revalidatePath(`/tl/processes/${processId}/versions/${versionId}`);
    return { success: true as const, data: stage };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create stage" };
  }
}

export async function updateProcessStageAction(data: unknown, processId: string, versionId: string) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ProcessStageUpdateSchema.parse(data);
    const stage = await ProcessStageService.update(parsed);
    revalidatePath(`/tl/processes/${processId}`);
    revalidatePath(`/tl/processes/${processId}/versions/${versionId}`);
    return { success: true as const, data: stage };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update stage" };
  }
}

export async function reorderProcessStagesAction(data: unknown, processId: string, versionId: string) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ProcessStageReorderSchema.parse(data);
    await ProcessStageService.reorder(parsed);
    revalidatePath(`/tl/processes/${processId}`);
    revalidatePath(`/tl/processes/${processId}/versions/${versionId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to reorder stages" };
  }
}

export async function deleteProcessStageAction(id: string, processId: string, versionId: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ProcessStageService.delete(id);
    revalidatePath(`/tl/processes/${processId}`);
    revalidatePath(`/tl/processes/${processId}/versions/${versionId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete stage" };
  }
}
