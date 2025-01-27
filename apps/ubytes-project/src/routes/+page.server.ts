import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
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
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else {
        profile = profileData;
      }
    }
  }

  return {
    session,
    user,
    profile
  };
};