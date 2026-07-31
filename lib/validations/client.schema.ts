import { z } from "zod";

export const ClientCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clientCode: z.string().optional(),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const ClientUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  clientCode: z.string().optional(),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
