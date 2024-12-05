import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/v132/@supabase/supabase-js@2.38.4?target=deno&no-dts=true";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const _supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
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
    const contentType = req.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      throw new RoleEmulationError(`Invalid content type: ${contentType}. Expected application/json`, 400)
    }

    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)

    if (!rawBody) {
      throw new RoleEmulationError('Request body is empty', 400)
    }

    let body: unknown
    try {
      body = JSON.parse(rawBody)
      console.log('Parsed body:', body)
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      throw new RoleEmulationError('Invalid JSON in request body', 400)
    }

    if (!body || typeof body !== 'object') {
      throw new RoleEmulationError('Request body must be a JSON object', 400)
    }

    const typedBody = body as Record<string, unknown>
    if (!('emulatedRole' in typedBody)) {
      throw new RoleEmulationError('emulatedRole is required', 400)
    }

    const { emulatedRole } = typedBody
    if (typeof emulatedRole !== 'string' || !isUserRole(emulatedRole)) {
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

function getSupabaseClient(): ReturnType<typeof createClient> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
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
    // Check for existing active sessions
    const sessionsQuery = supabase
      .from('role_emulation_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active' as EmulationStatus);

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      throw new RoleEmulationError('Failed to check existing sessions', 500, sessionsError)
    }

    // End any existing active sessions
    if (sessions && sessions.length > 0) {
      const updateQuery = supabase
        .from('role_emulation_sessions')
        .update({ status: 'ended' as EmulationStatus })
        .eq('user_id', userId)
        .eq('status', 'active' as EmulationStatus);

      const { error: endActiveError } = await updateQuery;

      if (endActiveError) {
        throw new RoleEmulationError('Failed to end active sessions', 500, endActiveError)
      }
    }

    // Create new emulation session
    const insertQuery = supabase
      .from('role_emulation_sessions')
      .insert({
        user_id: userId,
        original_role: originalRole,
        emulated_role: emulatedRole,
        status: 'active' as EmulationStatus,
        expires_at: expiresAt.toISOString(),
        metadata: {
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    const { data: session, error: createError } = await insertQuery;

    if (createError || !session) {
      throw new RoleEmulationError('Failed to create emulation session', 500, createError)
    }

    return session as EmulationSession;
  } catch (error) {
    console.error('[Role Emulation] Error in handleRoleEmulation:', error)
    throw error
  }
}

function handleOptions(req: Request): Response | undefined {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return undefined
}

serve(async (req: Request) => {
  try {
    const preflightResponse = await handleOptions(req)
    if (preflightResponse) return preflightResponse

    console.log('=== DEBUG REQUEST INFO ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) {
      console.error('[Role Emulation] No authorization header')
      return createResponse(401, {
        status: 'error',
        message: 'No authorization header'
      })
    }

    const supabase = getSupabaseClient()

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
    const requestBody = await validateRequest(req)
    const emulationSession = await handleRoleEmulation(
      supabase,
      user.id,
      profile.role,
      requestBody.emulatedRole
    )

    console.log('[Role Emulation] Role emulation successful:', emulationSession)
    return createResponse(200, {
      status: 'success',
      message: 'Role emulation started',
      data: emulationSession
    })

  } catch (error) {
    console.error('[Role Emulation] Error:', error)
    if (error instanceof RoleEmulationError) {
      return createResponse(error.status, {
        status: 'error',
        message: error.message,
        error: error.details
      })
    }
    return createResponse(500, {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})