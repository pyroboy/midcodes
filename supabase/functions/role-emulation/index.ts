import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    'Authorization',
    'X-Client-Info',
    'Apikey'
  ].join(', '),
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
}

type UserRole = 'super_admin' | 'org_admin' | 'event_admin' | 'user' | 'event_qr_checker'

interface ErrorResponseBody {
  error: string
  details?: unknown
}

interface RoleEmulationRequest {
  role?: UserRole
  metadata?: Record<string, unknown>
  reset?: boolean
}

serve(async (req: Request) => {
  console.log('=== Starting role emulation request ===')
  console.log('Request method:', req.method)
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    console.log('Creating Supabase client')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    console.log('SUPABASE_URL available:', !!supabaseUrl)
    console.log('SUPABASE_SERVICE_ROLE_KEY available:', !!supabaseKey)
    
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    )

    console.log('Getting auth header')
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      const errorBody: ErrorResponseBody = { error: 'Missing authorization header' }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    console.log('User found:', !!user)
    console.log('User error:', userError)
    
    if (userError || !user) {
      const errorBody: ErrorResponseBody = { error: 'Invalid token', details: userError }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userData = user;


    // if (!userData.user_metadata?.can_emulate_roles) {
    //   const errorBody: ErrorResponseBody = { error: 'Insufficient permissions' }
    //   return new Response(
    //     JSON.stringify(errorBody),
    //     {
    //       status: 403,
    //       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    //     }
    //   )
    // }

    console.log('Parsing request body')
    const requestBody = await req.json() as RoleEmulationRequest
    console.log('Request body:', requestBody)

    if (requestBody.reset) {
      console.log('Handling reset request')
      const { error: updateError } = await supabaseClient
        .from('auth.role_emulation_sessions')
        .update({ status: 'expired' })
        .eq('user_id', userData.id)
        .eq('status', 'active')

      console.log('Reset error:', updateError)

      if (updateError) {
        const errorBody: ErrorResponseBody = { error: 'Failed to reset role', details: updateError }
        return new Response(
          JSON.stringify(errorBody),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Role reset successful' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { role, metadata = {} } = requestBody

    if (!role) {
      const errorBody: ErrorResponseBody = { error: 'Role is required' }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!['org_admin', 'event_admin', 'user', 'event_qr_checker'].includes(role)) {
      const errorBody: ErrorResponseBody = { error: 'Invalid role requested' }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Getting user profile')
    // Check if profiles table exists
    const { data: tableInfo, error: tableError } = await supabaseClient
      .from('profiles')
      .select('*')
      .limit(0)

    console.log('Table info error:', tableError)
    
    if (tableError) {
      console.error('Failed to query profiles table:', tableError)
      const errorBody: ErrorResponseBody = { error: 'Database configuration error', details: tableError }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single()

    console.log('Profile data:', profile)
    console.log('Profile error:', profileError)
    console.log('User ID being queried:', userData.id)

    if (profileError || !profile?.role) {
      console.error('Profile fetch failed:', { profileError, profile })
      const errorBody: ErrorResponseBody = { error: 'Failed to fetch user role', details: profileError }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 4)

    console.log('Expiring active sessions')
    const { error: expireError } = await supabaseClient
      .from('auth.role_emulation_sessions')
      .update({ status: 'expired' })
      .eq('user_id', userData.id)
      .eq('status', 'active')

    console.log('Expire error:', expireError)
    if (expireError) {
      console.error('Failed to expire active sessions:', expireError)
    }

    console.log('Creating new emulation session')
    console.log('Session data:', {
      user_id: userData.id,
      original_role: profile.role,
      emulated_role: role,
      expires_at: expiresAt.toISOString()
    })
    const { data: session, error: sessionError } = await supabaseClient
      .from('auth.role_emulation_sessions')
      .insert({
        user_id: userData.id,
        original_role: profile.role,
        emulated_role: role,
        expires_at: expiresAt.toISOString(),
        metadata: metadata
      })
      .select()
      .single()

    console.log('Session:', session)
    console.log('Session error:', sessionError)

    if (sessionError) {
      const errorBody: ErrorResponseBody = { error: 'Failed to create emulation session', details: sessionError }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== Role emulation successful ===')
    return new Response(
      JSON.stringify({
        success: true,
        session: {
          id: session.id,
          role,
          expires_at: expiresAt.toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Internal server error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    const errorBody: ErrorResponseBody = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    return new Response(
      JSON.stringify(errorBody),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})