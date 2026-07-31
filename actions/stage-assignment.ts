"use server";

import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { formatError } from "@/lib/utils";

import { EmailService } from "@/services/EmailService";

export async function assignStageToUserAction(stageId: string, userId: string) {
  try {
    await requireRole("TEAM_LEADER");
    
    const stage = await prisma.workItemStage.update({
      where: { id: stageId },
      data: {
        assignedUserId: userId,
        statusChangedAt: new Date()
      },
      include: { 
        workItem: true,
        assignedUser: true,
        stageTemplate: true
      }
    });

    if (stage.assignedUser?.email) {
      EmailService.sendStageAssigned({
        recipientEmail: stage.assignedUser.email,
        recipientName: stage.assignedUser.name,
        stageName: stage.stageTemplate.name,
        workNumber: stage.workItem.workNumber,
        workTitle: stage.workItem.title,
        workItemId: stage.workItemId,
      });
    }

    revalidatePath("/tl/team");
    revalidatePath(`/tl/team/${userId}`);
    revalidatePath(`/tl/work/${stage.workItemId}`);

    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to assign stage" };
  }
}
