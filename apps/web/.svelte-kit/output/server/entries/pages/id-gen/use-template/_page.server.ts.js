import { e as error } from "../../../../chunks/index.js";
const load = async ({ locals: { supabase, safeGetSession, user, profile } }) => {
  const { session } = await safeGetSession();
  if (!session) {
    throw error(401, "Unauthorized");
  }
  if (!profile) {
    throw error(400, "Profile not found");
  }
  const userRole = profile.role;
  const orgId = profile.org_id;
  const allowedRoles = ["super_admin", "org_admin", "id_gen_admin", "id_gen_user"];
  if (!allowedRoles.includes(userRole)) {
    throw error(403, "Insufficient permissions");
  }
  let query = supabase.from("templates").select("*").order("created_at", { ascending: false });
  if (userRole !== "super_admin") {
    query = query.eq("org_id", orgId);
  }
  const { data: templates, error: err } = await query;
  if (err) {
    console.error("Error fetching templates:", err);
    throw error(500, "Error fetching templates");
  }
  return {
    templates
  };
};
export {
  load
};
