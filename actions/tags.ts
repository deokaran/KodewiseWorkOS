"use server";

import { requireRole } from "@/lib/auth/utils";
import { TagService } from "@/services/TagService";
import { TagCreateSchema, TagUpdateSchema } from "@/lib/validations/tag.schema";
import { revalidatePath } from "next/cache";

export async function createTagAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = TagCreateSchema.parse(data);
    const tag = await TagService.create(parsed);
    revalidatePath("/tl/settings/tags");
    return { success: true as const, data: tag };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create tag" };
  }
}

export async function updateTagAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = TagUpdateSchema.parse(data);
    const tag = await TagService.update(parsed);
    revalidatePath("/tl/settings/tags");
    return { success: true as const, data: tag };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update tag" };
  }
}

export async function deleteTagAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");
    await TagService.softDelete(id);
    revalidatePath("/tl/settings/tags");
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete tag" };
  }
}
