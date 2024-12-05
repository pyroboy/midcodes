import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { assertFalse, assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test user credentials
const email = 'admin@example.com'
const password = 'test123456'
const testOrgId = '123e4567-e89b-12d3-a456-426614174000' // Valid UUID for testing

async function cleanupOrganization() {
  // First check if the organization exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', testOrgId)
    .single()

  if (existingOrg) {
    // If it exists, update it
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        name: 'Test Organization'
      })
      .eq('id', testOrgId)
    if (updateError) throw updateError
    return
  }

  // If it doesn't exist, create it
  const { error } = await supabase
    .from('organizations')
    .insert({
      id: testOrgId,
      name: 'Test Organization'
    })
  if (error) throw error
}

async function createTestOrganization() {
  await cleanupOrganization()
}

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

async function getEmulationSession(userId: string) {
  const { data: session, error } = await supabase
    .from('role_emulation_sessions')
    .select('emulated_role, emulated_org_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !session) {
    throw new Error('Failed to get emulation session')
  }

  return session
}

async function cleanupEmulationSessions(userId: string) {
  await supabase
    .from('role_emulation_sessions')
    .update({ status: 'ended' })
    .eq('user_id', userId)
}

// Helper function to get authenticated session
async function getAuthenticatedSession() {
  const { data: { session } } = await supabase.auth.signInWithPassword({ email, password })
  if (!session) {
    throw new Error('Failed to get authenticated session')
  }
  return session
}

Deno.test('Role Emulation Function Tests', async (t) => {
  let authToken: string;
  let userId: string;

  // Setup: Sign in and get auth token
  await t.step('Setup: Sign in', async () => {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    assertExists(session)
    if (!session?.access_token) {
      throw new Error('No access token in session')
    }
    authToken = session.access_token
    userId = session.user.id

    // Set user role to super_admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'super_admin',
        org_id: null
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Wait for profile update to take effect
    const profile = await getProfile(userId)
    assertEquals(profile.role, 'super_admin')

    // Create test organization
    await createTestOrganization()

    // Update profile with organization ID
    const { error: updateOrgError } = await supabase
      .from('profiles')
      .update({ org_id: testOrgId })
      .eq('id', userId)

    if (updateOrgError) throw updateOrgError

    await cleanupEmulationSessions(userId)
  })

  await t.step('Request without JWT should be rejected', async () => {
    await cleanupEmulationSessions(userId)
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
  })

  await t.step('Should start role emulation with organization for org_admin', async () => {
    await cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing role emulation with organization for org_admin...')
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'org_admin',
        emulatedOrgId: testOrgId
      })
    })

    const responseData = await response.json()
    console.log('Response data:', responseData)
    assertEquals(response.ok, true, `Response was not ok: ${JSON.stringify(responseData)}`)
    const session = await getEmulationSession(userId)
    assertEquals(session.emulated_role, 'org_admin')
    assertEquals(session.emulated_org_id, testOrgId)
  })

  await t.step('Should reject org_admin role without organization', async () => {
    await cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing org_admin role without organization...')
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'org_admin'
      })
    })

    const data = await response.json()
    assertFalse(response.ok)
    assertEquals(data.message, 'Organization ID is required for org_admin and super_admin roles')
  })

  await t.step('Should reject super_admin role without organization', async () => {
    await cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing super_admin role without organization...')
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'super_admin'
      })
    })

    const data = await response.json()
    assertFalse(response.ok)
    assertEquals(data.message, 'Organization ID is required for org_admin and super_admin roles')
  })

  await t.step('Should allow super_admin role with organization', async () => {
    await cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing super_admin role with organization...')
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'super_admin',
        emulatedOrgId: testOrgId
      })
    })

    // const responseData = await response.json()
    assertEquals(response.ok, true)
    const session = await getEmulationSession(userId)
    assertEquals(session.emulated_role, 'super_admin')
    assertEquals(session.emulated_org_id, testOrgId)
  })

  await t.step('Should allow event_admin role without organization', async () => {
    await cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing event_admin role without organization...')
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin'
      })
    })

    // const responseData = await response.json()
    assertEquals(response.ok, true)
    const session = await getEmulationSession(userId)
    assertEquals(session.emulated_role, 'event_admin')
    assertEquals(session.emulated_org_id, null)
  })

  await t.step('Should stop role emulation', async () => {
    await cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing stop role emulation...')
    // First start an emulation session
    const startResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin'
      })
    })
    await startResponse.json() // Consume response body

    // Then stop it
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    })

    const responseData = await response.json()
    assertEquals(response.ok, true)
    assertEquals(responseData.status, 'success')
    assertEquals(responseData.message, 'Role emulation stopped')
  })

  // Cleanup: Sign out
  await supabase.auth.signOut()
})

Deno.test('should start role emulation with organization', async () => {
  await createTestOrganization()
  const session = await getAuthenticatedSession()
  
  const response = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      emulatedRole: 'org_admin',
      emulatedOrgId: testOrgId
    })
  })

  assertEquals(response.status, 200)
  const { status, data } = await response.json()
  assertEquals(status, 'success')
  assertExists(data)
})

Deno.test('should allow super_admin role with organization', async () => {
  const session = await getAuthenticatedSession()
  
  const response = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      emulatedRole: 'super_admin',
      emulatedOrgId: testOrgId
    })
  })

  assertEquals(response.status, 200)
  const { status } = await response.json()
  assertEquals(status, 'success')
})

Deno.test('should stop role emulation', async () => {
  const session = await getAuthenticatedSession()
  
  const response = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  assertEquals(response.status, 200)
  const { status } = await response.json()
  assertEquals(status, 'success')
})
