import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaymentStatus } from './formSchema';

interface PenaltyConfig {
  grace_period: number;
  penalty_percentage: number;
  compound_period?: number;
  max_penalty_percentage?: number;
}

interface Billing {
  id: number;
  lease_id: number;
  type: string;
  utility_type?: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  due_date: string;
  billing_date: string;
  penalty_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export async function calculatePenalty(
  billing: Billing,
  penaltyConfig: PenaltyConfig,
  currentDate: Date = new Date()
): Promise<number> {
  const dueDate = new Date(billing.due_date);
  const daysLate = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  // No penalty if within grace period
  if (daysLate <= penaltyConfig.grace_period) {
    return 0;
  }

  const effectiveDaysLate = daysLate - penaltyConfig.grace_period;
  let penaltyAmount = 0;

  if (penaltyConfig.compound_period && penaltyConfig.compound_period > 0) {
    // Compound penalty
    const compoundPeriods = Math.floor(effectiveDaysLate / penaltyConfig.compound_period);
    const baseAmount = billing.amount;
    penaltyAmount = baseAmount * (Math.pow(1 + penaltyConfig.penalty_percentage / 100, compoundPeriods) - 1);
  } else {
    // Simple penalty
    penaltyAmount = billing.amount * (penaltyConfig.penalty_percentage / 100);
  }

  // Cap penalty if max percentage is set
  if (penaltyConfig.max_penalty_percentage) {
    const maxPenalty = billing.amount * (penaltyConfig.max_penalty_percentage / 100);
    penaltyAmount = Math.min(penaltyAmount, maxPenalty);
  }

  return Math.round(penaltyAmount * 100) / 100; // Round to 2 decimal places
}

export function determinePaymentStatus(
  billing: Billing,
  currentDate: Date = new Date()
): PaymentStatus {
  const dueDate = new Date(billing.due_date);
  
  if (billing.balance === 0) {
    return 'PAID';
  }
  
  if (billing.paid_amount > 0 && billing.balance > 0) {
    return 'PARTIAL';
  }
  
  if (currentDate > dueDate) {
    return 'OVERDUE';
  }
  
  return 'PENDING';
}

export async function getPenaltyConfig(
  supabase: SupabaseClient,
  billingType: string
): Promise<PenaltyConfig | null> {
  try {
    const { data: penaltyConfig, error } = await supabase
      .from('penalty_configs')
      .select('*')
      .eq('type', billingType)
      .single();

    if (error) {
      console.error('Failed to get penalty config:', {
        billingType,
        error
      });
      throw new Error(`Failed to get penalty config: ${error.message}`);
    }

    return penaltyConfig;
  } catch (error) {
    console.error('Error in getPenaltyConfig:', error);
    throw error;
  }
}

export async function createPenaltyBilling(
  supabase: SupabaseClient,
  billing: Billing,
  penaltyAmount: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('billings')
      .insert({
        lease_id: billing.lease_id,
        type: 'PENALTY',
        amount: penaltyAmount,
        paid_amount: 0,
        balance: penaltyAmount,
        status: 'PENDING',
        due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        billing_date: new Date().toISOString().split('T')[0],
        notes: `Late payment penalty for billing #${billing.id}`,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create penalty billing:', {
        originalBillingId: billing.id,
        penaltyAmount,
        error
      });
      throw new Error(`Failed to create penalty billing: ${error.message}`);
    }

    console.log('Successfully created penalty billing:', {
      originalBillingId: billing.id,
      penaltyAmount,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
    });
  } catch (error) {
    console.error('Error in createPenaltyBilling:', error);
    throw error;
  }
}

export async function updateBillingStatus(
  supabase: SupabaseClient,
  billing: Billing,
  newPaidAmount: number
): Promise<void> {
  try {
    const newBalance = billing.amount - newPaidAmount;
    let newStatus: PaymentStatus = 'PENDING';

    if (newBalance <= 0) {
      newStatus = 'PAID';
    } else if (newBalance < billing.amount) {
      newStatus = 'PARTIAL';
    } else if (new Date() > new Date(billing.due_date)) {
      newStatus = 'OVERDUE';
    }

    const { error } = await supabase
      .from('billings')
      .update({
        paid_amount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', billing.id);

    if (error) {
      console.error('Failed to update billing status:', {
        billingId: billing.id,
        error,
        newStatus,
        newPaidAmount,
        newBalance
      });
      throw new Error(`Failed to update billing status: ${error.message}`);
    }

    console.log('Successfully updated billing status:', {
      billingId: billing.id,
      previousStatus: billing.status,
      newStatus,
      previousBalance: billing.balance,
      newBalance,
      previousPaidAmount: billing.paid_amount,
      newPaidAmount
    });
  } catch (error) {
    console.error('Error in updateBillingStatus:', error);
    throw error;
  }
}

export function getUTCTimestamp(): string {
  return new Date().toISOString();
}

export async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    action: string;
    user_id: string;
    user_role?: string;
    details: Record<string, any>;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action: event.action,
        user_id: event.user_id,
        user_role: event.user_role,
        module: 'payments',
        details: event.details,
        created_at: getUTCTimestamp()
      });

    if (error) {
      console.error('Failed to log audit event:', {
        event,
        error
      });
    }
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
  }
}
