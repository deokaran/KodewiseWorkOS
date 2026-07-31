"use server";

import { requireRole } from "@/lib/auth/utils";
import { ProcessVersionService } from "@/services/ProcessVersionService";
import { revalidatePath } from "next/cache";

export async function duplicateVersionAction(id: string, templateId: string) {
  try {
    await requireRole("TEAM_LEADER");
    const newVersion = await ProcessVersionService.duplicate(id);
    revalidatePath(`/tl/processes/${templateId}`);
    return { success: true as const, data: newVersion };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to duplicate version" };
  }
}

export async function publishVersionAction(id: string, templateId: string) {
  try {
    await requireRole("TEAM_LEADER");
    const version = await ProcessVersionService.publish(id);
    revalidatePath(`/tl/processes/${templateId}`);
    return { success: true as const, data: version };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to publish version" };
  }
}

export async function unpublishVersionAction(id: string, templateId: string) {
  try {
    await requireRole("TEAM_LEADER");
    const version = await ProcessVersionService.unpublish(id);
    revalidatePath(`/tl/processes/${templateId}`);
    return { success: true as const, data: version };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to unpublish version" };
  }
}

export async function archiveVersionAction(id: string, templateId: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ProcessVersionService.archive(id);
    revalidatePath(`/tl/processes/${templateId}`);
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to archive version" };
  }
}
