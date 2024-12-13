// src/routes/accounts/formSchema.ts

import { z } from "zod";
import { accountTypeEnum, accountCategoryEnum } from '$lib/db/schema';

export const accountSchema = z.object({
  id: z.number().optional(),
  leaseId: z.number(),
  type: z.enum(accountTypeEnum.enumValues),
  category: z.enum(accountCategoryEnum.enumValues),
  amount: z.number().min(0),
  paidAmount: z.number().min(0).optional(),
//   balance: z.number().min(0).optional(),
  notes: z.string().optional(),
  dateIssued: z.string(),
  dueOn: z.string().optional(),
//   utilityBillingId: z.number().optional(),
//   rentBillingId: z.number().optional(),
//   penaltyBillingId: z.number().optional(),
//   createdBy: z.number().optional(),
//   createdAt: z.string().optional(),
//   updatedBy: z.number().optional(),
//   updatedAt: z.string().optional(),
//   originalAccountId: z.number().optional(),
//   lastPenaltyDate: z.string().optional(),
//   totalPenaltyAmount: z.number().min(0).optional(),
//   penaltyDays: z.number().min(0).optional(),
});

export type AccountSchema = typeof accountSchema;