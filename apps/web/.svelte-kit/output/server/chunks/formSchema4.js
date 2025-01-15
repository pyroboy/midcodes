import { z } from "zod";
const leaseStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "TERMINATED",
  "EXPIRED"
]);
const leaseSchema = z.object({
  id: z.coerce.number().optional(),
  tenantIds: z.array(z.number()).min(1, "At least one tenant must be selected"),
  rental_unit_id: z.coerce.number().min(1, "A rental unit must be selected"),
  name: z.string().optional(),
  status: leaseStatusEnum,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" }).refine((val) => val.trim() !== "", { message: "Date is required" }),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" }).refine((val) => val.trim() !== "", { message: "Date is required" }),
  terms_month: z.coerce.number().int().min(1).max(60),
  security_deposit: z.coerce.number().min(0),
  rent_amount: z.coerce.number().min(0),
  notes: z.string().max(1e3).optional(),
  balance: z.coerce.number().optional().default(0)
});
export {
  leaseSchema as l
};
