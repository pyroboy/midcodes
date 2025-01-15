import { e as error, j as json } from "../../../../chunks/index.js";
const GET = async ({ locals: { supabase, safeGetSession } }) => {
  try {
    const { session } = await safeGetSession();
    if (!session?.access_token) {
      throw new Error("No access token");
    }
    const { data: organizations, error: orgsError } = await supabase.from("organizations").select("id, name").order("name");
    if (orgsError) {
      throw error(500, "Failed to fetch organizations");
    }
    return json({ data: organizations });
  } catch (err) {
    console.error("Error fetching organizations:", err);
    throw error(500, err instanceof Error ? err.message : "An unknown error occurred");
  }
};
export {
  GET
};
