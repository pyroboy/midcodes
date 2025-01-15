import { e as error } from "../../../../../chunks/index.js";
async function getMonthlyBalances(supabase, params) {
  try {
    const { data, error: error2 } = await supabase.rpc("get_tenant_monthly_balances", {
      p_property_id: params.property_id,
      p_months_back: params.months
    });
    if (error2) throw error2;
    return { data, error: null };
  } catch (error2) {
    return { data: null, error: error2 };
  }
}
const load = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session) {
    throw error(401, { message: "Unauthorized" });
  }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
  const { data: rental_unit, error: rental_unitError } = await supabase.from("rental_unit").select(`
      *,
      floors!inner (
        floor_number,
        wing,
        status
      ),
      leases (
        id,
        name,
        status,
        type,
        start_date,
        end_date,
        rent_amount,
        security_deposit,
        balance,
        notes,
        lease_tenants (
          tenant:profiles (
            id,
            first_name,
            last_name,
            email,
            contact_number
          )
        ),
        billings (
          id,
          type,
          utility_type,
          amount,
          paid_amount,
          balance,
          status,
          due_date,
          billing_date,
          penalty_amount,
          notes
        ),
        payment_schedules (
          id,
          due_date,
          expected_amount,
          type,
          frequency,
          status,
          notes
        )
      ),
      meters (
        id,
        name,
        location_type,
        type,
        is_active,
        status,
        initial_reading,
        unit_rate,
        notes,
        readings (
          reading,
          reading_date
        )
      ),
      maintenance (
        id,
        title,
        description,
        status,
        completed_at,
        notes
      )
    `).eq("property_id", profile.property_id);
  if (rental_unitError) {
    throw error(500, { message: rental_unitError.message });
  }
  const { data: lastMonthExpenses, error: expensesError } = await supabase.from("expenses").select("id, property_id, amount, description, type, status, created_by, created_at").eq("property_id", profile.property_id).gte("created_at", new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() - 1)).toISOString());
  if (expensesError) {
    throw error(500, { message: expensesError.message });
  }
  const { data: balances, error: balancesError } = await getMonthlyBalances(supabase, {
    property_id: profile.property_id,
    months: 6
  });
  if (balancesError) {
    throw error(500, { message: balancesError.message });
  }
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = /* @__PURE__ */ new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  });
  const isAdminLevel = ["super_admin", "property_admin"].includes(profile.role);
  const isStaffLevel = ["property_manager", "property_maintenance", "property_accountant"].includes(profile.role);
  return {
    rental_unit: rental_unit || [],
    balances: balances || [],
    months,
    lastMonthExpenses: lastMonthExpenses || [],
    isAdminLevel,
    isStaffLevel
  };
};
export {
  load
};
