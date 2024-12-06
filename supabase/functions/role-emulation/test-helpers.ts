import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

export class TestHelpers {
  private serviceRoleClient: SupabaseClient;
  
  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);
  }

  async createOrganization(testOrgId: string, name: string) {
    const { error } = await this.serviceRoleClient 
      .from('organizations')
      .upsert({
        id: testOrgId,
        name: name
      })
    if (error) throw error
  }

  async cleanupOrganization(testOrgId: string) {
    const { error } = await this.serviceRoleClient
      .from('organizations')
      .delete()
      .eq('id', testOrgId)
    if (error) throw error
  }

  async getProfile(userId: string, retries = 3): Promise<{ role: string; org_id: string | null }> {
    for (let i = 0; i < retries; i++) {
      const { data: profile, error: profileError } = await this.serviceRoleClient
        .from('profiles')
        .select('role, org_id')
        .eq('id', userId)
        .single()

      if (!profileError && profile) return profile

      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    throw new Error('Failed to get profile after multiple attempts')
  }

  async cleanupEmulationSessions(userId: string) {
    const { data, error } = await this.serviceRoleClient
      .from('role_emulation_sessions')
      .update({ status: 'ended' })
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  }

  private async createSuperAdmin() {
    try {
      const email = 'super.admin@test.com'
      const password = 'test123456'

      // Try to sign in first
      const { error: signInError } = await this.serviceRoleClient.auth.signInWithPassword({
        email,
        password
      })

      // If sign in succeeds or error is not "Invalid login credentials", return
      if (!signInError || signInError.message !== 'Invalid login credentials') {
        return
      }

      // Create new super admin user
      const { data: userData, error: createError } = await this.serviceRoleClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {},
        app_metadata: {}
      })

      if (createError) throw createError

      // Wait for the profile trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Set the user role to super_admin
      await this.serviceRoleClient
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', userData.user.id)

      return userData.user
    } catch (error) {
      console.error('Error creating super admin:', error)
      throw error
    }
  }

  async ensureTestUser(email: string, password: string) {
    try {
      // First ensure we have a super admin user
      await this.createSuperAdmin()

      // Try to sign in first
      const { error: signInError } = await this.serviceRoleClient.auth.signInWithPassword({
        email,
        password,
      })

      // If sign in succeeds or error is not "Invalid login credentials", return
      if (!signInError || signInError.message !== 'Invalid login credentials') {
        return
      }

      // Create new user with minimal data
      const { data: signUpData, error: signUpError } = await this.serviceRoleClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {},
        app_metadata: {}
      })

      if (signUpError) {
        console.error('Error creating user:', signUpError)
        throw signUpError
      }

      // Wait a bit for the profile trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      return signUpData
    } catch (error) {
      console.error('Error in ensureTestUser:', error)
      throw error
    }
  }

  async updateUserRole(userId: string, role: string, orgId: string | null) {
    const { error } = await this.serviceRoleClient
      .from('profiles')
      .update({ 
        role,
        org_id: orgId
      })
      .eq('id', userId)
    
    if (error) throw error
  }

  async signIn(email: string, password: string): Promise<{ access_token: string; user: { id: string } }> {
    const { data: { session }, error } = await this.serviceRoleClient.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (!session?.access_token || !session?.user?.id) {
      throw new Error('Invalid session response')
    }
    return {
      access_token: session.access_token,
      user: { id: session.user.id }
    }
  }

  async signOut() {
    await this.serviceRoleClient.auth.signOut()
  }

  interface EmulationSession {
    id: string
    user_id: string
    emulated_role: string
    emulated_org_id: string | null
    status: 'active' | 'ended'
    created_at: string
    ended_at: string | null
    metadata: Record<string, unknown>
  }

  async getEmulationSession(userId: string, status?: 'active' | 'ended', retries = 3): Promise<EmulationSession | null> {
    for (let i = 0; i < retries; i++) {
      let query = this.serviceRoleClient
        .from('role_emulation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const session = data?.[0];
      if (session) return session;

      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('No emulation session found');
  }

  // Helper function to safely consume response bodies
  async safelyConsumeResponse<T extends { status?: string; message?: string; data?: unknown }>(response: Response): Promise<T> {
    try {
      return await response.json() as T;
    } catch (error) {
      // If JSON parsing fails, still consume the response body
      await response.text();
      throw error;
    }
  }
}
