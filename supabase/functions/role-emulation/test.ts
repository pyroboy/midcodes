import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test user credentials
const email = 'admin@example.com'
const password = 'test123456'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getProfile(userId: string, retries = 3): Promise<{ role: string }> {
  for (let i = 0; i < retries; i++) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profileError && profile) {
      return profile
    }

    if (i < retries - 1) {
      console.log('Waiting for profile to be created...')
      await sleep(1000) // Wait 1 second before retrying
    }
  }
  throw new Error('Failed to get profile after multiple attempts')
}

async function test() {
  try {
    console.log('🔄 Starting role emulation test...')

    // Try to sign up first
    const { data: _signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError && signUpError.message !== 'User already registered') {
      throw new Error(`Sign up error: ${signUpError.message}`)
    }

    console.log('✅ User signup successful or user already exists')

    // Sign in to get the session
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !session) {
      throw new Error(`Login error: ${signInError?.message || 'No session returned'}`)
    }

    console.log('✅ User login successful')

    // Get the user's current role with retries
    const profile = await getProfile(session.user.id)
    console.log(`✅ Current user role: ${profile.role}`)

    // Make user a super admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', session.user.id)

    if (updateError) {
      throw new Error(`Failed to update role: ${updateError.message}`)
    }

    console.log('✅ Updated user to super_admin')

    // Test role emulation
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Role emulation failed: ${errorData.message || response.statusText}`)
    }

    const emulationResult = await response.json()
    console.log('✅ Role emulation response:', emulationResult)

    // Verify the emulated role
    const { data: emulationSession, error: emulationError } = await supabase
      .from('role_emulation_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    if (emulationError) {
      throw new Error(`Error fetching emulation session: ${emulationError.message}`)
    }

    console.log('✅ Active emulation session:', emulationSession)

    // Get effective role
    const { data: effectiveRole, error: effectiveRoleError } = await supabase
      .rpc('get_effective_role', { user_uuid: session.user.id })

    if (effectiveRoleError) {
      throw new Error(`Error getting effective role: ${effectiveRoleError.message}`)
    }

    console.log('✅ Effective role:', effectiveRole)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    throw error
  }
}

test()
