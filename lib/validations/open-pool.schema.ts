import { z } from "zod";

export const claimPoolStageSchema = z.object({
  stageId: z.string().uuid(),
});

export const assignPoolStageSchema = z.object({
  stageId: z.string().uuid(),
  assigneeUserId: z.string().uuid(),
});
