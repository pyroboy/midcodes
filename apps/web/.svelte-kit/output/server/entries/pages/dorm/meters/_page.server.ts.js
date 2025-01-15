import { f as fail } from "../../../../chunks/index.js";
import "../../../../chunks/formData.js";
import { s as superValidate } from "../../../../chunks/superValidate.js";
import "ts-deepmerge";
import "memoize-weak";
import { z as zod } from "../../../../chunks/zod.js";
import { a as meterFormSchema, b as meterSchema } from "../../../../chunks/formSchema5.js";
import { s as supabase } from "../../../../chunks/supabaseClient.js";
const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: "Unauthorized" });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  const isAdminLevel = profile?.role === "super_admin" || profile?.role === "property_admin";
  const isUtility = profile?.role === "property_utility";
  const isMaintenance = profile?.role === "property_maintenance";
  if (!isAdminLevel && !isUtility && !isMaintenance) {
    return fail(403, { message: "Forbidden" });
  }
  const [{ data: meters }, { data: properties }, { data: floors }, { data: rental_unit }] = await Promise.all([
    supabase.from("meters").select(`
        *,
        property:properties(name),
        floor:floors(floor_number, wing, property:properties(name)),
        rental_unit:rental_unit(number, floor:floors(floor_number, wing, property:properties(name))),
        readings:readings(id, reading, reading_date)
      `).order("created_at", { ascending: false }),
    supabase.from("properties").select("*").eq("status", "ACTIVE").order("name"),
    supabase.from("floors").select(`
        *,
        property:properties(
          id,
          name
        )
      `).eq("status", "ACTIVE").order("floor_number"),
    supabase.from("rental_unit").select(`
        *,
        floor:floors(
          id,
          floor_number,
          wing,
          property:properties(
            id,
            name
          )
        )
      `).in("rental_unit_status", ["VACANT", "OCCUPIED"]).order("number")
  ]);
  const form = await superValidate({
    name: "",
    type: "ELECTRICITY",
    status: "ACTIVE",
    location_type: "PROPERTY",
    property_id: null,
    floor_id: null,
    rental_unit_id: null,
    unit_rate: 0,
    initial_reading: 0,
    is_active: true,
    notes: null
  }, zod(meterFormSchema));
  return {
    form,
    meters,
    properties,
    floors,
    rental_unit,
    isAdminLevel,
    isUtility,
    isMaintenance
  };
};
const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: "Unauthorized" });
    }
    const form = await superValidate(request, zod(meterFormSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
    const isAdminLevel = profile?.role === "super_admin" || profile?.role === "property_admin";
    const isUtility = profile?.role === "property_utility";
    if (!isAdminLevel && !isUtility) {
      return fail(403, { message: "Forbidden" });
    }
    const { location_type, property_id, floor_id, rental_unit_id } = form.data;
    let locationValid = false;
    let locationQuery;
    switch (location_type) {
      case "PROPERTY":
        locationQuery = supabase.from("properties").select("id").eq("id", property_id).eq("status", "ACTIVE").single();
        break;
      case "FLOOR":
        locationQuery = supabase.from("floors").select("id").eq("id", floor_id).eq("status", "ACTIVE").single();
        break;
      case "RENTAL_UNIT":
        locationQuery = supabase.from("rental_unit").select("id").eq("id", rental_unit_id).in("rental_unit_status", ["VACANT", "OCCUPIED"]).single();
        break;
    }
    if (locationQuery) {
      const { data } = await locationQuery;
      locationValid = !!data;
    }
    if (!locationValid) {
      return fail(400, {
        form,
        message: "Invalid location selected. Please check if the location exists and is active."
      });
    }
    let duplicateQuery = supabase.from("meters").select("id").eq("name", form.data.name);
    switch (location_type) {
      case "PROPERTY":
        duplicateQuery = duplicateQuery.eq("property_id", property_id);
        break;
      case "FLOOR":
        duplicateQuery = duplicateQuery.eq("floor_id", floor_id);
        break;
      case "RENTAL_UNIT":
        duplicateQuery = duplicateQuery.eq("rental_unit_id", rental_unit_id);
        break;
    }
    const { data: existingMeter } = await duplicateQuery.maybeSingle();
    if (existingMeter) {
      return fail(400, {
        form,
        message: "A meter with this name already exists in this location."
      });
    }
    const { error } = await supabase.from("meters").insert({
      ...form.data,
      created_by: session.user.id,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (error) {
      return fail(500, { form, message: error.message });
    }
    return { form };
  },
  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: "Unauthorized" });
    }
    const form = await superValidate(request, zod(meterFormSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
    const isAdminLevel = profile?.role === "super_admin" || profile?.role === "property_admin";
    const isUtility = profile?.role === "property_utility";
    if (!isAdminLevel && !isUtility) {
      return fail(403, { message: "Forbidden" });
    }
    const { id, ...updateData } = form.data;
    if (!id) {
      return fail(400, { form, message: "Meter ID is required for updates." });
    }
    const { data: meter } = await supabase.from("meters").select("id").eq("id", id).single();
    if (!meter) {
      return fail(404, { form, message: "Meter not found." });
    }
    const { location_type, property_id, floor_id, rental_unit_id } = updateData;
    let locationValid = false;
    let locationQuery;
    switch (location_type) {
      case "PROPERTY":
        locationQuery = supabase.from("properties").select("id").eq("id", property_id).eq("status", "ACTIVE").single();
        break;
      case "FLOOR":
        locationQuery = supabase.from("floors").select("id").eq("id", floor_id).eq("status", "ACTIVE").single();
        break;
      case "RENTAL_UNIT":
        locationQuery = supabase.from("rental_unit").select("id").eq("id", rental_unit_id).in("rental_unit_status", ["VACANT", "OCCUPIED"]).single();
        break;
    }
    if (locationQuery) {
      const { data } = await locationQuery;
      locationValid = !!data;
    }
    if (!locationValid) {
      return fail(400, {
        form,
        message: "Invalid location selected. Please check if the location exists and is active."
      });
    }
    let duplicateQuery = supabase.from("meters").select("id").eq("name", updateData.name).neq("id", id);
    switch (location_type) {
      case "PROPERTY":
        duplicateQuery = duplicateQuery.eq("property_id", property_id);
        break;
      case "FLOOR":
        duplicateQuery = duplicateQuery.eq("floor_id", floor_id);
        break;
      case "RENTAL_UNIT":
        duplicateQuery = duplicateQuery.eq("rental_unit_id", rental_unit_id);
        break;
    }
    const { data: existingMeter } = await duplicateQuery.maybeSingle();
    if (existingMeter) {
      return fail(400, {
        form,
        message: "A meter with this name already exists in this location."
      });
    }
    const { error } = await supabase.from("meters").update({
      ...updateData,
      updated_by: session.user.id,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id);
    if (error) {
      return fail(500, { form, message: error.message });
    }
    return { form };
  },
  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: "Unauthorized" });
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
    const isAdminLevel = profile?.role === "super_admin" || profile?.role === "property_admin";
    if (!isAdminLevel) {
      return fail(403, { message: "Only administrators can delete meters." });
    }
    const form = await superValidate(request, zod(meterSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { id } = form.data;
    if (!id) {
      return fail(400, { form, message: "Meter ID is required for deletion." });
    }
    const { data: meter } = await supabase.from("meters").select("id").eq("id", id).single();
    if (!meter) {
      return fail(404, { form, message: "Meter not found." });
    }
    const { data: readings } = await supabase.from("readings").select("id").eq("meter_id", id).limit(1);
    if (readings && readings.length > 0) {
      return fail(400, {
        form,
        message: "Cannot delete meter with existing readings. Please archive it instead."
      });
    }
    const { error } = await supabase.from("meters").delete().eq("id", id);
    if (error) {
      return fail(500, { form, message: error.message });
    }
    return { form };
  }
};
export {
  actions,
  load
};
