"use server";

import { requireAuth } from "@/lib/auth/utils";
import { StageExecutionService } from "@/services/StageExecutionService";
import { revalidatePath } from "next/cache";
import { stageActionSchema, rejectStageSchema } from "./stage-execution.schema";

export async function startStageAction(stageId: string, workItemId: string) {
  try {
    const user = await requireAuth();
    const parsed = stageActionSchema.parse({ stageId, workItemId });
    await StageExecutionService.startStage(parsed.stageId, user.id, user.role);
    
    revalidatePath(`/tl/work/${parsed.workItemId}`);
    revalidatePath(`/employee/work/${parsed.workItemId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function submitStageAction(stageId: string, workItemId: string) {
  try {
    const user = await requireAuth();
    const parsed = stageActionSchema.parse({ stageId, workItemId });
    await StageExecutionService.submitStage(parsed.stageId, user.id, user.role);
    
    revalidatePath(`/tl/work/${parsed.workItemId}`);
    revalidatePath(`/employee/work/${parsed.workItemId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function approveStageAction(stageId: string, workItemId: string) {
  try {
    const user = await requireAuth();
    if (user.role !== "TEAM_LEADER") {
      throw new Error("Only team leaders can approve stages");
    }
    const parsed = stageActionSchema.parse({ stageId, workItemId });
    await StageExecutionService.approveStage(parsed.stageId, user.id);
    
    revalidatePath(`/tl/work/${parsed.workItemId}`);
    revalidatePath(`/employee/work/${parsed.workItemId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function rejectStageAction(stageId: string, workItemId: string, reason: string) {
  try {
    const user = await requireAuth();
    if (user.role !== "TEAM_LEADER") {
      throw new Error("Only team leaders can reject stages");
    }
    const parsed = rejectStageSchema.parse({ stageId, workItemId, reason });
    await StageExecutionService.rejectStage(parsed.stageId, user.id, parsed.reason);
    
    revalidatePath(`/tl/work/${parsed.workItemId}`);
    revalidatePath(`/employee/work/${parsed.workItemId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function markClientAcceptedAction(stageId: string, workItemId: string) {
  try {
    const user = await requireAuth();
    if (user.role !== "TEAM_LEADER") {
      throw new Error("Only team leaders can mark stages as client accepted");
    }
    const parsed = stageActionSchema.parse({ stageId, workItemId });
    await StageExecutionService.markClientAccepted(parsed.stageId, user.id);
    
    revalidatePath(`/tl/work/${parsed.workItemId}`);
    revalidatePath(`/employee/work/${parsed.workItemId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function skipStageAction(stageId: string, workItemId: string) {
  try {
    const user = await requireAuth();
    if (user.role !== "TEAM_LEADER") {
      throw new Error("Only team leaders can skip stages");
    }
    const parsed = stageActionSchema.parse({ stageId, workItemId });
    await StageExecutionService.skipStage(parsed.stageId, user.id);
    
    revalidatePath(`/tl/work/${parsed.workItemId}`);
    revalidatePath(`/employee/work/${parsed.workItemId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function cancelStageAction(stageId: string, workItemId: string) {
  try {
    const user = await requireAuth();
    if (user.role !== "TEAM_LEADER") {
      throw new Error("Only team leaders can cancel stages");
    }
    const parsed = stageActionSchema.parse({ stageId, workItemId });
    await StageExecutionService.cancelStage(parsed.stageId, user.id);
    
    revalidatePath(`/tl/work/${parsed.workItemId}`);
    revalidatePath(`/employee/work/${parsed.workItemId}`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}
