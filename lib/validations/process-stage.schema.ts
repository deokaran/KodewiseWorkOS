import { z } from "zod";

export const ProcessStageCreateSchema = z.object({
  versionId: z.string().min(1, "Version ID is required"),
  name: z.string().min(1, "Name is required"),
  capabilityId: z.string().optional().nullable(),
  estimatedDurationMins: z.coerce.number().int().nonnegative().default(0),
  instructions: z.string().optional().nullable(),
  requiresTLApproval: z.boolean().default(false),
  requiresManualClientAcceptance: z.boolean().default(false),
  isDefaultOpenPool: z.boolean().default(false),
  deadlineRule: z.any().optional().nullable(),
  order: z.number().int().optional(),
});

export const ProcessStageUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  capabilityId: z.string().optional().nullable(),
  estimatedDurationMins: z.coerce.number().int().nonnegative().default(0),
  instructions: z.string().optional().nullable(),
  requiresTLApproval: z.boolean().default(false),
  requiresManualClientAcceptance: z.boolean().default(false),
  isDefaultOpenPool: z.boolean().default(false),
  deadlineRule: z.any().optional().nullable(),
});

export const ProcessStageReorderSchema = z.object({
  versionId: z.string().min(1, "Version ID is required"),
  stageIds: z.array(z.string()), // ordered list of stage IDs
});
