import { e as error, f as fail } from "../../../../../chunks/index.js";
async function handleImageUploads(supabase, formData, orgId, templateId) {
  try {
    const frontImage = formData.get("frontImage");
    const backImage = formData.get("backImage");
    if (!frontImage || !backImage) {
      return { error: "Missing image files" };
    }
    const timestamp = Date.now();
    const frontPath = `${orgId}/${templateId}/${timestamp}_front.png`;
    const backPath = `${orgId}/${templateId}/${timestamp}_back.png`;
    const frontUpload = await uploadToStorage(supabase, {
      bucket: "rendered-id-cards",
      file: frontImage,
      path: frontPath
    });
    if (frontUpload.error) {
      return { error: "Front image upload failed" };
    }
    const backUpload = await uploadToStorage(supabase, {
      bucket: "rendered-id-cards",
      file: backImage,
      path: backPath
    });
    if (backUpload.error) {
      await deleteFromStorage(supabase, "rendered-id-cards", frontPath);
      return { error: "Back image upload failed" };
    }
    return { frontPath, backPath };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to handle image uploads"
    };
  }
}
async function saveIdCardData(supabase, {
  templateId,
  orgId,
  frontPath,
  backPath,
  formFields
}) {
  try {
    const { data, error: error2 } = await supabase.from("idcards").insert({
      template_id: templateId,
      org_id: orgId,
      front_image: frontPath,
      back_image: backPath,
      data: formFields
    }).select().single();
    if (error2) {
      await Promise.all([
        deleteFromStorage(supabase, "rendered-id-cards", frontPath),
        deleteFromStorage(supabase, "rendered-id-cards", backPath)
      ]);
      return { error: error2 };
    }
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save ID card data" };
  }
}
async function deleteFromStorage(supabase, bucket, path) {
  try {
    const { error: error2 } = await supabase.storage.from(bucket).remove([path]);
    if (error2) {
      return { error: error2.message };
    }
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete from storage" };
  }
}
async function uploadToStorage(supabase, {
  bucket,
  file,
  path,
  options = {}
}) {
  return await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: "image/png",
    upsert: true,
    ...options
  });
}
async function checkAuth({
  safeGetSession,
  action = "access",
  returnFail = false
}) {
  console.log(`[${action}] Starting auth check`);
  const { session, profile } = await safeGetSession();
  console.log(`[${action}] Session:`, {
    hasSession: !!session,
    userId: session?.user?.id,
    hasRoleEmulation: !!session?.roleEmulation
  });
  if (!session) {
    console.log(`[${action}] No session found`);
    const result2 = {
      success: false,
      code: 401,
      error: "Unauthorized"
    };
    if (returnFail) {
      return result2;
    }
    throw error(result2.code, result2.error);
  }
  if (!profile) {
    console.log(`[${action}] No profile found`);
    const result2 = {
      success: false,
      code: 400,
      error: "Profile not found"
    };
    if (returnFail) {
      return result2;
    }
    throw error(result2.code, result2.error);
  }
  const userRole = profile.role;
  console.log(`[${action}] User profile:`, {
    role: userRole,
    orgId: profile.org_id,
    emulation: session.roleEmulation
  });
  if (userRole !== "super_admin" && !userRole.startsWith("id_gen")) {
    console.log(`[${action}] Insufficient permissions:`, { userRole });
    const result2 = {
      success: false,
      code: 403,
      error: "Insufficient permissions"
    };
    if (returnFail) {
      return result2;
    }
    throw error(result2.code, result2.error);
  }
  const result = {
    success: true,
    session,
    profile,
    userRole
  };
  return result;
}
const load = async ({
  params,
  locals: { supabase, safeGetSession }
}) => {
  console.log("[Use Template Load] Starting with params:", params);
  const authResult = await checkAuth({ safeGetSession, action: "Use Template Load" });
  if (!authResult.success) {
    throw error(authResult.code, authResult.error);
  }
  const { session, profile, userRole } = authResult;
  const templateId = params.id;
  console.log(" [Use Template] Loading template:", { templateId });
  const { data: template, error: templateError } = await supabase.from("templates").select("*, organizations(*)").eq("id", templateId).single();
  console.log(" [Use Template] Template query result:", {
    hasTemplate: !!template,
    error: templateError?.message,
    templateData: template ? {
      id: template.id,
      name: template.name,
      org_id: template.org_id,
      elementsCount: template.template_elements?.length || 0
    } : null
  });
  if (templateError || !template) {
    console.error(" [Use Template] Failed to load template:", {
      error: templateError,
      templateId
    });
    throw error(404, "Template not found");
  }
  if (userRole !== "super_admin") {
    const effectiveOrgId = session?.roleEmulation?.active ? session.roleEmulation.emulated_org_id : profile.org_id;
    if (userRole === "id_gen_admin" && !effectiveOrgId) {
      console.log("[Use Template] Organization check:", {
        userRole,
        hasOrgId: false,
        emulated: !!session?.roleEmulation?.active,
        reason: "id_gen_admin requires organization"
      });
      throw error(403, "Access denied - Organization required for id_gen_admin role");
    }
    console.log("[Use Template] Checking organization access:", {
      userRole,
      templateOrgId: template.org_id,
      userOrgId: effectiveOrgId,
      emulated: !!session?.roleEmulation?.active
    });
    if (template.org_id !== effectiveOrgId) {
      throw error(403, "1 You do not have access to this template");
    }
  } else {
    console.log("[Use Template] Skipping organization check:", {
      userRole,
      hasOrgId: !!profile.org_id,
      emulated: !!session?.roleEmulation?.active,
      reason: "super_admin"
    });
  }
  return {
    template
  };
};
const actions = {
  saveIdCard: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log("[Save ID Card] Starting save process...");
    try {
      const authResult = await checkAuth({
        safeGetSession,
        action: "Save ID Card",
        returnFail: true
      });
      if (!authResult.success) {
        return fail(authResult.code, { error: authResult.error });
      }
      const { session, profile, userRole } = authResult;
      const formData = await request.formData();
      console.log("[Save ID Card] Form data received:", {
        fields: Array.from(formData.keys()),
        hasFiles: Array.from(formData.keys()).some((key) => formData.get(key) instanceof File),
        templateId: formData.get("templateId")?.toString()
      });
      const templateId = formData.get("templateId")?.toString();
      if (!templateId) {
        console.log("[Save ID Card] No template ID provided");
        return fail(400, { error: "Template ID is required" });
      }
      const { data: template, error: templateError } = await supabase.from("templates").select("org_id, organizations(*), template_elements").eq("id", templateId).single();
      console.log("[Save ID Card] Template lookup:", {
        found: !!template,
        error: templateError?.message,
        templateOrgId: template?.org_id,
        elementsCount: template?.template_elements?.length
      });
      if (templateError || !template) {
        console.log("[Save ID Card] Template not found:", {
          error: templateError,
          templateId
        });
        return fail(404, { error: "Template not found" });
      }
      if (userRole !== "super_admin") {
        const effectiveOrgId2 = session?.roleEmulation?.active ? session.roleEmulation.emulated_org_id : profile.org_id || "";
        if (userRole === "id_gen_admin" && !effectiveOrgId2) {
          console.log("[Save ID Card] Organization check:", {
            userRole,
            hasOrgId: false,
            emulated: !!session?.roleEmulation?.active,
            reason: "id_gen_admin requires organization"
          });
          return fail(403, { error: "Access denied - Organization required for id_gen_admin role" });
        }
        const templateOrgId = template.org_id || "";
        console.log("[Save ID Card] Checking organization access:", {
          userRole,
          templateOrgId,
          effectiveOrgId: effectiveOrgId2,
          emulated: !!session?.roleEmulation?.active
        });
        const hasAccess = templateOrgId === "" && effectiveOrgId2 === "" || templateOrgId === effectiveOrgId2;
        if (!hasAccess) {
          return fail(403, { error: "2 You do not have access to this template" });
        }
      } else {
        console.log("[Save ID Card] Skipping organization check:", {
          userRole,
          hasOrgId: !!profile.org_id,
          emulated: !!session?.roleEmulation?.active,
          reason: "super_admin"
        });
      }
      console.log("[Save ID Card] Processing image uploads...");
      const effectiveOrgId = (session?.roleEmulation?.active ? session.roleEmulation.emulated_org_id : profile.org_id) ?? "";
      console.log("[Save ID Card] Organization resolution:", {
        effectiveOrgId,
        fromEmulation: session?.roleEmulation?.active,
        emulatedOrgId: session?.roleEmulation?.emulated_org_id,
        profileOrgId: profile.org_id
      });
      if (!effectiveOrgId) {
        console.log("[Save ID Card] No organization ID found");
        return fail(400, { error: "Organization ID is required" });
      }
      const uploadResult = await handleImageUploads(
        supabase,
        formData,
        effectiveOrgId,
        templateId
      );
      console.log("[Save ID Card] Upload result:", {
        success: !("error" in uploadResult),
        error: "error" in uploadResult ? uploadResult.error : null,
        paths: !("error" in uploadResult) ? {
          front: uploadResult.frontPath,
          back: uploadResult.backPath
        } : null
      });
      if ("error" in uploadResult) {
        console.error("[Save ID Card] Upload error:", uploadResult.error);
        return fail(500, { error: "Failed to upload images" });
      }
      console.log("[Save ID Card] Saving ID card data...");
      console.log("[Save ID Card] All form data:", Array.from(formData.entries()));
      const excludedKeys = ["templateId", "frontImage", "backImage"];
      const formFields = {};
      for (const [key, value] of formData.entries()) {
        if (!excludedKeys.includes(key)) {
          formFields[key] = value.toString();
        }
      }
      console.log("[Save ID Card] Form fields:", formFields);
      const { data: idCard, error: saveError } = await saveIdCardData(supabase, {
        templateId,
        orgId: effectiveOrgId,
        frontPath: uploadResult.frontPath,
        backPath: uploadResult.backPath,
        formFields
      });
      console.log("[Save ID Card] Save result:", {
        success: !!idCard,
        error: saveError,
        idCardId: idCard?.id
      });
      if (saveError) {
        console.error("[Save ID Card] Save error:", saveError);
        return fail(500, { error: "Failed to save ID card" });
      }
      console.log("[Save ID Card] Successfully saved ID card:", {
        idCardId: idCard?.id,
        frontPath: uploadResult.frontPath,
        backPath: uploadResult.backPath
      });
      return {
        type: "success",
        data: [{
          success: true,
          idCardId: idCard?.id
        }]
      };
    } catch (err) {
      console.error("[Save ID Card] Unexpected error:", err);
      if (err instanceof Error) {
        console.error("[Save ID Card] Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }
      return fail(500, { error: "An unexpected error occurred" });
    }
  }
};
export {
  actions,
  load
};
