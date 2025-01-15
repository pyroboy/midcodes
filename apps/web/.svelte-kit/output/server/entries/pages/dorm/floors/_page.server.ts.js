import { r as redirect, f as fail } from "../../../../chunks/index.js";
import "../../../../chunks/formData.js";
import { s as superValidate } from "../../../../chunks/superValidate.js";
import "ts-deepmerge";
import "memoize-weak";
import { a as zod } from "../../../../chunks/zod.js";
import { f as floorSchema, d as deleteFloorSchema } from "../../../../chunks/formSchema3.js";
import { c as checkAccess } from "../../../../chunks/roleChecks.js";
const load = async ({ locals: { safeGetSession, supabase } }) => {
  console.log("🔄 Starting server-side load function");
  const { user, profile } = await safeGetSession();
  console.log("👤 Session data:", {
    userId: user?.id,
    role: profile?.role,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  const hasAccess = checkAccess(profile?.role, "staff");
  console.log("🔑 Access check result:", {
    hasAccess,
    role: profile?.role,
    requiredLevel: "staff"
  });
  if (!hasAccess) {
    console.log("⛔ Access denied, redirecting to unauthorized");
    throw redirect(302, "/unauthorized");
  }
  console.log("📊 Initiating database queries for floors and properties");
  const startTime = performance.now();
  const [floorsResult, propertiesResult] = await Promise.all([
    supabase.from("floors").select(`
        *,
        property:properties(
          id,
          name
        ),
        rental_unit:rental_unit(
          id,
          number
        )
      `).order("property_id, floor_number"),
    supabase.from("properties").select("id, name").order("name")
  ]);
  const queryTime = performance.now() - startTime;
  console.log("🏢 Database query results:", {
    floorsCount: floorsResult.data?.length || 0,
    propertiesCount: propertiesResult.data?.length || 0,
    floorsError: floorsResult.error,
    propertiesError: propertiesResult.error,
    queryExecutionTime: `${queryTime.toFixed(2)}ms`
  });
  if (floorsResult.error) {
    console.error("❌ Error fetching floors:", {
      error: floorsResult.error,
      statusCode: floorsResult.status,
      statusText: floorsResult.statusText
    });
  }
  if (propertiesResult.error) {
    console.error("❌ Error fetching properties:", {
      error: propertiesResult.error,
      statusCode: propertiesResult.status,
      statusText: propertiesResult.statusText
    });
  }
  const floors = (floorsResult.data || []).map((floor) => {
    console.log(`🏗️ Processing floor ${floor.id}:`, {
      propertyId: floor.property_id,
      floorNumber: floor.floor_number,
      unitCount: floor.rental_unit?.length || 0,
      hasProperty: !!floor.property,
      propertyName: floor.property?.name || "Unknown"
    });
    return {
      ...floor,
      property: floor.property ? {
        id: floor.property.id,
        name: floor.property.name
      } : {
        id: floor.property_id,
        name: "Unknown Property"
      },
      rental_unit: (floor.rental_unit || []).map((unit) => ({
        ...unit,
        number: unit.number.toString()
        // Convert number to string
      }))
    };
  });
  console.log("📈 Processed floors data:", {
    totalFloors: floors.length,
    propertiesRepresented: new Set(floors.map((f) => f.property.id)).size,
    floorsWithoutProperty: floors.filter((f) => !f.property).length,
    totalUnits: floors.reduce((sum, floor) => sum + floor.rental_unit.length, 0)
  });
  const properties = propertiesResult.data || [];
  const form = await superValidate(zod(floorSchema));
  const isAdminLevel = checkAccess(profile?.role, "admin");
  const isStaffLevel = checkAccess(profile?.role, "staff") && !isAdminLevel;
  console.log("✅ Final load data preparation:", {
    formValid: form.valid,
    isAdminLevel,
    isStaffLevel,
    totalProperties: properties.length,
    loadTime: `${(performance.now() - startTime).toFixed(2)}ms`
  });
  return {
    form,
    floors,
    properties,
    user: {
      role: profile?.role || "user"
    },
    isAdminLevel,
    isStaffLevel
  };
};
const actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log("➕ Starting floor creation process");
    const startTime = performance.now();
    const { profile } = await safeGetSession();
    const hasAccess = checkAccess(profile?.role, "admin");
    console.log("🔑 Create access check:", {
      role: profile?.role,
      hasAccess,
      requiredLevel: "admin"
    });
    if (!hasAccess) {
      console.log("⛔ Create access denied");
      return fail(403, { message: "Insufficient permissions" });
    }
    const form = await superValidate(request, zod(floorSchema));
    console.log("📝 CREATE form validation:", {
      valid: form.valid,
      data: form.data,
      errors: form.errors
    });
    if (!form.valid) {
      console.log("❌ Form validation failed");
      return fail(400, { form });
    }
    try {
      console.log("🏗️ Attempting to create floor:", {
        propertyId: form.data.property_id,
        floorNumber: form.data.floor_number
      });
      const { error } = await supabase.from("floors").insert({
        property_id: form.data.property_id,
        floor_number: form.data.floor_number,
        wing: form.data.wing || null,
        status: form.data.status
      });
      if (error) throw error;
      console.log("✅ Floor created successfully", {
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      return { form };
    } catch (err) {
      console.error("❌ Error creating floor:", {
        error: err,
        formData: form.data,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return fail(500, { form, message: "Failed to create floor" });
    }
  },
  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log("🔄 Starting floor update process");
    const startTime = performance.now();
    const { profile } = await safeGetSession();
    const hasAccess = checkAccess(profile?.role, "staff");
    console.log("🔑 Update access check:", {
      role: profile?.role,
      hasAccess,
      requiredLevel: "staff"
    });
    if (!hasAccess) {
      console.log("⛔ Update access denied");
      return fail(403, { message: "Insufficient permissions" });
    }
    const form = await superValidate(request, zod(floorSchema));
    console.log("📝 UPDATE form validation:", {
      valid: form.valid,
      data: form.data,
      errors: form.errors
    });
    if (!form.valid) {
      console.log("❌ Form validation failed");
      return fail(400, { form });
    }
    try {
      console.log("🏗️ Attempting to update floor:", {
        id: form.data.id,
        propertyId: form.data.property_id,
        floorNumber: form.data.floor_number
      });
      const { error } = await supabase.from("floors").update({
        property_id: form.data.property_id,
        floor_number: form.data.floor_number,
        wing: form.data.wing || null,
        status: form.data.status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", form.data.id);
      if (error) throw error;
      console.log("✅ Floor updated successfully", {
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      return { form };
    } catch (err) {
      console.error("❌ Error updating floor:", {
        error: err,
        floorId: form.data.id,
        formData: form.data,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return fail(500, { form, message: "Failed to update floor" });
    }
  },
  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log("🗑️ Starting floor deletion process");
    const startTime = performance.now();
    const { profile } = await safeGetSession();
    const hasAccess = checkAccess(profile?.role, "staff");
    console.log("🔑 Delete access check:", {
      role: profile?.role,
      hasAccess,
      requiredLevel: "staff"
    });
    if (!hasAccess) {
      console.log("⛔ Delete access denied");
      return fail(403, { message: "Insufficient permissions" });
    }
    const deleteForm = await superValidate(request, zod(deleteFloorSchema));
    console.log("📝 DELETE form validation:", {
      valid: deleteForm.valid,
      data: deleteForm.data,
      errors: deleteForm.errors
    });
    if (!deleteForm.valid) {
      console.log("❌ Delete validation failed:", deleteForm.errors);
      return fail(400, {
        message: "Invalid delete request",
        errors: deleteForm.errors
      });
    }
    try {
      console.log("🗑️ Attempting to delete floor:", {
        id: deleteForm.data.id
      });
      const { error } = await supabase.from("floors").delete().eq("id", deleteForm.data.id);
      if (error) throw error;
      console.log("✅ Floor deleted successfully", {
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      return { success: true };
    } catch (err) {
      console.error("❌ Error deleting floor:", {
        error: err,
        floorId: deleteForm.data.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return fail(500, { message: "Failed to delete floor" });
    }
  }
};
export {
  actions,
  load
};
