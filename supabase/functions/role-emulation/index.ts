import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

type UserRole = 'super_admin' | 'org_admin' | 'event_admin' | 'event_qr_checker' | 'user'
type EmulationStatus = 'active' | 'ended'

interface RequestBody {
  emulatedRole: UserRole
}

interface ResponseBody {
  status: 'success' | 'error'
  message: string
  data?: unknown
  error?: unknown
}

interface EmulationSession {
  id: string
  user_id: string
  original_role: UserRole
  emulated_role: UserRole
  status: EmulationStatus
  expires_at: string
  created_at: string
  metadata: Record<string, unknown>
}

class RoleEmulationError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'RoleEmulationError'
  }
}

function createResponse(status: number, body: ResponseBody): Response {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

function isUserRole(role: string): role is UserRole {
  return ['super_admin', 'org_admin', 'event_admin', 'event_qr_checker', 'user'].includes(role)
}

async function validateRequest(req: Request): Promise<RequestBody> {
  try {
    console.log('=== DEBUG REQUEST INFO ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const rawBody = await req.text()
    console.log('Raw body text:', rawBody)
    
    let parsedBody = null
    try {
      if (rawBody) {
        parsedBody = JSON.parse(rawBody)
        console.log('Parsed JSON body:', parsedBody)
      } else {
        console.log('No request body provided')
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e)
    }

    if (!parsedBody || typeof parsedBody !== 'object') {
      console.error('[Role Emulation] Body is not an object:', parsedBody)
      throw new RoleEmulationError('Request body must be a JSON object', 400)
    }

    if (!('emulatedRole' in parsedBody)) {
      console.error('[Role Emulation] Missing emulatedRole:', parsedBody)
      throw new RoleEmulationError('emulatedRole is required in request body', 400)
    }

    const { emulatedRole } = parsedBody as { emulatedRole: unknown }
    console.log('[Role Emulation] Extracted emulatedRole:', emulatedRole)
    
    if (!emulatedRole || typeof emulatedRole !== 'string' || !isUserRole(emulatedRole)) {
      console.error('[Role Emulation] Invalid emulatedRole:', emulatedRole)
      throw new RoleEmulationError(
        `Invalid role: ${emulatedRole}. Must be one of: super_admin, org_admin, event_admin, event_qr_checker, user`,
        400
      )
    }

    return { emulatedRole }
  } catch (error) {
    if (error instanceof RoleEmulationError) {
      throw error
    }
    console.error('[Role Emulation] Validation error:', error)
    throw new RoleEmulationError(
      'Request validation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      400
    )
  }
}

async function getSupabaseClient(): Promise<ReturnType<typeof createClient>> {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function handleRoleEmulation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  originalRole: UserRole,
  emulatedRole: UserRole
): Promise<EmulationSession> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 4)

  try {
    const { error: endActiveError } = await supabase
      .from('role_emulation_sessions')
      .update({ status: 'ended' })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (endActiveError) {
      console.error('[Role Emulation] Failed to end active sessions:', endActiveError)
      throw new RoleEmulationError('Failed to end active sessions', 500)
    }

    const metadata = {
      timestamp: new Date().toISOString(),
      action: 'start_emulation',
      previous_role: originalRole
    }

    const { data: emulationSession, error: emulationError } = await supabase
      .from('role_emulation_sessions')
      .insert({
        user_id: userId,
        original_role: originalRole,
        emulated_role: emulatedRole,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        metadata: metadata
      })
      .select()
      .single()

    if (emulationError || !emulationSession) {
      console.error('[Role Emulation] Failed to create emulation session:', emulationError)
      throw new RoleEmulationError('Failed to create emulation session', 500, emulationError)
    }

    return emulationSession
  } catch (error) {
    if (error instanceof RoleEmulationError) {
      throw error
    }
    console.error('[Role Emulation] Database operation error:', error)
    throw new RoleEmulationError(
      'Database operation failed',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

async function handleOptions(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
}

serve(async (req) => {
  try {
    const preflightResponse = await handleOptions(req)
    if (preflightResponse) return preflightResponse

    console.log('=== DEBUG REQUEST INFO ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const contentType = req.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      throw new Error(`Invalid content type: ${contentType}. Expected application/json`)
    }
    
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)
    
    if (!rawBody) {
      throw new Error('Request body is empty')
    }
    
    let body: unknown
    try {
      body = JSON.parse(rawBody)
      console.log('Parsed body:', body)
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      throw new Error('Invalid JSON in request body')
    }
    
    if (!body || typeof body !== 'object') {
      throw new Error('Request body must be a JSON object')
    }
    
    const typedBody = body as Record<string, unknown>
    if (!('emulatedRole' in typedBody)) {
      throw new Error('emulatedRole is required')
    }
    
    if (typeof typedBody.emulatedRole !== 'string') {
      throw new Error('emulatedRole must be a string')
    }
    
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) {
      console.error('[Role Emulation] No authorization header')
      return createResponse(401, {
        status: 'error',
        message: 'No authorization header'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    
    if (userError || !user) {
      console.error('[Role Emulation] Invalid JWT:', userError)
      return createResponse(401, {
        status: 'error',
        message: 'Invalid authorization token'
      })
    }
    console.log('[Role Emulation] JWT verified for user:', user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[Role Emulation] Failed to get user profile:', profileError)
      return createResponse(500, {
        status: 'error',
        message: 'Failed to get user profile'
      })
    }

    if (profile.role !== 'super_admin') {
      console.error('[Role Emulation] User does not have super_admin role:', profile.role)
      return createResponse(403, {
        status: 'error',
        message: 'Only super admins can emulate roles'
      })
    }

    console.log('[Role Emulation] Starting role emulation')
    const emulationSession = await handleRoleEmulation(
      supabase,
      user.id,
      profile.role,
      typedBody.emulatedRole
    )
    console.log('[Role Emulation] Role emulation successful')

    return createResponse(200, {
      status: 'success',
      message: `Role emulation active: ${typedBody.emulatedRole}`,
      data: emulationSession
    })

  } catch (error) {
    console.error('[Role Emulation] Error:', error)
    console.error('[Role Emulation] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    if (error instanceof RoleEmulationError) {
      return createResponse(error.status, {
        status: 'error',
        message: error.message,
        error: error.details
      })
    }

    return createResponse(500, {
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})