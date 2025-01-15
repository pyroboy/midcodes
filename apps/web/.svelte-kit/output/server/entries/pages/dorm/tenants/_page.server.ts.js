import { e as error, f as fail } from "../../../../chunks/index.js";
import "../../../../chunks/formData.js";
import { s as superValidate } from "../../../../chunks/superValidate.js";
import { t as tenantFormSchema, a as tenantResponseSchema } from "../../../../chunks/formSchema9.js";
import "ts-deepmerge";
import "memoize-weak";
import { z as zod } from "../../../../chunks/zod.js";
import { c as checkAccess } from "../../../../chunks/roleChecks.js";
const load = async ({ locals: { safeGetSession, supabase } }) => {
  const { session, user, profile } = await safeGetSession();
  if (!session || !user) {
    throw error(401, { message: "Unauthorized" });
  }
  const form = await superValidate(zod(tenantFormSchema));
  const { data: propertiesData, error: propertiesError } = await supabase.from("properties").select("*").order("name");
  const properties = propertiesData || [];
  const { data: rental_unitData, error: rental_unitError } = await supabase.from("rental_unit").select("*").order("number");
  const rental_unit = rental_unitData || [];
  if (rental_unitError) {
    console.error("Error fetching rental_unit:", rental_unitError);
  }
  const { data: tenantsData, error: tenantsError } = await supabase.from("tenants").select(`
      id,
      name,
      contact_number,
      email,
      tenant_status,
      auth_id,
      created_by,
      created_at,
      updated_at,
      emergency_contact
    `).order("name");
  const tenantsBasic = tenantsData || [];
  if (tenantsError) {
    console.error("Error fetching tenants:", tenantsError);
    return {
      form,
      tenants: [],
      rental_unit,
      properties,
      profile: null,
      isAdminLevel: false,
      isStaffLevel: false
    };
  }
  const { data: leasesData, error: leasesError } = await supabase.from("leases").select(`
      id,
      tenant:tenants!inner (
        id
      ),
      location:rental_unit (
        id,
        number,
        property:properties (
          id,
          name
        )
      )
    `);
  const rawLeases = leasesData || [];
  const leases = rawLeases.map((lease) => ({
    id: String(lease.id),
    type: lease.type || "BEDSPACER",
    status: lease.status || "INACTIVE",
    start_date: lease.start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    end_date: lease.end_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    rent_amount: lease.rent_amount || 0,
    security_deposit: lease.security_deposit || 0,
    balance: lease.balance || 0,
    notes: lease.notes || null,
    tenant: {
      id: String(lease.tenant?.[0]?.id || "")
    },
    location: lease.location?.[0] ? {
      id: String(lease.location[0].id),
      number: String(lease.location[0].number),
      property: lease.location[0].property?.[0] ? {
        id: String(lease.location[0].property[0].id),
        name: lease.location[0].property[0].name
      } : null
    } : null
  }));
  if (leasesError) {
    console.error("Error fetching leases:", leasesError);
  }
  const tenants = tenantsBasic.map((tenant) => {
    const matchingLease = leases.find(
      (lease2) => lease2.tenant && lease2.tenant.id === String(tenant.id)
    );
    const lease = matchingLease || null;
    return {
      ...tenant,
      lease,
      // lease_type: lease?.type || 'BEDSPACER',
      status: lease?.status || "INACTIVE",
      start_date: lease?.start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      end_date: lease?.end_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      outstanding_balance: lease?.balance || 0,
      created_by: tenant.created_by
    };
  });
  const isAdminLevel = checkAccess(profile?.role, "admin");
  const isStaffLevel = checkAccess(profile?.role, "staff") && !isAdminLevel;
  return {
    form,
    tenants,
    rental_unit,
    properties,
    isAdminLevel,
    isStaffLevel,
    profile
  };
};
const actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user, profile } = await safeGetSession();
    if (!session || !user) {
      return fail(401, { message: "Unauthorized" });
    }
    const form = await superValidate(request, zod(tenantFormSchema));
    console.log("POST", form);
    if (!form.valid) {
      return fail(400, { form });
    }
    const hasAccess = checkAccess(profile?.role, "admin");
    if (!hasAccess) {
      return fail(403, { message: "Insufficient permissions" });
    }
    try {
      const insertData = {
        name: form.data.name,
        contact_number: form.data.contact_number,
        email: form.data.email,
        emergency_contact: form.data.emergency_contact,
        tenant_status: "PENDING"
      };
      const { data: tenant, error: tenantError } = await supabase.from("tenants").insert([insertData]).select().single();
      if (tenantError) throw tenantError;
      return { form };
    } catch (err) {
      console.error("Error creating tenant:", err);
      return fail(500, {
        form,
        message: "Error creating tenant. Transaction rolled back."
      });
    }
  },
  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession();
    if (!session || !user) {
      return fail(401, { message: "Unauthorized" });
    }
    const form = await superValidate(request, zod(tenantResponseSchema));
    console.log("PUT", form);
    if (!form.valid) {
      return fail(400, { form });
    }
    try {
      const updateData = {
        name: form.data.name,
        contact_number: form.data.contact_number,
        email: form.data.email,
        emergency_contact: form.data.emergency_contact,
        tenant_status: form.data.tenant_status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error: tenantError } = await supabase.from("tenants").update(updateData).eq("id", form.data.id);
      if (tenantError) throw tenantError;
      return { form };
    } catch (err) {
      console.error("Error updating tenant:", err);
      return fail(500, {
        form,
        message: "Error updating tenant. Transaction rolled back."
      });
    }
  }
};
export {
  actions,
  load
};
