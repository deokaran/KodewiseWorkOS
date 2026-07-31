"use server";

import { requireRole } from "@/lib/auth/utils";
import { UserService } from "@/services/UserService";
import { UserCreateSchema, UserUpdateSchema } from "@/lib/validations/user.schema";
import { revalidatePath } from "next/cache";
import { sanitizeForClient } from "@/lib/utils";

export async function createUserAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = UserCreateSchema.parse(data);
    const user = await UserService.create(parsed);
    revalidatePath("/tl/settings/team");
    return { success: true as const, data: sanitizeForClient(user) };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create user" };
  }
}

export async function updateUserAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = UserUpdateSchema.parse(data);
    const user = await UserService.update(parsed);
    revalidatePath("/tl/settings/team");
    return { success: true as const, data: sanitizeForClient(user) };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update user" };
  }
}

export async function deleteUserAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");
    await UserService.softDelete(id);
    revalidatePath("/tl/settings/team");
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete user" };
  }
}
