"use server";

import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function createReminderAction(data: {
  title: string;
  description?: string;
  date: string;
}) {
  try {
    const authUser = await requireAuth();

    if (!data.title.trim()) {
      throw new Error("Reminder title is required.");
    }

    const reminder = await prisma.reminder.create({
      data: {
        title: data.title.trim(),
        description: data.description || null,
        date: new Date(data.date),
        userId: authUser.id,
      },
    });

    revalidatePath("/calendar");
    return { success: true as const, data: reminder };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create reminder" };
  }
}

export async function deleteReminderAction(id: string) {
  try {
    const authUser = await requireAuth();

    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new Error("Reminder not found.");
    }

    if (reminder.userId !== authUser.id) {
      throw new Error("You do not have permission to delete this reminder.");
    }

    await prisma.reminder.delete({
      where: { id },
    });

    revalidatePath("/calendar");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to delete reminder" };
  }
}
