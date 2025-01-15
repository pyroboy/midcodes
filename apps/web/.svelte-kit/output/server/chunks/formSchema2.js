import { z } from "zod";
z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string(),
  country: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
  is_active: z.boolean().default(true)
});
const expenseTypeEnum = z.enum(["MAINTENANCE", "UTILITIES", "SUPPLIES", "SALARY", "OTHERS"]);
const expenseStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
const expenseSchema = z.object({
  id: z.number().optional(),
  property_id: z.number(),
  expense_date: z.string(),
  expense_type: expenseTypeEnum,
  expense_status: expenseStatusEnum.default("PENDING"),
  amount: z.number().positive(),
  description: z.string(),
  receipt_url: z.string().optional(),
  notes: z.string().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
({
  expense_status: "PENDING",
  expense_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
});
export {
  expenseStatusEnum as a,
  expenseSchema as b,
  expenseTypeEnum as e
};
