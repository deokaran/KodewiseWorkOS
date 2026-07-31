"use server";

import { requireAuth, requireRole } from "@/lib/auth/utils";
import { LeaveRequestService } from "@/services/LeaveRequestService";
import { LeaveType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function requestLeaveAction(data: {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  try {
    const authUser = await requireAuth();

    const request = await LeaveRequestService.requestLeave(authUser.id, {
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason
    });

    revalidatePath("/employee/leaves");
    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");

    return { success: true as const, data: request };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to submit leave request" };
  }
}

export async function approveLeaveAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");

    const request = await LeaveRequestService.approveLeave(id);

    revalidatePath("/employee/leaves");
    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");

    return { success: true as const, data: request };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to approve leave request" };
  }
}

export async function rejectLeaveAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");

    const request = await LeaveRequestService.rejectLeave(id);

    revalidatePath("/employee/leaves");
    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");

    return { success: true as const, data: request };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to reject leave request" };
  }
}
