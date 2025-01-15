import { createServerClient } from "@supabase/ssr";
import { r as redirect, e as error } from "./index.js";
import { P as PUBLIC_SUPABASE_URL, a as PUBLIC_SUPABASE_ANON_KEY } from "./public.js";
import { A as ADMIN_URL } from "./private.js";
import { s as shouldSkipLayout, P as PublicPaths, i as isValidUserRole, g as getRedirectPath } from "./roleConfig.js";
function sequence(...handlers) {
  const length = handlers.length;
  if (!length) return ({ event, resolve }) => resolve(event);
  return ({ event, resolve }) => {
    return apply_handle(0, event, {});
    function apply_handle(i, event2, parent_options) {
      const handle2 = handlers[i];
      return handle2({
        event: event2,
        resolve: (event3, options) => {
          const transformPageChunk = async ({ html, done }) => {
            if (options?.transformPageChunk) {
              html = await options.transformPageChunk({ html, done }) ?? "";
            }
            if (parent_options?.transformPageChunk) {
              html = await parent_options.transformPageChunk({ html, done }) ?? "";
            }
            return html;
          };
          const filterSerializedResponseHeaders = parent_options?.filterSerializedResponseHeaders ?? options?.filterSerializedResponseHeaders;
          const preload = parent_options?.preload ?? options?.preload;
          return i < length - 1 ? apply_handle(i + 1, event3, {
            transformPageChunk,
            filterSerializedResponseHeaders,
            preload
          }) : resolve(event3, { transformPageChunk, filterSerializedResponseHeaders, preload });
        }
      });
    }
  };
}
const CACHE_TTL = 5 * 60 * 1e3;
const SESSION_CACHE_TTL = 60 * 1e3;
const sessionCache = /* @__PURE__ */ new Map();
const profileCache = /* @__PURE__ */ new Map();
const roleEmulationCache = /* @__PURE__ */ new Map();
const isDokmutyaDomain = (host) => {
  if (!host) return false;
  const baseHostname = host.split(":")[0].replace(/^www\./, "");
  return baseHostname === "dokmutyatirol.ph";
};
const hostRouter = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === "development";
  const originalHost = event.request.headers.get("host")?.trim().toLowerCase();
  const host = isDev ? "dokmutyatirol.ph" : originalHost;
  if (isDokmutyaDomain(host) && event.url.pathname === "/") {
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace(
        '<div id="app">',
        '<div id="app" data-dokmutya="true">'
      )
    });
  }
  return resolve(event);
};
const initializeSupabase = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          try {
            event.cookies.set(key, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production"
            });
          } catch (error2) {
            console.debug("Cookie could not be set:", error2);
          }
        },
        remove: (key, options) => {
          try {
            event.cookies.delete(key, { path: "/", ...options });
          } catch (error2) {
            console.debug("Cookie could not be removed:", error2);
          }
        }
      }
    }
  );
  event.locals.getSession = async () => {
    const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser();
    if (userError || !user) return null;
    const { data: { session }, error: sessionError } = await event.locals.supabase.auth.getSession();
    if (sessionError) return null;
    return session;
  };
  event.locals.safeGetSession = async () => {
    const sessionId = event.locals.session?.access_token || "anonymous";
    const now = Date.now();
    const cachedSession = sessionCache.get(sessionId);
    if (cachedSession && now - cachedSession.timestamp < SESSION_CACHE_TTL) {
      return cachedSession.data;
    }
    const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser();
    if (userError || !user) {
      const result2 = {
        session: null,
        error: userError || new Error("User not authenticated"),
        user: null,
        profile: null,
        roleEmulation: null
      };
      sessionCache.set(sessionId, { data: result2, timestamp: now });
      return result2;
    }
    const { data: { session: initialSession }, error: sessionError } = await event.locals.supabase.auth.getSession();
    if (sessionError || !initialSession) {
      const result2 = {
        session: null,
        error: sessionError || new Error("Invalid session"),
        user: null,
        profile: null,
        roleEmulation: null
      };
      sessionCache.set(sessionId, { data: result2, timestamp: now });
      return result2;
    }
    let currentSession = initialSession;
    if (currentSession.expires_at) {
      const expiresAt = Math.floor(new Date(currentSession.expires_at).getTime() / 1e3);
      const now2 = Math.floor(Date.now() / 1e3);
      if (now2 > expiresAt) {
        try {
          const { data: { session: refreshedSession }, error: error2 } = await event.locals.supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token
          });
          if (!error2 && refreshedSession) {
            currentSession = refreshedSession;
          }
        } catch (err) {
          console.error("Error refreshing session:", err);
          const result2 = {
            session: null,
            error: err instanceof Error ? err : new Error("Session refresh failed"),
            user: null,
            profile: null,
            roleEmulation: null
          };
          sessionCache.set(sessionId, { data: result2, timestamp: now2 });
          return result2;
        }
      }
    }
    const [profile, activeEmulation] = await Promise.all([
      getUserProfile(user.id, event.locals.supabase),
      getActiveRoleEmulation(user.id, event.locals.supabase)
    ]);
    let emulatedProfile = profile;
    let roleEmulation = null;
    if (profile?.role === "super_admin") {
      event.locals.special_url = "/" + ADMIN_URL;
    } else {
      event.locals.special_url = "/";
    }
    if (activeEmulation && profile) {
      const { data: org } = await event.locals.supabase.from("organizations").select("name").eq("id", activeEmulation.emulated_org_id).single();
      roleEmulation = {
        active: true,
        original_role: activeEmulation.original_role,
        emulated_role: activeEmulation.emulated_role,
        original_org_id: profile.organization_id || null,
        emulated_org_id: activeEmulation.emulated_org_id,
        expires_at: activeEmulation.expires_at,
        session_id: activeEmulation.id,
        metadata: activeEmulation.metadata,
        organizationName: org?.name ?? null
      };
      emulatedProfile = {
        ...profile,
        role: activeEmulation.emulated_role,
        originalRole: profile.role,
        isEmulated: true
      };
      currentSession.roleEmulation = roleEmulation;
    }
    const result = { session: currentSession, error: null, user, profile: emulatedProfile, roleEmulation };
    sessionCache.set(sessionId, { data: result, timestamp: now });
    return result;
  };
  return resolve(event);
};
const roleEmulationGuard = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === "development";
  const host = isDev ? "dokmutyatirol.ph" : event.request.headers.get("host")?.trim().toLowerCase();
  if (isDokmutyaDomain(host) || event.url.pathname.startsWith("/dokmutya")) {
    return resolve(event);
  }
  if (event.url.pathname.startsWith("/api")) {
    return resolve(event);
  }
  const sessionInfo = await event.locals.safeGetSession();
  if (sessionInfo.roleEmulation?.active) {
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(sessionInfo.roleEmulation.expires_at);
    if (now > expiresAt) {
      await event.locals.supabase.from("role_emulation_sessions").update({ status: "expired" }).eq("id", sessionInfo.roleEmulation.session_id);
      try {
        event.cookies.delete("role_emulation", { path: "/" });
      } catch (error2) {
        console.debug("Could not delete role_emulation cookie:", error2);
      }
      if (sessionInfo.session) {
        delete sessionInfo.session.roleEmulation;
      }
      if (sessionInfo.user) {
        roleEmulationCache.delete(sessionInfo.user.id);
      }
      throw redirect(303, event.url.pathname);
    }
  }
  return resolve(event);
};
const authGuard = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === "development";
  const host = isDev ? "dokmutyatirol.ph" : event.request.headers.get("host")?.trim().toLowerCase();
  if (isDokmutyaDomain(host) || event.url.pathname.startsWith("/dokmutya")) {
    return resolve(event);
  }
  if (shouldSkipLayout(event.url.pathname)) {
    return resolve(event, {
      transformPageChunk: ({ html }) => html
    });
  }
  if (event.url.pathname.startsWith("/api")) {
    const sessionInfo2 = await event.locals.safeGetSession();
    if (!sessionInfo2.user) {
      throw error(401, "Unauthorized");
    }
    event.locals = {
      ...event.locals,
      session: sessionInfo2.session,
      user: sessionInfo2.user
    };
    return resolve(event);
  }
  const sessionInfo = await event.locals.safeGetSession();
  event.locals = {
    ...event.locals,
    session: sessionInfo.session,
    user: sessionInfo.user,
    profile: sessionInfo.profile
  };
  if (!sessionInfo.user) {
    throw redirect(303, PublicPaths.auth);
  }
  if (!sessionInfo.profile?.role || !isValidUserRole(sessionInfo.profile.role)) {
    throw error(400, "Invalid user role");
  }
  const originalRole = sessionInfo.profile?.originalRole;
  const context = sessionInfo.roleEmulation?.metadata?.context || sessionInfo.profile?.context || {};
  if (sessionInfo.profile.role === "super_admin" || originalRole === "super_admin") {
    if (event.url.pathname === `/${ADMIN_URL}`) {
      return resolve(event);
    }
    if (event.url.pathname === "/") {
      throw redirect(303, `/${ADMIN_URL}`);
    }
  }
  const redirectPath = getRedirectPath(
    sessionInfo.profile.role,
    event.url.pathname,
    originalRole,
    context
  );
  if (redirectPath === PublicPaths.error) {
    event.locals = {
      ...event.locals,
      session: null,
      user: null,
      profile: null
    };
    throw error(404, { message: "Not found" });
  }
  if (redirectPath === PublicPaths.auth) {
    throw error(403, { message: "Forbidden" });
  }
  if (redirectPath) {
    throw redirect(303, redirectPath);
  }
  return resolve(event);
};
async function getUserProfile(userId, supabase) {
  const now = Date.now();
  const cachedProfile = profileCache.get(userId);
  if (cachedProfile && now - cachedProfile.timestamp < CACHE_TTL) {
    return cachedProfile.data;
  }
  const { data: profile, error: error2 } = await supabase.from("profiles").select("*, organizations(id, name), context").eq("id", userId).single();
  if (error2) {
    console.error("Error fetching profile:", error2);
    profileCache.set(userId, { data: null, timestamp: now });
    return null;
  }
  profileCache.set(userId, { data: profile, timestamp: now });
  return profile;
}
async function getActiveRoleEmulation(userId, supabase) {
  const now = Date.now();
  const cachedEmulation = roleEmulationCache.get(userId);
  if (cachedEmulation && now - cachedEmulation.timestamp < CACHE_TTL) {
    return cachedEmulation.data;
  }
  const { data: emulation } = await supabase.from("role_emulation_sessions").select("*").eq("user_id", userId).eq("status", "active").gt("expires_at", (/* @__PURE__ */ new Date()).toISOString()).single();
  roleEmulationCache.set(userId, { data: emulation || null, timestamp: now });
  return emulation;
}
const handle = sequence(hostRouter, initializeSupabase, roleEmulationGuard, authGuard);
export {
  handle
};
