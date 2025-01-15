import { r as redirect, e as error } from "../../../../chunks/index.js";
const load = async ({ locals: { supabase, session, profile } }) => {
  console.log(" [Templates Page] ====== START LOAD ======");
  console.log(" [Templates Page] Current state:", {
    hasSession: !!session,
    hasProfile: !!profile,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    role: profile?.role,
    orgId: profile?.org_id
  });
  if (!session) {
    console.log(" [Templates Page] No session found, redirecting to auth");
    throw redirect(303, "/auth");
  }
  if (!profile?.role?.startsWith("id_gen")) {
    console.log(" [Templates Page] Unauthorized role:", {
      role: profile?.role,
      userId: session.user.id
    });
    throw error(403, "Unauthorized - Incorrect user role");
  }
  try {
    console.log(" [Templates Page] Building query with filters:", {
      isSuperAdmin: profile.role === "super_admin",
      orgId: profile.org_id
    });
    let templatesQuery = supabase.from("templates").select(`
                id,
                name,
                user_id,
                org_id,
                orientation,
                created_at,
                front_background,
                back_background,
                template_elements
            `).order("created_at", { ascending: false });
    if (profile.role !== "super_admin" && profile.org_id) {
      console.log(" [Templates Page] Applying org filter:", profile.org_id);
      templatesQuery = templatesQuery.eq("org_id", profile.org_id);
    }
    console.log(" [Templates Page] Executing database query...");
    const { data: templates, error: templatesError } = await templatesQuery;
    if (templatesError) {
      console.error(" [Templates Page] Database error:", {
        error: templatesError,
        details: templatesError.details,
        hint: templatesError.hint,
        code: templatesError.code
      });
      throw error(500, "Error loading templates from database");
    }
    console.log(" [Templates Page] Query successful:", {
      totalTemplates: templates?.length || 0,
      firstTemplateId: templates?.[0]?.id || "no templates",
      hasTemplateElements: templates?.[0]?.template_elements ? "yes" : "no"
    });
    console.log(" [Templates Page] Template sample:", templates?.[0] ? {
      id: templates[0].id,
      name: templates[0].name,
      elementsCount: templates[0].template_elements?.length || 0
    } : "no templates");
    const response = {
      templates: templates || [],
      user: {
        id: session.user.id,
        role: profile.role,
        org_id: profile.org_id
      }
    };
    console.log(" [Templates Page] ====== END LOAD ======");
    return response;
  } catch (e) {
    console.error(" [Templates Page] Unexpected error:", {
      error: e,
      message: e instanceof Error ? e.message : "Unknown error",
      stack: e instanceof Error ? e.stack : void 0
    });
    throw error(500, "An unexpected error occurred while loading templates");
  }
};
const actions = {
  create: async ({ request, locals: { supabase, session, profile } }) => {
    if (!session) {
      throw error(401, "Unauthorized");
    }
    try {
      const formData = await request.formData();
      const templateDataStr = formData.get("templateData");
      if (!templateDataStr) {
        throw error(400, "Template data is required");
      }
      const templateData = JSON.parse(templateDataStr);
      if (!templateData.org_id && profile?.org_id) {
        templateData.org_id = profile.org_id;
      }
      console.log("🎨 Server: Processing template save:", {
        id: templateData.id,
        name: templateData.name,
        org_id: templateData.org_id,
        elementsCount: templateData.template_elements?.length
      });
      templateData.user_id = session.user.id;
      const { data, error: dbError } = await supabase.from("templates").upsert(templateData).select().single();
      if (dbError) {
        console.error("❌ Server: Database error:", dbError);
        throw error(500, "Error saving template");
      }
      if (!data) {
        throw error(500, "No data returned from database");
      }
      console.log("✅ Server: Template saved successfully:", {
        id: data.id,
        name: data.name,
        org_id: data.org_id,
        elementsCount: data.template_elements?.length,
        action: templateData.id ? "updated" : "created"
      });
      return {
        success: true,
        data,
        message: `Template ${templateData.id ? "updated" : "created"} successfully`
      };
    } catch (err) {
      console.error("❌ Server: Error in create action:", err);
      throw error(
        err instanceof Error && err.message.includes("400") ? 400 : 500,
        err instanceof Error ? err.message : "Error processing template save"
      );
    }
  },
  delete: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      throw error(401, "Unauthorized");
    }
    try {
      const formData = await request.formData();
      const templateId = formData.get("templateId");
      if (!templateId) {
        throw error(400, "Template ID is required");
      }
      console.log("🗑️ Server: Processing template delete:", { templateId });
      const { error: updateError } = await supabase.from("idcards").update({ template_id: null }).eq("template_id", templateId);
      if (updateError) {
        console.error("❌ Server: Error updating ID cards:", updateError);
        throw error(500, "Error updating ID cards");
      }
      const { error: deleteError } = await supabase.from("templates").delete().match({ id: templateId }).eq("user_id", session.user.id);
      if (deleteError) {
        console.error("❌ Server: Database error:", deleteError);
        throw error(500, "Error deleting template");
      }
      console.log("✅ Server: Template deleted successfully:", { templateId });
      return {
        success: true,
        message: "Template deleted successfully"
      };
    } catch (err) {
      console.error("❌ Server: Error in delete action:", err);
      throw error(
        err instanceof Error && err.message.includes("400") ? 400 : 500,
        err instanceof Error ? err.message : "Error deleting template"
      );
    }
  }
};
export {
  actions,
  load
};
