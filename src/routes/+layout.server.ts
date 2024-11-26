import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();

  let profile = null;
  let user = null;

  if (session) {
    // Get authenticated user data
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching authenticated user:', userError);
    } else {
      user = userData.user;
    }

    // Fetch user profile

  }

  return {
    session,
    user
  };
};