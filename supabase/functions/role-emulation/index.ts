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
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Log the raw request body for debugging
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)
    
    let requestBody: RoleEmulationRequest
    try {
      requestBody = JSON.parse(rawBody)
      console.log('Parsed request body:', requestBody)
    } catch (error) {
      console.error('Failed to parse request body:', error)
      const errorBody: ErrorResponseBody = { error: 'Invalid request body', details: error }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Creating Supabase client')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    console.log('Environment variables:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    })
    
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    )

    console.log('Getting auth header')
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    console.log('Auth header status:', {
      present: !!authHeader,
      length: authHeader?.length
    })
    
    if (!authHeader) {
      console.log('Missing authorization header')
      const errorBody: ErrorResponseBody = { error: 'Missing authorization header' }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Getting user data')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    console.log('User lookup result:', {
      userFound: !!user,
      userId: user?.id,
      errorPresent: !!userError
    })
    
    if (userError || !user) {
      console.error('User lookup failed:', userError)
      const errorBody: ErrorResponseBody = { error: 'Invalid token', details: userError }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate request body
    if (!requestBody.role && !requestBody.reset) {
      console.log('Invalid request body: Either role or reset must be specified')
      const errorBody: ErrorResponseBody = { error: 'Either role or reset must be specified' }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle role change
    try {
      console.log('Attempting role update')
      if (requestBody.reset) {
        // Reset role
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ role: null })
          .eq('id', user.id)
          .select()

        console.log('Update result:', {
          success: !updateError,
          error: updateError
        })

        if (updateError) {
          throw updateError
        }

        console.log('Role reset successful')
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Role reset successfully'
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (requestBody.role) {
        // Change role
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ role: requestBody.role })
          .eq('id', user.id)
          .select()

        console.log('Update result:', {
          success: !updateError,
          error: updateError
        })

        if (updateError) {
          throw updateError
        }

        console.log('Role update successful')
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Role updated successfully',
            role: requestBody.role
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (error) {
      console.error('Role update failed:', error)
      const errorBody: ErrorResponseBody = { 
        error: 'Failed to update role', 
        details: error 
      }
      return new Response(
        JSON.stringify(errorBody),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorBody: ErrorResponseBody = { 
      error: 'Internal server error', 
      details: error 
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