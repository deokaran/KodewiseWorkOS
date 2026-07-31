import { z } from "zod";
import { WorkItemType, Priority } from "@prisma/client";

const DateSchema = z.preprocess((val) => {
  if (typeof val === "string" && val) return new Date(val);
  if (val instanceof Date) return val;
  return null;
}, z.date().nullable().optional());

export const WorkItemCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(WorkItemType),
  priority: z.nativeEnum(Priority).default("MEDIUM"),
  primaryBrandTagId: z.string().min(1, "Primary Brand is required"),
  clientId: z.string().optional().nullable(),
  workTypeId: z.string().optional().nullable(),
  processTemplateId: z.string().optional().nullable(),
  description: z.string().optional(),
  estimatedEnd: DateSchema,
  parentId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  stageAssignments: z.record(z.string(), z.string()).optional(),
  assigneeId: z.string().optional().nullable(),
});

export const WorkItemUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  priority: z.nativeEnum(Priority).optional(),
  clientId: z.string().optional().nullable(),
  workTypeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  estimatedEnd: DateSchema,
  tags: z.array(z.string()).default([]),
});
