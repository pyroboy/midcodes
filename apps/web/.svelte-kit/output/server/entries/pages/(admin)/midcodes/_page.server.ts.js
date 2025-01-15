import { e as error } from "../../../../chunks/index.js";
const load = async ({ locals }) => {
  const { supabase, safeGetSession } = locals;
  const { user, session } = await safeGetSession();
  if (!user) {
    throw error(401, { message: "Unauthorized" });
  }
  if (!session?.access_token) {
    throw error(401, { message: "No valid session" });
  }
  const { data: userProfile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || !userProfile) {
    throw error(500, { message: "Error fetching user profile" });
  }
  if (userProfile.role !== "super_admin") {
    throw error(404, { message: "Not found" });
  }
  const [
    templatesResult,
    idcardsResult,
    organizationsResult,
    profilesResult
  ] = await Promise.all([
    supabase.from("templates").select("*"),
    supabase.from("idcards").select("*"),
    supabase.from("organizations").select("*"),
    supabase.from("profiles").select("*")
  ]);
  if (templatesResult.error) {
    throw error(500, { message: "Error fetching templates" });
  }
  if (idcardsResult.error) {
    throw error(500, { message: "Error fetching ID cards" });
  }
  if (organizationsResult.error) {
    throw error(500, { message: "Error fetching organizations" });
  }
  if (profilesResult.error) {
    throw error(500, { message: "Error fetching profiles" });
  }
  const stats = {
    totalTemplates: templatesResult.data.length,
    totalIdCards: idcardsResult.data.length,
    totalOrganizations: organizationsResult.data.length,
    totalUsers: profilesResult.data.length,
    templatesPerOrg: organizationsResult.data.map((org) => ({
      orgName: org.name,
      count: templatesResult.data.filter((t) => t.org_id === org.id).length
    })),
    idCardsPerOrg: organizationsResult.data.map((org) => ({
      orgName: org.name,
      count: idcardsResult.data.filter((card) => card.org_id === org.id).length
    })),
    usersByRole: {
      superAdmin: profilesResult.data.filter((p) => p.role === "super_admin").length,
      orgAdmin: profilesResult.data.filter((p) => p.role === "org_admin").length,
      user: profilesResult.data.filter((p) => p.role === "user").length
    }
  };
  return {
    stats,
    templates: templatesResult.data,
    idcards: idcardsResult.data,
    organizations: organizationsResult.data,
    profiles: profilesResult.data,
    session
  };
};
export {
  load
};
