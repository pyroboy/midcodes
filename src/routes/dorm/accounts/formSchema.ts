// src/routes/accounts/formSchema.ts

import { z } from "zod";

export const accountTypeEnum = {
    enumValues: ['CREDIT', 'DEBIT'] as const
} as const;

export const accountCategoryEnum = {
    enumValues: ['RENT', 'UTILITY', 'PENALTY', 'PAYMENT', 'DEPOSIT', 'OTHER'] as const
} as const;

export const accountSchema = z.object({
  id: z.number().optional(),
  leaseId: z.number(),
  type: z.enum(accountTypeEnum.enumValues),
  category: z.enum(accountCategoryEnum.enumValues),
  amount: z.number().min(0),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  dateIssued: z.string(),
  dueOn: z.string().optional(),
});

export type AccountSchema = typeof accountSchema;