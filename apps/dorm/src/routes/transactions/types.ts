import type { z } from 'zod';
import type { 
  transactionSchema,
  paymentMethodEnum,
  transactionStatusEnum,
  dateRangeSchema,
  transactionFilterSchema
} from './schema';
import type { SuperValidated, SuperForm } from 'sveltekit-superforms';

// Export types from schema
export type Transaction = z.infer<typeof transactionSchema> & {
  lease_name?: string | null;
};
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export type TransactionStatus = z.infer<typeof transactionStatusEnum>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// Additional types for the UI
export interface TransactionTableRow {
  id?: number;
  method: PaymentMethod;
  amount: number;
  paid_by: string;
  paid_at: string | null;
  receipt_url: string | null;
  reference_number: string | null;
  lease_name?: string | null;
  tenant_name?: string;
  unit_name?: string;
  created_by_name?: string;
  updated_by_name?: string;
}

// Extended Transaction interface with profile data
export interface TransactionWithProfiles extends Transaction {
  created_by_profile?: {
    id: string;
    full_name: string;
    [key: string]: any;
  };
  updated_by_profile?: {
    id: string;
    full_name: string;
    [key: string]: any;
  };
  billing_lease?: any;
  lease_name?: string | null;
}

export interface TransactionFilterOptions {
  method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
  search_term?: string;
}

// Profile interface for creators/updaters
export interface Profile {
  id: string;
  full_name: string;
  [key: string]: any;
}

// User interface
export interface User {
  id: string;
  full_name: string;
  [key: string]: any;
}

// Database table structure based on the SQL definition
export interface PaymentDB {
  id: number;
  amount: number;
  method: PaymentMethod;
  reference_number: string | null;
  paid_by: string;
  paid_at: string; // timestamp
  notes: string | null;
  created_at: string; // timestamp
  receipt_url: string | null;
  created_by: string | null; // UUID
  updated_by: string | null; // UUID
  updated_at: string | null; // timestamp
  billing_ids: number[];
  billing_changes: any; // JSONB
}

// Generic form props helper type
export type FormProps<T extends z.ZodTypeAny> = {
  form: z.infer<T>;
  errors: Record<string, string | string[] | undefined>;
  enhance: SuperForm<SuperValidated<z.infer<T>, unknown, z.infer<T>>>['enhance'];
  constraints?: Record<string, unknown>;
  submitting?: boolean;
  editMode?: boolean;
};

// Specific form props type
export type TransactionFormProps = FormProps<typeof transactionSchema>;

// Receipt details interface
export interface ReceiptDetails {
  id: number;
  url: string;
  filename: string;
  uploadedAt: string;
  fileSize?: number;
}

// Billing details interface
export interface BillingDetails {
  id: number;
  amount: number;
  description: string;
  status: string;
  dueDate: string;
  tenantName?: string;
  unitName?: string;
}
