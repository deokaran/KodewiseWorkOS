import { z } from "zod";

export const CapabilityCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const CapabilityUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
});
