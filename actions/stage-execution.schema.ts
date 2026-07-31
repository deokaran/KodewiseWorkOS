import { z } from "zod";

export const stageActionSchema = z.object({
  stageId: z.string().uuid(),
  workItemId: z.string().uuid(),
});

export const rejectStageSchema = z.object({
  stageId: z.string().uuid(),
  workItemId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required"),
});
