import { r as redirect, f as fail } from "../../../../chunks/index.js";
import "../../../../chunks/formData.js";
import { s as superValidate } from "../../../../chunks/superValidate.js";
import "ts-deepmerge";
import "memoize-weak";
import { a as zod } from "../../../../chunks/zod.js";
import { c as checkAccess } from "../../../../chunks/roleChecks.js";
import { p as propertySchema, a as preparePropertyData } from "../../../../chunks/formSchema7.js";
const load = async ({ locals: { safeGetSession, supabase } }) => {
  const { user, profile } = await safeGetSession();
  const hasAccess = checkAccess(profile?.role, "admin");
  if (!hasAccess) {
    throw redirect(302, "/unauthorized");
  }
  console.log("Starting properties load function");
  const { data: properties, error } = await supabase.from("properties").select("*").order("name");
  console.log("Raw properties data:", properties);
  console.log("Query error if any:", error);
  if (error) {
    console.error("Error loading properties:", error);
    return {
      form: await superValidate(zod(propertySchema)),
      properties: []
    };
  }
  const form = await superValidate(zod(propertySchema));
  return {
    form,
    properties: properties ?? []
  };
};
const actions = {
  create: async ({ request, locals: { supabase } }) => {
    const form = await superValidate(request, zod(propertySchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const propertyData = preparePropertyData(form.data);
    const { error } = await supabase.from("properties").insert(propertyData);
    if (error) {
      console.error("Error creating property:", error);
      return fail(500, {
        form,
        error: "Failed to create property"
      });
    }
    return { form };
  },
  update: async ({ request, locals: { supabase } }) => {
    const form = await superValidate(request, zod(propertySchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const propertyData = preparePropertyData(form.data);
    const { error } = await supabase.from("properties").update(propertyData).eq("id", form.data.id);
    if (error) {
      console.error("Error updating property:", error);
      return fail(500, {
        form,
        error: "Failed to update property"
      });
    }
    return { form };
  },
  delete: async ({ request, locals: { supabase } }) => {
    const form = await superValidate(request, zod(propertySchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { data: floors } = await supabase.from("floors").select("id").eq("property_id", form.data.id).limit(1);
    if (floors && floors.length > 0) {
      return fail(400, {
        form,
        error: "Cannot delete property with existing floors/rental_unit. Please delete them first."
      });
    }
    const { error } = await supabase.from("properties").delete().eq("id", form.data.id);
    if (error) {
      console.error("Error deleting property:", error);
      return fail(500, {
        form,
        error: "Failed to delete property"
      });
    }
    return { form };
  }
};
export {
  actions,
  load
};
