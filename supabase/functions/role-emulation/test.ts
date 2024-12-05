import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { assertFalse } from "https://deno.land/std@0.208.0/assert/mod.ts";

const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test user credentials
const email = 'admin@example.com'
const password = 'test123456'

function sleep(ms: number) {
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

Deno.test('Role Emulation Function Tests', async (t) => {
  await t.step('Request without JWT should be rejected', async () => {
    console.log('\n🔄 Testing request without JWT...')
    const noAuthResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin'
      })
    })

    assertFalse(noAuthResponse.ok)
    await noAuthResponse.text() // Consume the response body
    console.log('✅ Request without JWT correctly rejected')
  })

  await t.step('Request with invalid JWT should be rejected', async () => {
    console.log('\n🔄 Testing request with invalid JWT...')
    const invalidResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid.jwt.token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin'
      })
    })

    assertFalse(invalidResponse.ok)
    await invalidResponse.text() // Consume the response body
    console.log('✅ Invalid JWT correctly rejected')
  })

  await t.step('Request with valid JWT should succeed', async () => {
    console.log('\n🔄 Testing request with valid JWT...')
    
    // Sign in to get a valid JWT
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

    // Make user a super admin if not already
    if (profile.role !== 'super_admin') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', session.user.id)

      if (updateError) {
        throw new Error(`Failed to update role: ${updateError.message}`)
      }
      console.log('✅ Updated user to super_admin')
    }

    // Test with valid JWT
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
    console.log('✅ Role emulation successful with valid JWT')
    console.log('Response:', emulationResult)

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
  })
})
