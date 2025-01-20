// import type { PageServerLoad } from './$types';
// import { error } from '@sveltejs/kit';
// import type { User } from '@supabase/supabase-js';
// import type { Database } from '$lib/database.types';

// type Profile = Database['public']['Tables']['profiles']['Row'];
// type SessionWithAuth = {
//   session: {
//     roleEmulation?: {
//       active: boolean;
//       emulated_org_id: string | null;
//     } | null;
//   } | null;
//   user: User | null;
//   profile: Profile | null;
//   error: Error | null;
// };

// export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
//   const session = await safeGetSession() as SessionWithAuth;
//   const { user, profile } = session;

//   if (!user) {
//     throw error(401, 'Unauthorized');
//   }

//   if (!profile) {
//     throw error(400, 'Profile not found');
//   }

//   // Get the effective organization ID (either emulated or actual)
//   const effectiveOrgId = session.session?.roleEmulation?.active ? 
//     session.session.roleEmulation.emulated_org_id : 
//     profile.org_id;

//   return {
//     user,
//     profile,
//     session: session.session,
//     emulation: session.session?.roleEmulation || null
//   };
// };
