import { s as supabase } from "../../../../chunks/supabaseClient.js";
import { f as fail } from "../../../../chunks/index.js";
import "../../../../chunks/formData.js";
import { s as superValidate } from "../../../../chunks/superValidate.js";
import "ts-deepmerge";
import "memoize-weak";
import { z as zod } from "../../../../chunks/zod.js";
import { b as billingSchema } from "../../../../chunks/formSchema.js";
const load = async () => {
  const { data: billings, error: billingsError } = await supabase.from("billings").select(`
      *,
      lease:leases (
        *,
        rental_unit:rental_unit (*),
        lease_tenants (
          tenant:tenants (*)
        )
      ),
      payments (*)
    `);
  if (billingsError) {
    console.error("Error fetching billings:", billingsError);
    throw new Error("Failed to load billings");
  }
  const { data: leases, error: leasesError } = await supabase.from("leases").select(`
      *,
      rental_unit:rental_unit (*),
      lease_tenants (
        tenant:tenants (*)
      )
    `);
  if (leasesError) {
    console.error("Error fetching leases:", leasesError);
    throw new Error("Failed to load leases");
  }
  const form = await superValidate(zod(billingSchema));
  return {
    form,
    billings,
    leases
  };
};
const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(billingSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { data, error } = await supabase.from("billings").insert({
      leaseId: form.data.leaseId,
      type: form.data.type,
      utilityType: form.data.utilityType,
      amount: form.data.amount,
      paidAmount: form.data.paidAmount,
      balance: form.data.amount - form.data.paidAmount,
      status: form.data.status,
      dueDate: form.data.dueDate,
      billingDate: form.data.billingDate,
      penaltyAmount: form.data.penaltyAmount,
      notes: form.data.notes
    }).select().single();
    if (error) {
      console.error("Error creating billing:", error);
      return fail(500, { form });
    }
    return { form };
  },
  update: async ({ request }) => {
    const form = await superValidate(request, zod(billingSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { error } = await supabase.from("billings").update({
      leaseId: form.data.leaseId,
      type: form.data.type,
      utilityType: form.data.utilityType,
      amount: form.data.amount,
      paidAmount: form.data.paidAmount,
      balance: form.data.amount - form.data.paidAmount,
      status: form.data.status,
      dueDate: form.data.dueDate,
      billingDate: form.data.billingDate,
      penaltyAmount: form.data.penaltyAmount,
      notes: form.data.notes
    }).eq("id", form.data.id);
    if (error) {
      console.error("Error updating billing:", error);
      return fail(500, { form });
    }
    return { form };
  }
};
export {
  actions,
  load
};
