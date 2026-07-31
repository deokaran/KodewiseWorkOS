"use server";

import { requireAuth } from "@/lib/auth/utils";
import { AttendanceService } from "@/services/AttendanceService";
import { revalidatePath } from "next/cache";

export async function clockInAction(workLocation?: "IN_OFFICE" | "WORK_FROM_HOME") {
  try {
    const user = await requireAuth();
    const session = await AttendanceService.clockIn(user.id, workLocation);
    revalidatePath("/");
    return {
      success: true as const,
      data: {
        id: session.id,
        userId: session.userId,
        clockIn: session.clockIn.toISOString(),
        clockOut: null,
        workLocation: session.workLocation,
        createdAt: session.createdAt.toISOString()
      }
    };
  } catch (error: any) {
    console.error("Error in clockInAction:", error);
    return { success: false as const, error: error.message || "Failed to clock in" };
  }
}

export async function clockOutAction() {
  try {
    const user = await requireAuth();
    const session = await AttendanceService.clockOut(user.id);
    revalidatePath("/");
    return {
      success: true as const,
      data: {
        id: session.id,
        userId: session.userId,
        clockIn: session.clockIn.toISOString(),
        clockOut: session.clockOut ? session.clockOut.toISOString() : null,
        workLocation: session.workLocation,
        createdAt: session.createdAt.toISOString()
      }
    };
  } catch (error: any) {
    console.error("Error in clockOutAction:", error);
    return { success: false as const, error: error.message || "Failed to clock out" };
  }
}

export async function getActiveSessionAction() {
  try {
    const user = await requireAuth();
    const session = await AttendanceService.getActiveSession(user.id);
    if (!session) return { success: true as const, data: null };
    return {
      success: true as const,
      data: {
        id: session.id,
        userId: session.userId,
        clockIn: session.clockIn.toISOString(),
        clockOut: null,
        workLocation: session.workLocation,
        createdAt: session.createdAt.toISOString()
      }
    };
  } catch (error: any) {
    console.error("Error in getActiveSessionAction:", error);
    return { success: false as const, error: error.message || "Failed to get active session" };
  }
}

export async function getTodaySessionsAction() {
  try {
    const user = await requireAuth();
    const sessions = await AttendanceService.getTodaySessions(user.id);
    const serialized = sessions.map(s => ({
      id: s.id,
      userId: s.userId,
      clockIn: s.clockIn.toISOString(),
      clockOut: s.clockOut ? s.clockOut.toISOString() : null,
      workLocation: s.workLocation,
      createdAt: s.createdAt.toISOString()
    }));
    return { success: true as const, data: serialized };
  } catch (error: any) {
    console.error("Error in getTodaySessionsAction:", error);
    return { success: false as const, error: error.message || "Failed to get today's sessions" };
  }
}

export async function getMonthlyAttendanceAction(year: number, month: number, targetUserId?: string) {
  try {
    const user = await requireAuth();
    
    let queryUserId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      if (user.role !== "TEAM_LEADER") {
        throw new Error("Forbidden: Only Team Leaders can view other users' attendance.");
      }
      queryUserId = targetUserId;
    }

    const sessions = await AttendanceService.getMonthlyAttendance(queryUserId, year, month);
    const serialized = sessions.map(s => ({
      id: s.id,
      userId: s.userId,
      clockIn: s.clockIn.toISOString(),
      clockOut: s.clockOut ? s.clockOut.toISOString() : null,
      workLocation: s.workLocation,
      createdAt: s.createdAt.toISOString()
    }));
    return { success: true as const, data: serialized };
  } catch (error: any) {
    console.error("Error in getMonthlyAttendanceAction:", error);
    return { success: false as const, error: error.message || "Failed to get monthly attendance" };
  }
}
