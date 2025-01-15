import { e as error, r as redirect } from "../../../../chunks/index.js";
const load = async ({ locals: { supabase, safeGetSession, profile }, url }) => {
  const { session, roleEmulation } = await safeGetSession();
  if (!session) {
    throw error(401, "Unauthorized");
  }
  if (!profile) {
    throw error(400, "Profile not found");
  }
  const effectiveOrgId = roleEmulation?.active ? roleEmulation.emulated_org_id : profile.org_id;
  if (!effectiveOrgId) {
    throw error(500, "Organization ID not found");
  }
  const userRole = profile.role;
  const allowedRoles = ["super_admin", "org_admin", "id_gen_admin", "id_gen_user"];
  if (!allowedRoles.includes(userRole)) {
    throw redirect(303, "/unauthorized");
  }
  const { data, error: fetchError } = await supabase.rpc("get_idcards_by_org", {
    org_id: effectiveOrgId,
    page_limit: null,
    // Fetch all records
    page_offset: 0
  });
  if (fetchError) {
    throw error(500, fetchError.message);
  }
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw error(404, "No ID cards found");
  }
  const [header, ...rows] = data;
  if (!header.is_header || !header.metadata) {
    throw error(500, "Invalid response format");
  }
  return {
    idCards: data
  };
};
export {
  load
};
