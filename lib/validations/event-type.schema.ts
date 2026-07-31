import { z } from "zod";

export const EventTypeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});

export const EventTypeUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});
