import { z } from "zod";
const billingTypeEnum = {
  enumValues: ["RENT", "UTILITY", "PENALTY", "MAINTENANCE", "SERVICE"]
};
const utilityTypeEnum = {
  enumValues: ["ELECTRICITY", "WATER", "INTERNET"]
};
const paymentStatusEnum = {
  enumValues: ["PENDING", "PARTIAL", "PAID", "OVERDUE"]
};
const billingSchema = z.object({
  id: z.number().optional(),
  leaseId: z.number(),
  type: z.enum(billingTypeEnum.enumValues),
  utilityType: z.enum(utilityTypeEnum.enumValues).optional(),
  amount: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  balance: z.number().min(0),
  status: z.enum(paymentStatusEnum.enumValues).default("PENDING"),
  dueDate: z.date(),
  billingDate: z.date(),
  penaltyAmount: z.number().min(0).default(0),
  notes: z.string().optional()
});
export {
  billingSchema as b
};
