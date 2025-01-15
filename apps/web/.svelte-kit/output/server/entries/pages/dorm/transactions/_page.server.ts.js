import { e as error } from "../../../../chunks/index.js";
import "../../../../chunks/formData.js";
import { s as superValidate } from "../../../../chunks/superValidate.js";
import "ts-deepmerge";
import "memoize-weak";
import { z as zod } from "../../../../chunks/zod.js";
import { t as transactionFilterSchema } from "../../../../chunks/schema2.js";
import { s as supabase } from "../../../../chunks/supabaseClient.js";
const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    throw error(401, "Unauthorized");
  }
  const form = await superValidate(zod(transactionFilterSchema));
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile) {
    throw error(400, "User profile not found");
  }
  const canViewTransactions = ["super_admin", "property_admin", "accountant", "manager", "frontdesk"].includes(profile.role);
  if (!canViewTransactions) {
    throw error(403, "Insufficient permissions to view transactions");
  }
  const { data: transactions, error: transactionsError } = await supabase.from("payments").select(`
      *,
      billing:billings (
        *,
        lease:leases (
          id,
          name,
          rental_unit:rental_unit (
            id,
            name,
            number,
            property:properties (
              id,
              name
            )
          ),
          tenant:lease_tenants (
            tenant:tenants (
              id,
              name,
              email
            )
          )
        )
      )
    `).order("paid_at", { ascending: false });
  if (transactionsError) {
    throw error(500, "Failed to fetch transactions");
  }
  return {
    form,
    transactions,
    user: {
      role: profile.role
    }
  };
};
export {
  load
};
