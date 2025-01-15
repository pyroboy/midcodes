import { j as json, e as error } from "../../../../chunks/index.js";
import { R as RoleConfig } from "../../../../chunks/roleConfig.js";
import { P as PUBLIC_SUPABASE_URL } from "../../../../chunks/public.js";
function isValidRole(role) {
  return Object.keys(RoleConfig).includes(role);
}
const POST = async ({ request, locals: { supabase, safeGetSession } }) => {
  try {
    const session = await safeGetSession();
    if (!session.session?.access_token) {
      throw new Error("No access token");
    }
    const functionUrl = `${PUBLIC_SUPABASE_URL}/functions/v1/role-emulation`;
    const payload = await request.json();
    if (!payload.emulatedRole || !isValidRole(payload.emulatedRole)) {
      return json({
        error: "Invalid role specified"
      }, { status: 400 });
    }
    console.log("=== DEBUG CLIENT SIDE ===");
    console.log("Function URL:", functionUrl);
    console.log("Sending body:", payload);
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Function error response:", errorText);
      throw new Error(`Function returned ${response.status}: ${errorText}`);
    }
    const result = await response.json();
    console.log("Function success response:", result);
    return json(result);
  } catch (error2) {
    console.error("Error:", error2);
    return json({
      error: error2 instanceof Error ? error2.message : "Unknown error"
    }, { status: 500 });
  }
};
const DELETE = async ({ locals: { supabase, safeGetSession } }) => {
  try {
    console.log("[Role Emulation] Starting stop emulation request");
    console.log("[Role Emulation] Getting session...");
    const sessionResult = await safeGetSession();
    console.log("[Role Emulation] Session result:", {
      hasSession: !!sessionResult.session,
      hasUser: !!sessionResult.user,
      hasProfile: !!sessionResult.profile
    });
    const { session, user, profile } = sessionResult;
    if (!session?.access_token) {
      throw error(401, "No valid session");
    }
    if (!user) {
      throw error(401, "No user found");
    }
    if (!profile) {
      throw error(401, "No profile found");
    }
    console.log(`[Role Emulation] Stopping emulation for user ${user.id}`);
    console.log("[Role Emulation] Invoking Edge Function...");
    const functionResult = await supabase.functions.invoke("role-emulation", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    console.log("[Role Emulation] Edge Function result:", functionResult);
    if (functionResult.error) {
      throw error(500, "Failed to stop role emulation: " + functionResult.error.message);
    }
    console.log(`[Role Emulation] Successfully stopped emulation for user ${user.id}`);
    return json({ success: true });
  } catch (err) {
    console.error("[Role Emulation] Full error:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "An unexpected error occurred");
  }
};
export {
  DELETE,
  POST
};
