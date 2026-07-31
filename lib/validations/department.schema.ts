import { z } from "zod";

export const DepartmentCreateSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

export const DepartmentUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Department name is required"),
});
