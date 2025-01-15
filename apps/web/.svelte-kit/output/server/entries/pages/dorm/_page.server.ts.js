import { e as error } from "../../../chunks/index.js";
const load = async ({ locals: { safeGetSession, supabase } }) => {
  const session = await safeGetSession();
  const { user, profile } = session;
  if (!user) {
    throw error(401, "Unauthorized");
  }
  if (!profile) {
    throw error(400, "Profile not found");
  }
  session.session?.roleEmulation?.active ? session.session.roleEmulation.emulated_org_id : profile.org_id;
  return {
    user,
    profile,
    session: session.session,
    emulation: session.session?.roleEmulation || null
  };
};
export {
  load
};
