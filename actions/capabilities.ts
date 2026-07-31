"use server";

import { requireRole } from "@/lib/auth/utils";
import { CapabilityService } from "@/services/CapabilityService";
import { CapabilityCreateSchema, CapabilityUpdateSchema } from "@/lib/validations/capability.schema";
import { revalidatePath } from "next/cache";

export async function createCapabilityAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = CapabilityCreateSchema.parse(data);
    const capability = await CapabilityService.create(parsed);
    revalidatePath("/tl/settings/capabilities");
    return { success: true as const, data: capability };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create capability" };
  }
}

export async function updateCapabilityAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = CapabilityUpdateSchema.parse(data);
    const capability = await CapabilityService.update(parsed);
    revalidatePath("/tl/settings/capabilities");
    return { success: true as const, data: capability };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update capability" };
  }
}
