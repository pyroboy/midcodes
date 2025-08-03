export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          role: Database['public']['Enums']['user_role']
          created_at: string
          updated_at: string
          org_id: string | null
          context: Record<string, any> | null
        }
        Insert: {
          id: string
          email?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string
          org_id?: string | null
          context?: Record<string, any> | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string
          org_id?: string | null
          context?: Record<string, any> | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: number
          name: string
          address: string
          type: string
          status: Database['public']['Enums']['property_status']
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          address: string
          type: string
          status?: Database['public']['Enums']['property_status']
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          address?: string
          type?: string
          status?: Database['public']['Enums']['property_status']
          created_at?: string
          updated_at?: string | null
        }
      }
      floors: {
        Row: {
          id: number
          property_id: number
          floor_number: number
          wing: string | null
          status: Database['public']['Enums']['floor_status']
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          property_id: number
          floor_number: number
          wing?: string | null
          status?: Database['public']['Enums']['floor_status']
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          property_id?: number
          floor_number?: number
          wing?: string | null
          status?: Database['public']['Enums']['floor_status']
          created_at?: string
          updated_at?: string | null
        }
      }
      rental_unit: {
        Row: {
          id: number
          name: string
          number: number
          capacity: number
          rental_unit_status: Database['public']['Enums']['location_status']
          base_rate: number
          created_at: string
          updated_at: string | null
          property_id: number
          floor_id: number
          type: string
          amenities: Record<string, any> | null
        }
        Insert: {
          id?: number
          name: string
          number: number
          capacity: number
          rental_unit_status?: Database['public']['Enums']['location_status']
          base_rate: number
          created_at?: string
          updated_at?: string | null
          property_id: number
          floor_id: number
          type: string
          amenities?: Record<string, any> | null
        }
        Update: {
          id?: number
          name?: string
          number?: number
          capacity?: number
          rental_unit_status?: Database['public']['Enums']['location_status']
          base_rate?: number
          created_at?: string
          updated_at?: string | null
          property_id?: number
          floor_id?: number
          type?: string
          amenities?: Record<string, any> | null
        }
      }
      events: {
        Row: {
          id: string
          event_name: string
          event_long_name: string | null
          event_url: string | null
          other_info: Record<string, any> | null
          ticketing_data: Record<string, any>[]
          is_public: boolean
          created_at: string
          updated_at: string
          created_by: string
          org_id: string
          payment_timeout_minutes: number | null
        }
        Insert: {
          id?: string
          event_name: string
          event_long_name?: string | null
          event_url?: string | null
          other_info?: Record<string, any> | null
          ticketing_data?: Record<string, any>[]
          is_public?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
          org_id: string
          payment_timeout_minutes?: number | null
        }
        Update: {
          id?: string
          event_name?: string
          event_long_name?: string | null
          event_url?: string | null
          other_info?: Record<string, any> | null
          ticketing_data?: Record<string, any>[]
          is_public?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          org_id?: string
          payment_timeout_minutes?: number | null
        }
      }
      tenants: {
        Row: {
          id: number
          name: string
          contact_number: string | null
          email: string | null
          created_at: string
          updated_at: string | null
          auth_id: string | null
        }
        Insert: {
          id?: number
          name: string
          contact_number?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string | null
          auth_id?: string | null
        }
        Update: {
          id?: number
          name?: string
          contact_number?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string | null
          auth_id?: string | null
        }
      }
      leases: {
        Row: {
          id: number
          rental_unit_id: number
          name: string
          start_date: string
          end_date: string
          rent_amount: number
          security_deposit: number
          balance: number | null
          notes: string | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          terms_month: number | null
          status: Database['public']['Enums']['lease_status']
        }
        Insert: {
          id?: number
          rental_unit_id: number
          name: string
          start_date: string
          end_date: string
          rent_amount: number
          security_deposit: number
          balance?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          terms_month?: number | null
          status?: Database['public']['Enums']['lease_status']
        }
        Update: {
          id?: number
          rental_unit_id?: number
          name?: string
          start_date?: string
          end_date?: string
          rent_amount?: number
          security_deposit?: number
          balance?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          terms_month?: number | null
          status?: Database['public']['Enums']['lease_status']
        }
      }
      lease_tenants: {
        Row: {
          id: number
          lease_id: number
          tenant_id: number
          created_at: string
        }
        Insert: {
          id?: number
          lease_id: number
          tenant_id: number
          created_at?: string
        }
        Update: {
          id?: number
          lease_id?: number
          tenant_id?: number
          created_at?: string
        }
      }
    }
    Enums: {
      user_role: 
        | 'super_admin' 
        | 'org_admin' 
        | 'user' 
        | 'event_admin' 
        | 'event_qr_checker'
        | 'property_admin'
        | 'property_manager'
        | 'property_accountant'
        | 'property_maintenance'
        | 'property_utility'
        | 'property_frontdesk'
        | 'property_tenant'
        | 'property_guest'
        | 'id_gen_admin'
        | 'id_gen_user'
      property_status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
      floor_status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
      location_status: 'VACANT' | 'OCCUPIED' | 'RESERVED'
      lease_status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING'
      lease_type: 'BEDSPACER' | 'PRIVATEROOM'
      maintenance_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
      utility_type: 'ELECTRICITY' | 'WATER' | 'INTERNET'
      billing_type: 'RENT' | 'UTILITY' | 'PENALTY' | 'MAINTENANCE' | 'SERVICE'
      payment_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'PENALIZED'
      payment_method: 'CASH' | 'BANK' | 'GCASH' | 'OTHER'
      payment_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
      expense_type: 'UTILITY' | 'MAINTENANCE' | 'SUPPLIES' | 'OTHER'
      expense_status: 'PENDING' | 'APPROVED' | 'REJECTED'
      tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED'
    }
  }
}