import { z } from 'zod';
import type { Database } from '$lib/database.types';

export const paymentMethodEnum = {
  Values: {
    CASH: 'CASH',
    BANK: 'BANK',
    GCASH: 'GCASH',
    OTHER: 'OTHER'
  }
} as const;

export type PaymentMethod = keyof typeof paymentMethodEnum.Values;

export const billingTypeEnum = z.enum(['RENT', 'UTILITY', 'PENALTY', 'MAINTENANCE', 'SERVICE']);
export const paymentStatusEnum = z.enum(['PENDING', 'PAID', 'OVERDUE']);
export const utilityTypeEnum = z.enum(['ELECTRICITY', 'WATER', 'INTERNET']);
export const paymentFrequencyEnum = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME']);

export const billingSchema = z.object({
  id: z.number(),
  lease_id: z.number(),
  type: billingTypeEnum,
  utility_type: utilityTypeEnum.optional().nullable(),
  amount: z.number(),
  paid_amount: z.number().default(0),
  balance: z.number(),
  status: paymentStatusEnum.default('PENDING'),
  due_date: z.string(),
  billing_date: z.string(),
  penalty_amount: z.number().default(0),
  notes: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional().nullable()
});

export const paymentScheduleSchema = z.object({
  id: z.number(),
  lease_id: z.number(),
  due_date: z.string(),
  expected_amount: z.number(),
  type: billingTypeEnum.default('RENT'),
  frequency: paymentFrequencyEnum,
  status: paymentStatusEnum.default('PENDING'),
  notes: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional().nullable()
});

export const penaltyConfigSchema = z.object({
  id: z.number(),
  type: billingTypeEnum,
  grace_period: z.number(),
  penalty_percentage: z.number(),
  compound_period: z.number().optional().nullable(),
  max_penalty_percentage: z.number().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional().nullable()
});

// Type exports
export type Billing = z.infer<typeof billingSchema>;
export type PaymentSchedule = z.infer<typeof paymentScheduleSchema>;
export type PenaltyConfig = z.infer<typeof penaltyConfigSchema>;

// Extended types with relationships
export interface ExtendedPayment {
  id: number;
  paid_at: string;
  amount: number;
  amount_paid: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  method: PaymentMethod;
  reference_number?: string | null;
  billing?: {
    id: number;
    type: string;
    utility_type?: string | null;
    lease?: {
      id: number;
      name: string;
      tenant?: {
        id: number;
        name: string;
        email: string;
      };
    };
  };
}

// Alias for backward compatibility
export type Transaction = ExtendedPayment;
