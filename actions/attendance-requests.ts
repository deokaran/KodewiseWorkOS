"use server";

import { requireAuth, requireRole } from "@/lib/auth/utils";
import { AttendanceRequestService } from "@/services/AttendanceRequestService";
import { revalidatePath } from "next/cache";

export async function createAttendanceRequestAction(data: {
  clockIn: string;
  clockOut?: string;
  workLocation: "IN_OFFICE" | "WORK_FROM_HOME";
  reason?: string;
  attendanceId?: string;
}) {
  try {
    const authUser = await requireAuth();

    const clockIn = new Date(data.clockIn);
    const clockOut = data.clockOut ? new Date(data.clockOut) : null;

    if (clockOut && clockOut < clockIn) {
      throw new Error("Clock-out time cannot be before clock-in time.");
    }

    const request = await AttendanceRequestService.createRequest(authUser.id, {
      clockIn,
      clockOut,
      workLocation: data.workLocation,
      reason: data.reason,
      attendanceId: data.attendanceId,
    });

    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");

    return { success: true as const, data: request };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to submit attendance request" };
  }
}

export async function approveAttendanceRequestAction(requestId: string) {
  try {
    await requireRole("TEAM_LEADER");
    await AttendanceRequestService.approveRequest(requestId);
    
    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");
    
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to approve attendance request" };
  }
}

export async function rejectAttendanceRequestAction(requestId: string) {
  try {
    await requireRole("TEAM_LEADER");
    await AttendanceRequestService.rejectRequest(requestId);

    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");

    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to reject attendance request" };
  }
}

export async function getMonthlyPendingRequestsAction(year: number, month: number, targetUserId?: string) {
  try {
    const user = await requireAuth();
    let queryUserId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      if (user.role !== "TEAM_LEADER") {
        throw new Error("Forbidden");
      }
      queryUserId = targetUserId;
    }

    const { prisma } = await import("@/lib/db/prisma");
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const requests = await prisma.attendanceRequest.findMany({
      where: {
        userId: queryUserId,
        clockIn: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    return {
      success: true as const,
      data: requests.map(r => ({
        id: r.id,
        attendanceId: r.attendanceId,
        type: r.type,
        clockIn: r.clockIn.toISOString(),
        clockOut: r.clockOut ? r.clockOut.toISOString() : null,
        workLocation: r.workLocation,
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt.toISOString()
      }))
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to fetch pending requests" };
  }
}
