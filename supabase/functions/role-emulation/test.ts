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

      // Make a request to ensure any previous sessions are properly cleaned up
      const cleanupResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      })
      await cleanupResponse.text() // Consume response body
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
    try {
      await testHelpers.safelyConsumeResponse(noAuthResponse)
    } catch {
      // Expected to fail, but we've consumed the response body
    }
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

    try {
      const _responseData = await testHelpers.safelyConsumeResponse(response)
      console.log('Response data:', _responseData)
      assertEquals(response.ok, true, `Response was not ok: ${JSON.stringify(_responseData)}`)
      const session = await testHelpers.getEmulationSession(userId)
      assertEquals(session.emulated_role, 'org_admin')
      assertEquals(session.emulated_org_id, testOrgId)
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
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

    try {
      const data = await testHelpers.safelyConsumeResponse(response)
      assertFalse(response.ok)
      assertEquals(data.message, 'Organization ID is required for org_admin and super_admin roles')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
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

    try {
      const data = await testHelpers.safelyConsumeResponse(response)
      assertFalse(response.ok)
      assertEquals(data.message, 'Organization ID is required for org_admin and super_admin roles')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
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

    try {
      const _responseData = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.ok, true)
      const session = await testHelpers.getEmulationSession(userId)
      assertEquals(session.emulated_role, 'super_admin')
      assertEquals(session.emulated_org_id, testOrgId)
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
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

    try {
      const _responseData = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.ok, true)
      const session = await testHelpers.getEmulationSession(userId)
      assertEquals(session.emulated_role, 'event_admin')
      assertEquals(session.emulated_org_id, null)
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
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

    try {
      const _startData = await testHelpers.safelyConsumeResponse(startResponse)
      assertEquals(startResponse.ok, true)
    } catch {
      // Ignore any errors from starting the session
    }

    // Now stop the session
    const stopResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    })

    try {
      const stopData = await testHelpers.safelyConsumeResponse(stopResponse)
      assertEquals(stopResponse.ok, true)
      assertEquals(stopData.message, 'Role emulation stopped')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
  })

  await t.step('Should handle stopping non-existent emulation session', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing stop emulation with no active session...')
    
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    })

    try {
      const data = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.status, 404)
      assertEquals(data.message, 'No active role emulation session found')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
  })

  await t.step('Should successfully stop active emulation session', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing stop active emulation session...')
    
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

    try {
      const _startData = await testHelpers.safelyConsumeResponse(startResponse)
      assertEquals(startResponse.ok, true)
    } catch {
      // Ignore any errors from starting the session
    }

    // Verify session started
    let session = await testHelpers.getEmulationSession(userId)
    assertEquals(session.status, 'active');

    // Now stop the session
    const stopResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    try {
      const data = await testHelpers.safelyConsumeResponse(stopResponse)
      assertEquals(stopResponse.ok, true);
      assertEquals(data.message, 'Role emulation stopped');
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }

    // Verify session is ended
    session = await testHelpers.getEmulationSession(userId);
    assertEquals(session.status, 'ended');
  })

  await t.step('Should allow role emulation with context metadata', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing role emulation with context metadata...')
    const context = {
      reason: 'Testing context',
      approved_by: 'test@example.com',
      timestamp: new Date().toISOString(),
      metadata: {
        nested: 'value',
        nullValue: null
      }
    }
    
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin',
        context
      })
    })

    try {
      const _responseData = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.ok, true)
      const session = await testHelpers.getEmulationSession(userId)
      assertEquals(session.emulated_role, 'event_admin')
      assertEquals(session.metadata.context, context)
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
  })

  await t.step('Should allow role emulation with null context', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing role emulation with null context...')
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin',
        context: null
      })
    })

    try {
      const _responseData = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.ok, true)
      const session = await testHelpers.getEmulationSession(userId)
      assertEquals(session.emulated_role, 'event_admin')
      assertEquals(session.metadata.context, null)
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
  })

  await t.step('Should reject invalid context values', async () => {
    await testHelpers.cleanupEmulationSessions(userId)
    console.log('\n🔄 Testing role emulation with invalid context...')
    
    // Test with array context
    const arrayResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin',
        context: []
      })
    })

    assertFalse(arrayResponse.ok)
    const arrayData = await testHelpers.safelyConsumeResponse(arrayResponse)
    assertEquals(arrayData.message, 'context must be a plain object or null')

    // Test with undefined value in context
    const undefinedResponse = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emulatedRole: 'event_admin',
        context: {
          valid: 'value',
          invalid: null  // JSON.stringify converts undefined to null
        }
      })
    })

    assertFalse(undefinedResponse.ok)
    const undefinedData = await testHelpers.safelyConsumeResponse(undefinedResponse)
    assertEquals(undefinedData.message, "context property 'invalid' cannot be null")
  })

  // Cleanup: Sign out and consume any remaining response bodies
  await t.step('Cleanup', async () => {
    await testHelpers.signOut();
    
    // Make a final request to ensure all response bodies are consumed
    const response = await fetch('http://localhost:54321/functions/v1/role-emulation', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });
    await response.text(); // Consume the response body
    
    // Clean up any remaining emulation sessions
    await testHelpers.cleanupEmulationSessions(userId);
  });
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

    try {
      const result = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.status, 200)
      assertEquals(result.status, 'success')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
    
    const emulationSession = await testHelpers.getEmulationSession(userId)
    assertEquals(emulationSession.emulated_role, 'org_admin')
    assertEquals(emulationSession.emulated_org_id, testOrgId)
    assertEquals(emulationSession.original_org_id, profile.org_id)

    // Cleanup after test
    await testHelpers.cleanupEmulationSessions(userId)
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

    try {
      const result = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.status, 400)
      assertEquals(result.status, 'error')
      assertEquals(result.message, 'Organization ID is required for org_admin and super_admin roles')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }

    // Cleanup after test
    await testHelpers.cleanupEmulationSessions(userId)
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

    try {
      const result = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.status, 400)
      assertEquals(result.status, 'error')
      assertEquals(result.message, 'Invalid organization ID')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }

    // Cleanup after test
    await testHelpers.cleanupEmulationSessions(userId)
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

    try {
      const result = await testHelpers.safelyConsumeResponse(response)
      assertEquals(response.status, 200)
      assertEquals(result.status, 'success')
    } finally {
      await testHelpers.cleanupEmulationSessions(userId)
    }
    
    const emulationSession = await testHelpers.getEmulationSession(userId)
    assertEquals(emulationSession.emulated_role, 'event_admin')
    assertEquals(emulationSession.emulated_org_id, testOrgId)
    assertEquals(emulationSession.original_org_id, profile.org_id)

    // Cleanup after test
    await testHelpers.cleanupEmulationSessions(userId)
  })

  // Final cleanup
  await testHelpers.cleanupEmulationSessions(userId)
  await testHelpers.signOut()

  // Ensure all response bodies are consumed
  const cleanupResponse = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  await cleanupResponse.text()
})

