import { fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { Actions, PageServerLoad } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

const VALID_ROLES = [ 'TabulationCommittee', 'TabulationHead', 'User', 'Admin'];

const requireAuth = false; // Set this flag to true or false based on your needs

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  if (requireAuth) {
    const { session, user } = await safeGetSession();
    if (!session || !user) {
      throw redirect(303, '/login');
    }

    const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the user's role
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'Admin') {
      throw redirect(303, '/unauthorized');
    }
  }

  // If the user is an Admin, proceed with fetching accounts
  const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: accounts, error } = await supabase
    .from('profiles')
    .select('id, role, username')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching accounts:', error);
    return { accounts: [] };
  }

  return { accounts };
};

export const actions: Actions = {
  default: async ({ request, locals: { safeGetSession } }) => {
    if (requireAuth) {
      const { session, user } = await safeGetSession();
      if (!session || !user) {
        throw redirect(303, '/login');
      }

      const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch the user's role
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile || userProfile.role !== 'Admin') {
        throw redirect(303, '/unauthorized');
      }
    }

    // If the user is an Admin, proceed with the user creation logic
    const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!VALID_ROLES.includes(role)) {
      return fail(400, { success: false, error: 'Invalid role selected' });
    }

    // Create user using the admin API
    const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createUserError) {
      return fail(400, { success: false, error: createUserError.message });
    }

    // Update the profile with the selected role and other fields
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        username: email.split('@')[0],
        role: role
      })
      .eq('id', authUser.user.id);

    if (updateProfileError) {
      console.error('Failed to update user profile:', updateProfileError);
      return fail(400, { success: false, error: 'Failed to update user profile' });
    }

    return { success: true, message: `User registered successfully with role: ${role}` };
  }
};
