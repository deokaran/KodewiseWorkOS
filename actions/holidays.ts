"use server";

import { requireRole } from "@/lib/auth/utils";
import { HolidayService } from "@/services/HolidayService";
import { revalidatePath } from "next/cache";

export async function createHolidayAction(data: { title: string; date: string }) {
  try {
    await requireRole("TEAM_LEADER");
    
    if (!data.title.trim()) {
      throw new Error("Holiday title is required");
    }

    const holiday = await HolidayService.createHoliday(data.title.trim(), new Date(data.date));
    
    revalidatePath("/calendar");
    return { success: true as const, data: holiday };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create holiday" };
  }
}

export async function deleteHolidayAction(id: string) {
  try {
    await requireRole("TEAM_LEADER");
    
    await HolidayService.deleteHoliday(id);
    
    revalidatePath("/calendar");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete holiday" };
  }
}