Deno.test('should start role emulation with organization', async () => {
  const session = await testHelpers.signIn(email, password)
  await testHelpers.cleanupEmulationSessions(session.user.id)
  
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

  try {
    const { status, data } = await testHelpers.safelyConsumeResponse(response)
    assertEquals(response.status, 200)
    assertEquals(status, 'success')
    assertExists(data)
  } finally {
    await testHelpers.cleanupEmulationSessions(session.user.id)
  }

  // Cleanup
  await testHelpers.signOut()
  
  // Ensure response body is consumed
  const cleanupResponse = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  await cleanupResponse.text()
})

Deno.test('should allow super_admin role with organization', async () => {
  const session = await testHelpers.signIn(email, password)
  await testHelpers.cleanupEmulationSessions(session.user.id)
  
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

  try {
    const { status } = await testHelpers.safelyConsumeResponse(response)
    assertEquals(response.status, 200)
    assertEquals(status, 'success')
  } finally {
    await testHelpers.cleanupEmulationSessions(session.user.id)
  }

  // Cleanup
  await testHelpers.signOut()
  
  // Ensure response body is consumed
  const cleanupResponse = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  await cleanupResponse.text()
})

Deno.test('should stop role emulation', async () => {
  const session = await testHelpers.signIn(email, password)
  await testHelpers.cleanupEmulationSessions(session.user.id)

  // Start an emulation session first
  const startResponse = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      emulatedRole: 'event_admin'
    })
  })

  try {
    await testHelpers.safelyConsumeResponse(startResponse)
  } catch {
    // Ignore any errors from starting the session
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  try {
    const { status } = await testHelpers.safelyConsumeResponse(response)
    assertEquals(response.status, 200)
    assertEquals(status, 'success')
  } finally {
    await testHelpers.cleanupEmulationSessions(session.user.id)
  }

  // Cleanup
  await testHelpers.signOut()
  
  // Ensure response body is consumed
  const cleanupResponse = await fetch(`${supabaseUrl}/functions/v1/role-emulation`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  await cleanupResponse.text()
})
