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
  emulatedOrgId?: string
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
  original_org_id: string | null
  emulated_org_id: string | null
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
    if (req.method === 'DELETE') {
      return {} as RequestBody;
    }

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
    
    // Validate emulatedRole
    if (!('emulatedRole' in typedBody)) {
      throw new RoleEmulationError('emulatedRole is required', 400)
    }

    const emulatedRole = typedBody.emulatedRole as string
    if (!isUserRole(emulatedRole)) {
      throw new RoleEmulationError('Invalid emulatedRole', 400)
    }

    // Construct and return a valid RequestBody
    const requestBody: RequestBody = {
      emulatedRole,
      ...(typeof typedBody.emulatedOrgId === 'string' ? { emulatedOrgId: typedBody.emulatedOrgId } : {})
    }

    return requestBody
  } catch (err) {
    if (err instanceof RoleEmulationError) throw err
    throw new RoleEmulationError('Failed to validate request', 400, err)
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
    },
    global: {
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    }
  })
}

async function handleRoleEmulation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  _originalRole: UserRole,
  emulatedRole: UserRole,
  emulatedOrgId?: string
): Promise<EmulationSession> {
  try {
    // Validate org_admin and super_admin require organization ID
    if ((emulatedRole === 'org_admin' || emulatedRole === 'super_admin') && !emulatedOrgId) {
      throw new RoleEmulationError('Organization ID is required for org_admin and super_admin roles', 400);
    }

    // Get user's original profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch profile:', profileError);
      throw new RoleEmulationError('Failed to fetch user profile', 404);
    }

    // Expire any active sessions
    const { error: expireError } = await supabase
      .from('role_emulation_sessions')
      .update({ status: 'ended' })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (expireError) {
      console.error('Failed to expire active sessions:', expireError);
      throw new RoleEmulationError('Failed to expire active sessions', 500);
    }

    // Generate a secure session ID
    const sessionId = crypto.randomUUID();

    // Set expiration to 4 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4);

    // Validate emulatedOrgId exists in organizations table if provided
    if (emulatedOrgId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', emulatedOrgId)
        .single();

      if (orgError || !org) {
        console.error('Invalid organization ID:', orgError);
        throw new RoleEmulationError('Invalid organization ID', 400);
      }
    }

    // Create new emulation session
    console.log('Creating new session with:', {
      sessionId,
      userId,
      originalRole: profile.role,
      emulatedRole,
      originalOrgId: profile.org_id,
      emulatedOrgId
    });

    const { data: session, error: sessionError } = await supabase
      .from('role_emulation_sessions')
      .insert([{
        id: sessionId,
        user_id: userId,
        original_role: profile.role,
        emulated_role: emulatedRole,
        original_org_id: profile.org_id,
        emulated_org_id: emulatedOrgId,
        status: 'active' as const,
        expires_at: expiresAt.toISOString(),
        metadata: {
          created_at: new Date().toISOString()
        }
      }])
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Failed to create session:', sessionError);
      throw new RoleEmulationError('Failed to create emulation session', 500);
    }

    return session;
  } catch (err) {
    if (err instanceof RoleEmulationError) throw err;
    console.error('Internal server error:', err);
    throw new RoleEmulationError('Internal server error', 500, err);
  }
}

async function stopRoleEmulation(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  // First check if there's an active session
  const { data: activeSession, error: queryError } = await supabase
    .from('role_emulation_sessions')
    .select()
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (queryError?.code === 'PGRST116') {
    // PGRST116 is the error code for no rows returned
    throw new RoleEmulationError('No active role emulation session found', 404);
  }

  if (queryError) {
    console.error('Failed to query role emulation session:', queryError);
    throw new RoleEmulationError('Failed to query role emulation session', 500);
  }

  if (!activeSession) {
    throw new RoleEmulationError('No active role emulation session found', 404);
  }

  const { error } = await supabase
    .from('role_emulation_sessions')
    .update({ status: 'ended' })
    .eq('id', activeSession.id);

  if (error) {
    console.error('Failed to stop role emulation:', error);
    throw new RoleEmulationError('Failed to stop role emulation', 500);
  }
}

function handleOptions(req: Request): Response | undefined {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
}

serve(async (req: Request) => {
  try {
    const preflightResponse = await handleOptions(req)
    if (preflightResponse) return preflightResponse

    // Get JWT token from request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new RoleEmulationError('Missing authorization header', 401)
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      throw new RoleEmulationError('Invalid authorization header', 401)
    }

    // Initialize Supabase client
    const supabase = getSupabaseClient()

    // Get user ID from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      throw new RoleEmulationError('Invalid JWT token', 401)
    }

    // Get user's current role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Failed to get profile:', profileError)
      throw new RoleEmulationError('Failed to get user profile', 404)
    }

    if (req.method === 'DELETE') {
      await stopRoleEmulation(supabase, user.id)
      return createResponse(200, {
        status: 'success',
        message: 'Role emulation stopped'
      })
    }

    const body = await validateRequest(req)
    const session = await handleRoleEmulation(supabase, user.id, profile.role, body.emulatedRole, body.emulatedOrgId)

    return createResponse(200, {
      status: 'success',
      message: 'Role emulation started successfully',
      data: session
    })
  } catch (err) {
    console.error('Error in role emulation:', err)
    if (err instanceof RoleEmulationError) {
      return createResponse(err.status, {
        status: 'error',
        message: err.message,
        error: err.details
      })
    }
    return createResponse(500, {
      status: 'error',
      message: 'Internal server error',
      error: err
    })
  }
})