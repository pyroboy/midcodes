import { f as fail } from "../../../../chunks/index.js";
import "../../../../chunks/formData.js";
import { s as superValidate } from "../../../../chunks/superValidate.js";
import "ts-deepmerge";
import "memoize-weak";
import { a as zod } from "../../../../chunks/zod.js";
import { p as paymentSchema } from "../../../../chunks/formSchema6.js";
import { s as supabase } from "../../../../chunks/supabaseClient.js";
async function calculatePenalty(billing, penaltyConfig, currentDate = /* @__PURE__ */ new Date()) {
  const dueDate = new Date(billing.due_date);
  const daysLate = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
  if (daysLate <= penaltyConfig.grace_period) {
    return 0;
  }
  const effectiveDaysLate = daysLate - penaltyConfig.grace_period;
  let penaltyAmount = 0;
  if (penaltyConfig.compound_period && penaltyConfig.compound_period > 0) {
    const compoundPeriods = Math.floor(effectiveDaysLate / penaltyConfig.compound_period);
    const baseAmount = billing.amount;
    penaltyAmount = baseAmount * (Math.pow(1 + penaltyConfig.penalty_percentage / 100, compoundPeriods) - 1);
  } else {
    penaltyAmount = billing.amount * (penaltyConfig.penalty_percentage / 100);
  }
  if (penaltyConfig.max_penalty_percentage) {
    const maxPenalty = billing.amount * (penaltyConfig.max_penalty_percentage / 100);
    penaltyAmount = Math.min(penaltyAmount, maxPenalty);
  }
  return Math.round(penaltyAmount * 100) / 100;
}
async function getPenaltyConfig(supabase2, billingType) {
  try {
    const { data: penaltyConfig, error } = await supabase2.from("penalty_configs").select("*").eq("type", billingType).single();
    if (error) {
      console.error("Failed to get penalty config:", {
        billingType,
        error
      });
      throw new Error(`Failed to get penalty config: ${error.message}`);
    }
    return penaltyConfig;
  } catch (error) {
    console.error("Error in getPenaltyConfig:", error);
    throw error;
  }
}
async function createPenaltyBilling(supabase2, billing, penaltyAmount) {
  try {
    const { error } = await supabase2.from("billings").insert({
      lease_id: billing.lease_id,
      type: "PENALTY",
      amount: penaltyAmount,
      paid_amount: 0,
      balance: penaltyAmount,
      status: "PENDING",
      due_date: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 7)).toISOString().split("T")[0],
      billing_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      notes: `Late payment penalty for billing #${billing.id}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (error) {
      console.error("Failed to create penalty billing:", {
        originalBillingId: billing.id,
        penaltyAmount,
        error
      });
      throw new Error(`Failed to create penalty billing: ${error.message}`);
    }
    console.log("Successfully created penalty billing:", {
      originalBillingId: billing.id,
      penaltyAmount,
      dueDate: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 7)).toISOString()
    });
  } catch (error) {
    console.error("Error in createPenaltyBilling:", error);
    throw error;
  }
}
async function updateBillingStatus(supabase2, billing, newPaidAmount) {
  try {
    const newBalance = billing.amount - newPaidAmount;
    let newStatus = "PENDING";
    if (newBalance <= 0) {
      newStatus = "PAID";
    } else if (newBalance < billing.amount) {
      newStatus = "PARTIAL";
    } else if (/* @__PURE__ */ new Date() > new Date(billing.due_date)) {
      newStatus = "OVERDUE";
    }
    const { error } = await supabase2.from("billings").update({
      paid_amount: newPaidAmount,
      balance: newBalance,
      status: newStatus,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", billing.id);
    if (error) {
      console.error("Failed to update billing status:", {
        billingId: billing.id,
        error,
        newStatus,
        newPaidAmount,
        newBalance
      });
      throw new Error(`Failed to update billing status: ${error.message}`);
    }
    console.log("Successfully updated billing status:", {
      billingId: billing.id,
      previousStatus: billing.status,
      newStatus,
      previousBalance: billing.balance,
      newBalance,
      previousPaidAmount: billing.paid_amount,
      newPaidAmount
    });
  } catch (error) {
    console.error("Error in updateBillingStatus:", error);
    throw error;
  }
}
function getUTCTimestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
async function logAuditEvent(supabase2, event) {
  try {
    const { error } = await supabase2.from("audit_logs").insert({
      action: event.action,
      user_id: event.user_id,
      user_role: event.user_role,
      module: "payments",
      details: event.details,
      created_at: getUTCTimestamp()
    });
    if (error) {
      console.error("Failed to log audit event:", {
        event,
        error
      });
    }
  } catch (error) {
    console.error("Error in logAuditEvent:", error);
  }
}
const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: "Unauthorized" });
  }
  const [{ data: userRole }, { data: payments }, { data: billings }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", session.user.id).single(),
    supabase.from("payments").select(`
        *,
        created_by:profiles!created_by(name),
        billing:billings(
          id,
          type,
          utility_type,
          amount,
          paid_amount,
          balance,
          status,
          due_date,
          lease:leases(
            id,
            name,
            rental_unit:rental_unit(
              rental_unit_number,
              floor:floors(
                floor_number,
                wing,
                property:properties(
                  name
                )
              )
            )
          )
        )
      `).order("paid_at", { ascending: false }),
    supabase.from("billings").select(`
        id,
        type,
        utility_type,
        amount,
        paid_amount,
        balance,
        status,
        due_date,
        lease:leases(
          id,
          name,
          rental_unit:rental_unit(
            id,
            rental_unit_number,
            floor:floors(
              floor_number,
              wing,
              property:properties(
                name
              )
            )
          )
        )
      `).in("status", ["PENDING", "PARTIAL", "OVERDUE"]).order("due_date")
  ]);
  const form = await superValidate(zod(paymentSchema));
  const isAdminLevel = ["super_admin", "property_admin"].includes(userRole?.role || "");
  const isAccountant = userRole?.role === "property_accountant";
  const isUtility = userRole?.role === "property_utility";
  const isFrontdesk = userRole?.role === "property_frontdesk";
  const isResident = userRole?.role === "property_resident";
  return {
    form,
    payments,
    billings,
    userRole: userRole?.role || "user",
    isAdminLevel,
    isAccountant,
    isUtility,
    isFrontdesk,
    isResident
  };
};
const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, {
        form: null,
        error: "You must be logged in to create payments"
      });
    }
    const form = await superValidate(request, zod(paymentSchema));
    if (!form.valid) {
      return fail(400, {
        form,
        error: "Invalid form data. Please check your input."
      });
    }
    const { data: billing, error: billingError } = await supabase.from("billings").select("*, lease:leases(name, rental_unit:rental_unit(rental_unit_number, floor:floors(floor_number, wing)))").eq("id", form.data.billing_id).single();
    if (billingError || !billing) {
      console.error("Failed to fetch billing:", billingError);
      return fail(404, {
        form,
        error: `Billing #${form.data.billing_id} not found or has been deleted`
      });
    }
    const { data: userRole } = await supabase.from("profiles").select("role, name").eq("id", session.user.id).single();
    const canCreate = ["super_admin", "property_admin", "property_accountant", "property_frontdesk"];
    if (!canCreate.includes(userRole?.role)) {
      await logAuditEvent(supabase, {
        action: "payment_create_denied",
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          billing_id: billing.id,
          amount: form.data.amount,
          method: form.data.method
        }
      });
      return fail(403, {
        form,
        error: "You do not have permission to create payments"
      });
    }
    if (!["PENDING", "PARTIAL", "OVERDUE"].includes(billing.status)) {
      await logAuditEvent(supabase, {
        action: "payment_create_invalid_status",
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          billing_id: billing.id,
          billing_status: billing.status,
          amount: form.data.amount
        }
      });
      return fail(400, {
        form,
        error: `Cannot process payment for billing in ${billing.status} status. Only PENDING, PARTIAL, or OVERDUE billings can receive payments.`
      });
    }
    if (form.data.amount > billing.balance) {
      await logAuditEvent(supabase, {
        action: "payment_create_amount_exceeded",
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          billing_id: billing.id,
          attempted_amount: form.data.amount,
          billing_balance: billing.balance
        }
      });
      return fail(400, {
        form,
        error: `Payment amount (${form.data.amount}) exceeds billing balance (${billing.balance}). Please enter an amount less than or equal to the balance.`
      });
    }
    const penaltyConfig = await getPenaltyConfig(supabase, billing.type);
    let penaltyAmount = 0;
    if (penaltyConfig && new Date(form.data.paid_at) > new Date(billing.due_date)) {
      penaltyAmount = await calculatePenalty(billing, penaltyConfig, new Date(form.data.paid_at));
    }
    let createdPayment;
    try {
      const timestamp = getUTCTimestamp();
      const { data, error: paymentError } = await supabase.from("payments").insert({
        ...form.data,
        created_by: session.user.id,
        updated_by: session.user.id,
        created_at: timestamp,
        updated_at: timestamp
      }).select(`
          *,
          billing:billings!inner(
            id,
            type,
            utility_type,
            lease:leases(
              name,
              rental_unit:rental_unit(
                rental_unit_number,
                floor:floors(
                  floor_number,
                  wing
                )
              )
            )
          )
        `).single();
      if (paymentError) {
        console.error("Failed to create payment:", paymentError);
        await logAuditEvent(supabase, {
          action: "payment_create_failed",
          user_id: session.user.id,
          user_role: userRole?.role,
          details: {
            billing_id: billing.id,
            error: paymentError.message,
            amount: form.data.amount
          }
        });
        throw new Error("Failed to create payment record");
      }
      createdPayment = data;
      await logAuditEvent(supabase, {
        action: "payment_created",
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          payment_id: createdPayment.id,
          billing_id: billing.id,
          amount: form.data.amount,
          method: form.data.method,
          location: `${billing.lease.rental_unit.floor.wing} - Floor ${billing.lease.rental_unit.floor.floor_number} - Rental_unit ${billing.lease.rental_unit.rental_unit_number}`
        }
      });
      await updateBillingStatus(supabase, billing, billing.paid_amount + form.data.amount);
      if (penaltyAmount > 0) {
        await createPenaltyBilling(supabase, billing, penaltyAmount);
      }
      return {
        form,
        success: true,
        message: `Payment of ${form.data.amount} successfully processed for ${billing.lease.name}`
      };
    } catch (error) {
      console.error("Transaction failed:", error);
      try {
        if (createdPayment?.id) {
          await supabase.from("payments").delete().eq("id", createdPayment.id);
        }
      } catch (rollbackError) {
        console.error("Failed to rollback payment:", rollbackError);
      }
      return fail(500, {
        form,
        error: "Failed to process payment. Please try again or contact support if the issue persists."
      });
    }
  },
  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, {
        form: null,
        error: "You must be logged in to update payments"
      });
    }
    const form = await superValidate(request, zod(paymentSchema));
    if (!form.valid) {
      return fail(400, {
        form,
        error: "Invalid form data. Please check your input."
      });
    }
    const { data: userRole } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
    const canUpdate = ["super_admin", "property_admin", "property_accountant"];
    if (!canUpdate.includes(userRole?.role)) {
      return fail(403, {
        form,
        error: "You do not have permission to update payments"
      });
    }
    const { data: existingPayment, error: existingError } = await supabase.from("payments").select("*").eq("id", form.data.id).single();
    if (existingError || !existingPayment) {
      console.error("Failed to fetch existing payment:", existingError);
      return fail(404, {
        form,
        error: "Payment not found or has been deleted"
      });
    }
    const { error: updateError } = await supabase.from("payments").update({
      ...form.data,
      updated_by: session.user.id,
      updated_at: getUTCTimestamp()
    }).eq("id", form.data.id);
    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return fail(500, {
        form,
        error: "Failed to update payment record"
      });
    }
    return { form };
  }
};
export {
  actions,
  load
};
