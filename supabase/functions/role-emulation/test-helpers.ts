import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

export class TestHelpers {
  private supabase: SupabaseClient;
  private serviceRoleClient: SupabaseClient | null = null;
  
  constructor(supabaseUrl: string, supabaseKey: string, serviceRoleKey?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    if (serviceRoleKey) {
      this.serviceRoleClient = createClient(supabaseUrl, serviceRoleKey)
    }
  }

  async createOrganization(testOrgId: string, name: string) {
    const client = this.serviceRoleClient || this.supabase
    const { error } = await client
      .from('organizations')
      .upsert({
        id: testOrgId,
        name: name
      })
    if (error) throw error
  }

  async cleanupOrganization(testOrgId: string) {
    const client = this.serviceRoleClient || this.supabase
    const { error } = await client
      .from('organizations')
      .delete()
      .eq('id', testOrgId)
    if (error) throw error
  }

  async getProfile(userId: string, retries = 3): Promise<{ role: string; org_id: string | null }> {
    for (let i = 0; i < retries; i++) {
      const { data: profile, error: profileError } = await this.supabase
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
    await this.supabase
      .from('role_emulation_sessions')
      .update({ status: 'ended' })
      .eq('user_id', userId)
  }

  async ensureTestUser(email: string, password: string) {
    try {
      const { error: signUpError } = await this.supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError && !signUpError.message.includes('already registered')) {
        throw signUpError
      }
    } catch (error) {
      throw error
    }
  }

  async updateUserRole(userId: string, role: string, orgId: string | null) {
    const { error } = await this.supabase
      .from('profiles')
      .update({ 
        role,
        org_id: orgId
      })
      .eq('id', userId)
    
    if (error) throw error
  }

  async signIn(email: string, password: string): Promise<{ access_token: string; user: { id: string } }> {
    const { data: { session }, error } = await this.supabase.auth.signInWithPassword({
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
    await this.supabase.auth.signOut()
  }

  async getEmulationSession(userId: string) {
    const { data: session, error } = await this.supabase
      .from('role_emulation_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !session) {
      throw new Error('Failed to get emulation session')
    }

    return session
  }
}
