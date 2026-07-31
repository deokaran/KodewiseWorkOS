import { z } from "zod";
import { Role } from "@prisma/client";

export const UserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  roles: z.array(z.nativeEnum(Role)).min(1, "At least one role is required"),
  capabilities: z.array(z.string()).optional(),
  brandId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  allowedPaid: z.number().int().min(0).optional(),
  allowedCasual: z.number().int().min(0).optional(),
  allowedSick: z.number().int().min(0).optional(),
});

export const UserUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  roles: z.array(z.nativeEnum(Role)).min(1, "At least one role is required"),
  capabilities: z.array(z.string()).optional(),
  brandId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  allowedPaid: z.number().int().min(0).optional(),
  allowedCasual: z.number().int().min(0).optional(),
  allowedSick: z.number().int().min(0).optional(),
  consecutivePunctualDays: z.number().int().min(0).optional(),
});
