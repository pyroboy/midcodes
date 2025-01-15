import { e as error, j as json } from "../../../../../chunks/index.js";
const DELETE = async ({ params, locals: { supabase, safeGetSession } }) => {
  try {
    const { session, roleEmulation, user, profile } = await safeGetSession();
    let userProfile = profile;
    if (!user || !session) {
      throw error(401, { message: "Unauthorized" });
    }
    if (!userProfile) {
      const { data: fetchedProfile, error: profileError } = await supabase.from("profiles").select("*, organizations(id, name)").eq("id", user.id).single();
      if (profileError || !fetchedProfile) {
        console.error("Error fetching profile:", profileError);
        throw error(400, { message: "Profile not found" });
      }
      userProfile = fetchedProfile;
    }
    if (!userProfile) {
      throw error(400, { message: "Profile not found after fetch" });
    }
    const effectiveOrgId = roleEmulation?.active ? roleEmulation.emulated_org_id : userProfile.org_id;
    if (!effectiveOrgId) {
      throw error(500, { message: "Organization ID not found" });
    }
    const userRole = userProfile.role;
    const allowedRoles = ["super_admin", "org_admin", "id_gen_admin"];
    if (!allowedRoles.includes(userRole)) {
      throw error(403, { message: "Insufficient permissions to delete ID cards" });
    }
    const { id } = params;
    if (!id) {
      throw error(400, { message: "ID card ID is required" });
    }
    const { data: idCard, error: fetchError } = await supabase.from("idcards").select("org_id, front_image, back_image").eq("id", id).single();
    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw error(500, { message: "Failed to fetch ID card" });
    }
    if (!idCard) {
      throw error(404, { message: "ID card not found" });
    }
    if (idCard.org_id !== effectiveOrgId) {
      throw error(403, { message: "ID card does not belong to your organization" });
    }
    if (idCard.front_image) {
      const { error: frontDeleteError } = await supabase.storage.from("idcard-images").remove([idCard.front_image]);
      if (frontDeleteError) {
        console.error("Failed to delete front image:", frontDeleteError);
      }
    }
    if (idCard.back_image) {
      const { error: backDeleteError } = await supabase.storage.from("idcard-images").remove([idCard.back_image]);
      if (backDeleteError) {
        console.error("Failed to delete back image:", backDeleteError);
      }
    }
    const { error: deleteError } = await supabase.from("idcards").delete().eq("id", id);
    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw error(500, { message: "Failed to delete ID card from database" });
    }
    return json({ success: true, message: "ID card deleted successfully" });
  } catch (e) {
    console.error("Unexpected error:", e);
    if (e && typeof e === "object" && "status" in e && "body" in e) {
      throw e;
    }
    throw error(500, { message: "An unexpected error occurred" });
  }
};
export {
  DELETE
};
