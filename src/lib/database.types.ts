export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'super_admin' | 'org_admin' | 'event_admin' | 'event_qr_checker' | 'user'
          org_id: string | null
          created_at: string
          updated_at: string
          context: Record<string, any> | null
        }
        Insert: {
          id: string
          email: string
          role?: 'super_admin' | 'org_admin' | 'event_admin' | 'event_qr_checker' | 'user'
          org_id?: string | null
          created_at?: string
          updated_at?: string
          context?: Record<string, any> | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'super_admin' | 'org_admin' | 'event_admin' | 'event_qr_checker' | 'user'
          org_id?: string | null
          created_at?: string
          updated_at?: string
          context?: Record<string, any> | null
        }
      }
    }
    Enums: {
      user_role: 'super_admin' | 'org_admin' | 'event_admin' | 'event_qr_checker' | 'user'
    }
  }
}
