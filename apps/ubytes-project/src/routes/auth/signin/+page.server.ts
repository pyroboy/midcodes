// +page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return fail(400, { error: error.message })
    }

    // Fetch user profile to get the role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return fail(500, { error: 'An unexpected error occurred' })
    }

    // Redirect based on role
    switch (profile.role) {
      case 'EventChairman':
        throw redirect(303, '/event/chairman')
      case 'TabulationCommittee':
        throw redirect(303, '/tabulation')
      case 'TabulationHead':
        throw redirect(303, '/tabulation')
      default:
        throw redirect(303, '/events')
    }
  },
}
