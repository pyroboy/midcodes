// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { assertFalse, assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { TestHelpers } from './test-helpers.ts';

const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Test configuration
const email = 'admin@example.com'
const password = 'test123456'
const testOrgId = '123e4567-e89b-12d3-a456-426614174000' // Valid UUID for testing
const invalidOrgId = '123e4567-e89b-12d3-a456-426614174999' // Non-existent org ID

const testHelpers = new TestHelpers(supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey);

Deno.test('Role Emulation Function Tests', async (t) => {
  let authToken: string;
  let userId: string;

  // Setup: Create test user and sign in
  await t.step('Setup: Sign in', async () => {
    console.log('\n🔄 Setting up test environment...')
    
    try {
      // Ensure test user exists
      await testHelpers.ensureTestUser(email, password)

      console.log('Signing in as test user...')
      const session = await testHelpers.signIn(email, password)
      assertExists(session, 'Session should exist')
      assertExists(session.access_token, 'Access token should exist')
      assertExists(session.user?.id, 'User ID should exist')
      
      authToken = session.access_token
      userId = session.user.id
      console.log('Successfully signed in as user:', userId)

      // Set user role to super_admin
      console.log('Setting user role to super_admin...')
      await testHelpers.updateUserRole(userId, 'super_admin', null)

      // Wait for profile update to take effect
      console.log('Waiting for profile update...')
      const profile = await testHelpers.getProfile(userId)
      assertEquals(profile.role, 'super_admin')
      console.log('Profile updated successfully')

      // Create test organization
      console.log('Setting up test organization...')
      await testHelpers.createOrganization(testOrgId, 'Test Organization')

      // Update profile with organization ID
      console.log('Updating profile with organization ID...')
      await testHelpers.updateUserRole(userId, 'super_admin', testOrgId)
      console.log('Profile organization updated successfully')

      // Clean up existing sessions
      console.log('Cleaning up any existing emulation sessions...')
      await testHelpers.cleanupEmulationSessions(userId)
      console.log('Setup completed successfully')
    } catch (error) {
      console.error('Setup failed:', error)
      throw error
    }
  })

  await t.step('Request without JWT should be rejected', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
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
    await testHelpers.cleanupEmulationSessions(userId)
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

    const _responseData = await response.json()
    console.log('Response data:', _responseData)
    assertEquals(response.ok, true, `Response was not ok: ${JSON.stringify(_responseData)}`)
    const session = await testHelpers.getEmulationSession(userId)
    assertEquals(session.emulated_role, 'org_admin')
    assertEquals(session.emulated_org_id, testOrgId)
  })

  await t.step('Should reject org_admin role without organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
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

    const _data = await response.json()
    assertFalse(response.ok)
    assertEquals(_data.message, 'Organization ID is required for org_admin and super_admin roles')
  })

  await t.step('Should reject super_admin role without organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
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

    const _data = await response.json()
    assertFalse(response.ok)
    assertEquals(_data.message, 'Organization ID is required for org_admin and super_admin roles')
  })

  await t.step('Should allow super_admin role with organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
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

    const _responseData = await response.json()
    assertEquals(response.ok, true)
    const session = await testHelpers.getEmulationSession(userId)
    assertEquals(session.emulated_role, 'super_admin')
    assertEquals(session.emulated_org_id, testOrgId)
  })

  await t.step('Should allow event_admin role without organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
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

    const _responseData = await response.json()
    assertEquals(response.ok, true)
    const session = await testHelpers.getEmulationSession(userId)
    assertEquals(session.emulated_role, 'event_admin')
    assertEquals(session.emulated_org_id, null)
  })

  await t.step('Should stop role emulation', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
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
    const _startResponseData = await startResponse.json()

    // Then stop it
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    })

    const _responseData = await response.json()
    assertEquals(response.ok, true)
    assertEquals(_responseData.status, 'success')
    assertEquals(_responseData.message, 'Role emulation stopped')
  })

  // Cleanup: Sign out
  await testHelpers.signOut()
})

Deno.test('Role Emulation - Organization Tests', async (t) => {
  // Create test organization and get authenticated session
  await testHelpers.createOrganization(testOrgId, 'Test Organization')
  const session = await testHelpers.signIn(email, password)
  const userId = session.user.id

  await t.step('emulate org_admin role with organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    const profile = await testHelpers.getProfile(userId)
    
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
    const result = await response.json()
    assertEquals(result.status, 'success')
    
    const emulationSession = await testHelpers.getEmulationSession(userId)
    assertEquals(emulationSession.emulated_role, 'org_admin')
    assertEquals(emulationSession.emulated_org_id, testOrgId)
    assertEquals(emulationSession.original_org_id, profile.org_id)
  })

  await t.step('fail to emulate org_admin without organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    
    const response = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emulatedRole: 'org_admin'
      })
    })

    assertEquals(response.status, 400)
    const result = await response.json()
    assertEquals(result.status, 'error')
    assertEquals(result.message, 'Organization ID is required for org_admin and super_admin roles')
  })

  await t.step('fail to emulate with invalid organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    
    const response = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emulatedRole: 'org_admin',
        emulatedOrgId: invalidOrgId
      })
    })

    assertEquals(response.status, 400)
    const result = await response.json()
    assertEquals(result.status, 'error')
    assertEquals(result.message, 'Invalid organization ID')
  })

  await t.step('emulate event_admin with organization', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    const profile = await testHelpers.getProfile(userId)
    
    const response = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin',
        emulatedOrgId: testOrgId
      })
    })

    assertEquals(response.status, 200)
    const result = await response.json()
    assertEquals(result.status, 'success')
    
    const emulationSession = await testHelpers.getEmulationSession(userId)
    assertEquals(emulationSession.emulated_role, 'event_admin')
    assertEquals(emulationSession.emulated_org_id, testOrgId)
    assertEquals(emulationSession.original_org_id, profile.org_id)
  })

  // Cleanup after tests
  await testHelpers.cleanupEmulationSessions(userId)
})

Deno.test('should start role emulation with organization', async () => {
  await testHelpers.createOrganization(testOrgId, 'Test Organization')
  const session = await testHelpers.signIn(email, password)
  
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
  const session = await testHelpers.signIn(email, password)
  
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
  const session = await testHelpers.signIn(email, password)
  
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
