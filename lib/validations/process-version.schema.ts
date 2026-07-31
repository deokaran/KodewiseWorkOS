import { z } from "zod";

export const ProcessVersionCreateSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
});

export const ProcessVersionUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  isPublished: z.boolean(),
});
