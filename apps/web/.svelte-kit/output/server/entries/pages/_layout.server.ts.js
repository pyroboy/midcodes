import { R as RoleConfig } from "../../chunks/roleConfig.js";
const load = async ({ locals: { safeGetSession, supabase, special_url }, url, request }) => {
  const isDev = false;
  const actualHost = request.headers.get("host")?.trim().toLowerCase() || "";
  const forcedHost = "";
  const isDokmutya = isDev ? actualHost === "dokmutyatirol.ph" || actualHost === "www.dokmutyatirol.ph" || forcedHost === "dokmutyatirol.ph" : actualHost === "dokmutyatirol.ph" || actualHost === "www.dokmutyatirol.ph";
  const shouldShowDokmutya = isDokmutya && url.pathname === "/";
  if (shouldShowDokmutya) {
    return {
      shouldShowDokmutya,
      user: null,
      profile: null,
      navigation: {
        homeUrl: "/",
        showHeader: false,
        allowedPaths: [],
        showRoleEmulation: false
      },
      session: null,
      emulation: null,
      special_url: null
    };
  }
  const { session, user, profile: sessionProfile } = await safeGetSession();
  const response = new Response();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=()");
  let currentProfile = sessionProfile ? { ...sessionProfile } : null;
  let emulationData = null;
  let organizationName = null;
  const navigation = {
    homeUrl: (() => {
      const context = currentProfile?.context || {};
      if (!currentProfile?.role) return "/";
      const path = RoleConfig[currentProfile.role].defaultPath(context);
      return path;
    })(),
    showHeader: false,
    allowedPaths: currentProfile?.role ? RoleConfig[currentProfile.role].allowedPaths : [],
    showRoleEmulation: currentProfile?.role === "super_admin"
  };
  if (session && currentProfile) {
    navigation.showHeader = true;
    if (currentProfile.role === "super_admin") {
      const { data: activeEmulation } = await supabase.from("role_emulation_sessions").select("*").eq("user_id", currentProfile.id).eq("status", "active").gt("expires_at", (/* @__PURE__ */ new Date()).toISOString()).single();
      if (activeEmulation) {
        const { data: org } = await supabase.from("organizations").select("name").eq("id", activeEmulation.emulated_org_id).single();
        organizationName = org?.name ?? null;
        emulationData = {
          ...activeEmulation,
          isEmulated: true,
          originalRole: currentProfile.role,
          originalOrgId: currentProfile.org_id,
          organizationName
        };
        currentProfile = {
          ...currentProfile,
          role: activeEmulation.emulated_role,
          org_id: activeEmulation.emulated_org_id,
          originalRole: currentProfile.role,
          originalOrgId: currentProfile.org_id,
          isEmulated: true
        };
        const emulatedRole = activeEmulation.emulated_role;
        navigation.allowedPaths = RoleConfig[emulatedRole].allowedPaths;
        navigation.showRoleEmulation = true;
      }
    }
  }
  return {
    shouldShowDokmutya,
    user,
    profile: currentProfile,
    navigation,
    session,
    emulation: {
      ...emulationData,
      organizationName
    },
    special_url
  };
};
export {
  load
};
