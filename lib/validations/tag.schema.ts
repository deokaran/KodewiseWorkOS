import { z } from "zod";
import { TagType } from "@prisma/client";

export const TagCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(TagType),
  color: z.string().optional(),
  icon: z.string().optional(),
  prefix: z.string().optional(),
}).refine(data => {
  if (data.type === TagType.BRAND && !data.prefix) {
    return false;
  }
  return true;
}, {
  message: "Prefix is required for Brand tags",
  path: ["prefix"],
});

export const TagUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(TagType),
  color: z.string().optional(),
  icon: z.string().optional(),
});
