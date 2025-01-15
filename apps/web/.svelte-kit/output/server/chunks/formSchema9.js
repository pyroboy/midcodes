import { z } from "zod";
const TenantStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "BLACKLISTED"
]);
const emergencyContactSchema = z.object({
  name: z.string().min(1, "Emergency contact name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").nullable(),
  address: z.string().min(1, "Address is required")
});
const tenantSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  contact_number: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters").nullable().optional(),
  tenant_status: TenantStatusEnum.default("PENDING"),
  auth_id: z.string().uuid("Invalid UUID format").nullable().optional(),
  created_by: z.string().uuid("Invalid UUID format").nullable().optional(),
  emergency_contact: emergencyContactSchema.optional().nullable()
});
tenantSchema.partial();
const tenantResponseSchema = tenantSchema.extend({
  id: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable().optional()
});
const tenantFormSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  contact_number: z.string().min(1, "Contact number is required").nullable().optional(),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters").nullable().optional(),
  tenant_status: TenantStatusEnum.default("PENDING"),
  auth_id: z.string().uuid("Invalid UUID format").nullable().optional(),
  created_by: z.string().uuid("Invalid UUID format").nullable().optional(),
  emergency_contact: emergencyContactSchema.nullable(),
  lease_status: z.string().optional(),
  lease_type: z.string().optional(),
  lease_id: z.number().nullable().optional(),
  location_id: z.number().nullable().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  rent_amount: z.number().optional(),
  security_deposit: z.number().optional(),
  outstanding_balance: z.number().optional(),
  notes: z.string().optional(),
  last_payment_date: z.string().nullable().optional(),
  next_payment_due: z.string().nullable().optional(),
  payment_schedules: z.array(z.any()).optional(),
  status_history: z.array(z.any()).optional(),
  status_change_reason: z.string().max(500, "Reason must be less than 500 characters").nullable().optional()
});
export {
  TenantStatusEnum as T,
  tenantResponseSchema as a,
  tenantFormSchema as t
};
