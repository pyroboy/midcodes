import "../../chunks/supabaseClient.js";
const load = async ({ data }) => {
  if (!data) {
    return {
      user: null,
      profile: null,
      navigation: {
        homeUrl: "/",
        showHeader: false,
        allowedPaths: [],
        showRoleEmulation: false
      },
      emulation: null,
      special_url: void 0,
      session: null,
      shouldShowDokmutya: false
    };
  }
  const { user, profile: serverProfile, navigation, emulation, special_url, session } = data;
  let profile = null;
  if (serverProfile) {
    const baseProfile = {
      id: serverProfile.id,
      role: serverProfile.role,
      email: serverProfile.email || "",
      context: serverProfile.context,
      org_id: serverProfile.org_id
    };
    if (serverProfile.isEmulated) {
      profile = {
        ...baseProfile,
        isEmulated: true,
        originalRole: serverProfile.originalRole,
        email: serverProfile.email || ""
      };
    } else {
      profile = baseProfile;
    }
  }
  const transformedEmulation = emulation ? {
    active: emulation.isEmulated ?? false,
    emulated_org_id: emulation.emulatedOrgId ?? null
  } : null;
  return {
    user: user ?? null,
    profile,
    navigation,
    emulation: transformedEmulation,
    special_url: special_url ?? void 0,
    session: session?.session ?? null,
    shouldShowDokmutya: data.shouldShowDokmutya ?? false
  };
};
export {
  load
};
