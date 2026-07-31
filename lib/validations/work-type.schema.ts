import { z } from "zod";

export const WorkTypeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isDeliverable: z.boolean().default(false),
});

export const WorkTypeUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  isDeliverable: z.boolean(),
});
