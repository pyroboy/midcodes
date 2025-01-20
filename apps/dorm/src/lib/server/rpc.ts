import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

interface MonthlyBalanceParams {
  property_id: number;
  months: number;
}

interface MonthlyBalance {
  tenant_id: number;
  month: string;
  balance: number;
}

export async function getMonthlyBalances(
  supabase: SupabaseClient<Database>,
  params: MonthlyBalanceParams
): Promise<{ data: MonthlyBalance[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('get_tenant_monthly_balances', {
      p_property_id: params.property_id,
      p_months_back: params.months
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
