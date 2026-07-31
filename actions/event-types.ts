"use server";

import { requireRole } from "@/lib/auth/utils";
import { EventTypeService } from "@/services/EventTypeService";
import { EventTypeCreateSchema, EventTypeUpdateSchema } from "@/lib/validations/event-type.schema";
import { revalidatePath } from "next/cache";

export async function createEventTypeAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = EventTypeCreateSchema.parse(data);
    const eventType = await EventTypeService.create(parsed);
    revalidatePath("/tl/settings/event-types");
    return { success: true as const, data: eventType };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to create event type" };
  }
}

export async function updateEventTypeAction(data: unknown) {
  try {
    await requireRole("TEAM_LEADER");
    const parsed = EventTypeUpdateSchema.parse(data);
    const eventType = await EventTypeService.update(parsed);
    revalidatePath("/tl/settings/event-types");
    return { success: true as const, data: eventType };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to update event type" };
  }
}
