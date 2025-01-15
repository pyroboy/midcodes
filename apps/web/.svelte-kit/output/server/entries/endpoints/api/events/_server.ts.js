import { e as error, j as json } from "../../../../chunks/index.js";
const GET = async ({ locals: { supabase, safeGetSession } }) => {
  try {
    const { session } = await safeGetSession();
    if (!session?.access_token) {
      throw error(401, "Unauthorized");
    }
    const currentOrgId = session.user.user_metadata?.org_id;
    const currentRole = session.user.user_metadata?.role;
    let query = supabase.from("events").select("id, event_url, event_name, org_id, is_public");
    if (currentRole === "super_admin") {
    } else if (currentRole === "org_admin" && currentOrgId) {
      query = query.eq("org_id", currentOrgId);
    } else if (currentOrgId) {
      query = query.or(`org_id.eq.${currentOrgId},is_public.eq.true`);
    } else {
      query = query.eq("is_public", true);
    }
    const { data, error: eventsError } = await query;
    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw error(500, "Failed to fetch events");
    }
    return json({ data: data || [], error: null });
  } catch (err) {
    console.error("Error in events endpoint:", err);
    throw error(500, err instanceof Error ? err.message : "An unknown error occurred");
  }
};
export {
  GET
};
