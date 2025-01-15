import { w as writable } from "./index4.js";
import { s as supabase } from "./supabaseClient.js";
import { g as goto } from "./client.js";
import { jwtDecode } from "jwt-decode";
const timeoutPromise = (ms) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error("Operation timed out")), ms);
});
const _user = writable(null);
const _session = writable(null);
const _profile = writable(null);
const _isLoggingOut = writable(false);
const user = { subscribe: _user.subscribe };
const session = { subscribe: _session.subscribe };
const profile = { subscribe: _profile.subscribe };
({ subscribe: _isLoggingOut.subscribe });
const extractRoleFromJWT = (accessToken) => {
  try {
    const decoded = jwtDecode(accessToken);
    console.log("[JWT Debug] Full decoded token:", decoded);
    console.log("[JWT Debug] App metadata:", decoded.app_metadata);
    const roleEmulation = decoded.app_metadata?.role_emulation ? decoded.app_metadata.role_emulation : null;
    console.log("[JWT Debug] Role emulation state:", {
      active: roleEmulation?.active,
      original_role: roleEmulation?.original_role,
      emulated_role: roleEmulation?.emulated_role,
      original_org_id: roleEmulation?.original_org_id,
      emulated_org_id: roleEmulation?.emulated_org_id,
      expires_at: roleEmulation?.expires_at,
      session_id: roleEmulation?.session_id,
      context: roleEmulation?.context
    });
    return {
      baseRole: roleEmulation?.original_role || decoded.app_metadata?.role,
      currentRole: roleEmulation?.active ? roleEmulation.emulated_role : decoded.app_metadata?.role,
      emulatedRole: roleEmulation?.active ? roleEmulation.emulated_role : null,
      isEmulating: roleEmulation?.active || false,
      status: roleEmulation?.active ? "active" : null,
      emulationExpiry: roleEmulation?.expires_at || null,
      sessionId: roleEmulation?.session_id || null,
      originalOrgId: roleEmulation?.original_org_id || decoded.app_metadata?.org_id,
      emulatedOrgId: roleEmulation?.emulated_org_id || null,
      context: roleEmulation?.active ? roleEmulation.context : null,
      createdAt: null
    };
  } catch (error) {
    console.error("[JWT Debug] Error decoding token:", error);
    return {};
  }
};
const loadUserProfile = async (userId) => {
  const { data, error } = await supabase.from("profiles").select().eq("id", userId).single();
  if (error) {
    console.error("Error loading profile:", error);
    return null;
  }
  return data;
};
const refreshSession = async () => {
  try {
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    if (!newSession) throw new Error("No session after refresh");
    _session.set(newSession);
    _user.set(newSession.user);
    const userProfile = await loadUserProfile(newSession.user.id);
    if (!userProfile) throw new Error("Failed to load user profile after refresh");
    _profile.set(userProfile);
    const { data: activeSession } = await supabase.from("role_emulation_sessions").select("*").eq("user_id", newSession.user.id).eq("status", "active").single();
    console.log("[Role Emulation Debug] Active Session:", activeSession);
    const roleEmulation = extractRoleFromJWT(newSession.access_token);
    console.log("[Role Emulation Debug] JWT Role Data:", roleEmulation);
    return { success: true, session: newSession };
  } catch (error) {
    console.error("Session refresh error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
};
const auth = {
  extractRoleFromJWT,
  loadUserProfile,
  refreshSession,
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (!data.session) throw new Error("No session after sign in");
      await refreshSession();
      return { success: true, data };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred"
      };
    }
  },
  signOut: async () => {
    console.log("[Auth] Starting sign out process");
    try {
      _isLoggingOut.set(true);
      console.log("[Auth] Set isLoggingOut to true");
      try {
        console.log("[Auth] Attempting to end any active emulation");
        const emulationResponse = await Promise.race([
          fetch("/api/role-emulation", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json"
            }
          }),
          timeoutPromise(5e3)
        ]);
        if (!emulationResponse.ok) {
          console.error("[Auth] Failed to end emulation:", await emulationResponse.text());
        } else {
          console.log("[Auth] Emulation end request completed");
        }
      } catch (error) {
        console.error("[Auth] Error ending emulation:", error);
      }
      try {
        console.log("[Auth] Calling server-side signout endpoint");
        const serverResponse = await Promise.race([
          fetch("/auth/signout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          }),
          timeoutPromise(5e3)
        ]);
        if (!serverResponse.ok) {
          console.error("[Auth] Server signout failed:", await serverResponse.text());
        } else {
          console.log("[Auth] Server signout successful");
        }
      } catch (error) {
        console.error("[Auth] Server signout error:", error);
      }
      console.log("[Auth] Clearing all stores");
      _user.set(null);
      _session.set(null);
      _profile.set(null);
      console.log("[Auth] Redirecting to auth page");
      await goto("/auth");
      console.log("[Auth] Sign out process complete");
    } catch (error) {
      console.error("[Auth] Error during sign out:", error);
      try {
        await goto("/auth");
      } catch (e) {
        console.error("[Auth] Failed to redirect after error:", e);
      }
    } finally {
      _isLoggingOut.set(false);
      console.log("[Auth] Set isLoggingOut back to false");
    }
  },
  startRoleEmulation: async (targetRole, durationHours = 4) => {
    try {
      const response = await fetch("/api/role-emulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emulatedRole: targetRole,
          durationHours
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start role emulation");
      }
      const result = await response.json();
      console.log("[Role Emulation] Start result:", result);
      await refreshSession();
      return { success: true, data: result.data };
    } catch (error) {
      console.error("[Role Emulation] Start error:", error);
      throw error;
    }
  },
  stopRoleEmulation: async () => {
    try {
      const response = await fetch("/api/role-emulation/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to stop role emulation");
      }
      const result = await response.json();
      console.log("[Role Emulation] Stop result:", result);
      await refreshSession();
      return { success: true, data: result.data };
    } catch (error) {
      console.error("[Role Emulation] Stop error:", error);
      throw error;
    }
  },
  checkActiveEmulation: async () => {
    const { data: session2 } = await supabase.auth.getSession();
    if (!session2?.session) return null;
    const { data: activeSession } = await supabase.from("role_emulation_sessions").select("*").eq("user_id", session2.session.user.id).eq("status", "active").single();
    return activeSession;
  },
  endEmulation: async () => {
    try {
      const response = await fetch("/api/role-emulation", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Auth] Failed to end emulation:", errorText);
        throw new Error(errorText);
      }
      console.log("[Auth] Successfully ended emulation");
    } catch (error) {
      console.error("[Auth] Error ending emulation:", error);
      throw error;
    }
  },
  clearSession: () => {
    _user.set(null);
    _session.set(null);
    _profile.set(null);
    _isLoggingOut.set(false);
  },
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }
};
export {
  auth as a,
  profile as p,
  session as s,
  user as u
};
