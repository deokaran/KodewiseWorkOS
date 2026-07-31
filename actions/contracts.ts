"use server";

import { requireRole } from "@/lib/auth/utils";
import { ContractService } from "@/services/ContractService";
import { ContractCreateSchema, ContractUpdateSchema } from "@/lib/validations/contract.schema";
import { revalidatePath } from "next/cache";

export async function createContractAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ContractCreateSchema.parse(data);
    const contract = await ContractService.create(parsed);
    revalidatePath(`/tl/clients/${parsed.clientId}`);
    return { success: true as const, data: contract };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create contract" };
  }
}

export async function updateContractAction(data: unknown, clientId: string) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = ContractUpdateSchema.parse(data);
    const contract = await ContractService.update(parsed);
    revalidatePath(`/tl/clients/${clientId}`);
    return { success: true as const, data: contract };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update contract" };
  }
}

export async function deactivateContractAction(id: string, clientId: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ContractService.deactivate(id);
    revalidatePath(`/tl/clients/${clientId}`);
    return { success: true as const, data: null };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to deactivate contract" };
  }
}
