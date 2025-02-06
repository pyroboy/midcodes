import type { SupabaseClient } from '@supabase/supabase-js';

export async function createPaymentSchedules(
  supabase: SupabaseClient,
  leaseId: number,
  startDate: string,
  endDate: string,
  monthlyRent: number,
  proratedAmount?: number | null
) {
  const schedules = [];
  const billings = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // Add prorated payment if exists
  if (proratedAmount) {
    schedules.push({
      lease_id: leaseId,
      due_date: startDate,
      expected_amount: proratedAmount,
      type: 'RENT',
      frequency: 'ONE_TIME',
      notes: 'Prorated rent'
    });

    billings.push({
      lease_id: leaseId,
      type: 'RENT',
      utility_type: null,
      amount: proratedAmount,
      paid_amount: 0,
      balance: proratedAmount,
      status: 'PENDING',
      due_date: startDate,
      billing_date: today.toISOString().split('T')[0],
      penalty_amount: 0,
      notes: 'Prorated rent billing'
    });
  }

  // Generate monthly schedules and billings
  let currentDate = new Date(start);
  if (proratedAmount) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1);
  }

  while (currentDate <= end) {
    const dueDate = currentDate.toISOString().split('T')[0];

    schedules.push({
      lease_id: leaseId,
      due_date: dueDate,
      expected_amount: monthlyRent,
      type: 'RENT',
      frequency: 'MONTHLY',
      notes: 'Monthly rent'
    });

    billings.push({
      lease_id: leaseId,
      type: 'RENT',
      utility_type: null,
      amount: monthlyRent,
      paid_amount: 0,
      balance: monthlyRent,
      status: 'PENDING',
      due_date: dueDate,
      billing_date: today.toISOString().split('T')[0],
      penalty_amount: 0,
      notes: 'Monthly rent billing'
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Calculate total expected amount
  const totalExpected = schedules.reduce((sum, schedule) => sum + schedule.expected_amount, 0);

  try {
    // Insert all schedules and billings in a transaction-like manner
    const [scheduleResult, billingResult] = await Promise.all([
      supabase.from('payment_schedules').insert(schedules),
      supabase.from('billings').insert(billings)
    ]);

    if (scheduleResult.error) throw scheduleResult.error;
    if (billingResult.error) throw billingResult.error;

    // Update lease balance
    const { error: balanceError } = await supabase
      .from('leases')
      .update({ balance: totalExpected })
      .eq('id', leaseId);

    if (balanceError) throw balanceError;

    return { schedules, billings };
  } catch (error) {
    console.error('Error in createPaymentSchedules:', error);
    throw error;
  }
}
