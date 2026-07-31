"use server";

import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { formatError } from "@/lib/utils";

export async function assignStageToUserAction(stageId: string, userId: string) {
  try {
    await requireRole("TEAM_LEADER");
    
    const stage = await prisma.workItemStage.update({
      where: { id: stageId },
      data: {
        assignedUserId: userId,
        statusChangedAt: new Date()
      },
      include: { workItem: true }
    });

    revalidatePath("/tl/team");
    revalidatePath(`/tl/team/${userId}`);
    revalidatePath(`/tl/work/${stage.workItemId}`);

    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to assign stage" };
  }
}
