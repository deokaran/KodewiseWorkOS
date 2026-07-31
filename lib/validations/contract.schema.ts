import { z } from "zod";

export const ContractCreateSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  monthlyTarget: z.number().int().nonnegative(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const ContractUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  monthlyTarget: z.number().int().nonnegative(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});
