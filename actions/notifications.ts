"use server";

import { requireAuth } from "@/lib/auth/utils";
import { NotificationService } from "@/services/NotificationService";
import { revalidatePath } from "next/cache";

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const user = await requireAuth();
    await NotificationService.markAsRead(notificationId, user.id);
    
    // Revalidate paths where notification bell or list might be
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const user = await requireAuth();
    await NotificationService.markAllAsRead(user.id);
    
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}
