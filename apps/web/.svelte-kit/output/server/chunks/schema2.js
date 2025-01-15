import { z } from "zod";
const paymentMethodEnum = {
  Values: {
    CASH: "CASH",
    BANK: "BANK",
    GCASH: "GCASH",
    OTHER: "OTHER"
  }
};
const billingTypeEnum = z.enum(["RENT", "UTILITY", "PENALTY", "MAINTENANCE", "SERVICE"]);
const paymentStatusEnum = z.enum(["PENDING", "PAID", "OVERDUE"]);
const utilityTypeEnum = z.enum(["ELECTRICITY", "WATER", "INTERNET"]);
const paymentFrequencyEnum = z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"]);
z.object({
  id: z.number(),
  lease_id: z.number(),
  type: billingTypeEnum,
  utility_type: utilityTypeEnum.optional().nullable(),
  amount: z.number(),
  paid_amount: z.number().default(0),
  balance: z.number(),
  status: paymentStatusEnum.default("PENDING"),
  due_date: z.string(),
  billing_date: z.string(),
  penalty_amount: z.number().default(0),
  notes: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional().nullable()
});
z.object({
  id: z.number(),
  lease_id: z.number(),
  due_date: z.string(),
  expected_amount: z.number(),
  type: billingTypeEnum.default("RENT"),
  frequency: paymentFrequencyEnum,
  status: paymentStatusEnum.default("PENDING"),
  notes: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional().nullable()
});
z.object({
  id: z.number(),
  type: billingTypeEnum,
  grace_period: z.number(),
  penalty_percentage: z.number(),
  compound_period: z.number().optional().nullable(),
  max_penalty_percentage: z.number().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional().nullable()
});
const transactionFilterSchema = z.object({
  status: z.enum(["PENDING", "PAID", "OVERDUE", "ALL"]),
  method: z.enum(["CASH", "BANK", "GCASH", "OTHER"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  searchTerm: z.string().optional()
});
export {
  paymentMethodEnum as p,
  transactionFilterSchema as t
};
