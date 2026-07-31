"use server";

import { requireRole } from "@/lib/auth/utils";
import { ClientService } from "@/services/ClientService";
import { ClientCreateSchema, ClientUpdateSchema } from "@/lib/validations/client.schema";
import { revalidatePath } from "next/cache";
import { formatError } from "@/lib/utils";

export async function createClientAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ClientCreateSchema.parse(data);
    const client = await ClientService.create(parsed);
    revalidatePath("/tl/clients");
    return { success: true as const, data: client };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to create client" };
  }
}

export async function updateClientAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ClientUpdateSchema.parse(data);
    const client = await ClientService.update(parsed);
    revalidatePath("/tl/clients");
    revalidatePath(`/tl/clients/${parsed.id}`);
    return { success: true as const, data: client };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to update client" };
  }
}

export async function archiveClientAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ClientService.archive(id);
    revalidatePath("/tl/clients");
    revalidatePath(`/tl/clients/${id}`);
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to archive client" };
  }
}

export async function restoreClientAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ClientService.restore(id);
    revalidatePath("/tl/clients");
    revalidatePath(`/tl/clients/${id}`);
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to restore client" };
  }
}
