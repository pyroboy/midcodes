export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_audit: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          org_id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          prompt_id: string
          prompt_text: string
          updated_at: string
        }
        Insert: {
          prompt_id: string
          prompt_text: string
          updated_at?: string
        }
        Update: {
          prompt_id?: string
          prompt_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendees: {
        Row: {
          attendance_status: string | null
          basic_info: Json | null
          created_at: string | null
          event_id: string
          id: string
          is_paid: boolean | null
          is_printed: boolean | null
          org_id: string
          qr_link: string | null
          qr_scan_info: Json[] | null
          received_by: string | null
          reference_code_url: string | null
          ticket_info: Json | null
          updated_at: string | null
        }
        Insert: {
          attendance_status?: string | null
          basic_info?: Json | null
          created_at?: string | null
          event_id: string
          id?: string
          is_paid?: boolean | null
          is_printed?: boolean | null
          org_id: string
          qr_link?: string | null
          qr_scan_info?: Json[] | null
          received_by?: string | null
          reference_code_url?: string | null
          ticket_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string | null
          basic_info?: Json | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_paid?: boolean | null
          is_printed?: boolean | null
          org_id?: string
          qr_link?: string | null
          qr_scan_info?: Json[] | null
          received_by?: string | null
          reference_code_url?: string | null
          ticket_info?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billings: {
        Row: {
          amount: number
          balance: number
          billing_date: string
          created_at: string
          due_date: string
          id: number
          lease_id: number
          meter_id: number | null
          notes: string | null
          paid_amount: number | null
          penalty_amount: number | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["billing_type"]
          updated_at: string | null
          utility_type: Database["public"]["Enums"]["utility_type"] | null
        }
        Insert: {
          amount: number
          balance: number
          billing_date: string
          created_at?: string
          due_date: string
          id?: number
          lease_id: number
          meter_id?: number | null
          notes?: string | null
          paid_amount?: number | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["billing_type"]
          updated_at?: string | null
          utility_type?: Database["public"]["Enums"]["utility_type"] | null
        }
        Update: {
          amount?: number
          balance?: number
          billing_date?: string
          created_at?: string
          due_date?: string
          id?: number
          lease_id?: number
          meter_id?: number | null
          notes?: string | null
          paid_amount?: number | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["billing_type"]
          updated_at?: string | null
          utility_type?: Database["public"]["Enums"]["utility_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "billings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          age_confirmed: boolean
          artist_preference: string | null
          category: string | null
          color_prefs: string | null
          complexity: number | null
          created_at: string
          creative_freedom: number | null
          dob: string | null
          email: string
          estimated_duration: number | null
          estimated_sessions: number | null
          facebook_profile: string | null
          id: string
          instagram_handle: string | null
          is_color: boolean
          is_cover_up: boolean
          medical_confirmed: boolean
          must_haves: string | null
          name: string
          phone: string
          placement: string | null
          placement_notes: string | null
          preferred_contact: string | null
          pricing_details: Json | null
          primary_tattoo_style: string | null
          reference_image_urls: Json | null
          requested_date: string | null
          requested_time: string | null
          saved_reply_recommendations: Json | null
          specific_reqs: string | null
          status: string
          style_description: string | null
          tattoo_size: number | null
          terms_agreed: boolean
        }
        Insert: {
          admin_notes?: string | null
          age_confirmed?: boolean
          artist_preference?: string | null
          category?: string | null
          color_prefs?: string | null
          complexity?: number | null
          created_at?: string
          creative_freedom?: number | null
          dob?: string | null
          email: string
          estimated_duration?: number | null
          estimated_sessions?: number | null
          facebook_profile?: string | null
          id?: string
          instagram_handle?: string | null
          is_color?: boolean
          is_cover_up?: boolean
          medical_confirmed?: boolean
          must_haves?: string | null
          name: string
          phone: string
          placement?: string | null
          placement_notes?: string | null
          preferred_contact?: string | null
          pricing_details?: Json | null
          primary_tattoo_style?: string | null
          reference_image_urls?: Json | null
          requested_date?: string | null
          requested_time?: string | null
          saved_reply_recommendations?: Json | null
          specific_reqs?: string | null
          status?: string
          style_description?: string | null
          tattoo_size?: number | null
          terms_agreed?: boolean
        }
        Update: {
          admin_notes?: string | null
          age_confirmed?: boolean
          artist_preference?: string | null
          category?: string | null
          color_prefs?: string | null
          complexity?: number | null
          created_at?: string
          creative_freedom?: number | null
          dob?: string | null
          email?: string
          estimated_duration?: number | null
          estimated_sessions?: number | null
          facebook_profile?: string | null
          id?: string
          instagram_handle?: string | null
          is_color?: boolean
          is_cover_up?: boolean
          medical_confirmed?: boolean
          must_haves?: string | null
          name?: string
          phone?: string
          placement?: string | null
          placement_notes?: string | null
          preferred_contact?: string | null
          pricing_details?: Json | null
          primary_tattoo_style?: string | null
          reference_image_urls?: Json | null
          requested_date?: string | null
          requested_time?: string | null
          saved_reply_recommendations?: Json | null
          specific_reqs?: string | null
          status?: string
          style_description?: string | null
          tattoo_size?: number | null
          terms_agreed?: boolean
        }
        Relationships: []
      }
      budgets: {
        Row: {
          actual_amount: number | null
          budget_items: Json | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: number
          pending_amount: number | null
          planned_amount: number
          project_category: string | null
          project_description: string | null
          project_name: string
          property_id: number
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          budget_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: never
          pending_amount?: number | null
          planned_amount: number
          project_category?: string | null
          project_description?: string | null
          project_name: string
          property_id: number
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          budget_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: never
          pending_amount?: number | null
          planned_amount?: number
          project_category?: string | null
          project_description?: string | null
          project_name?: string
          property_id?: number
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          credits_after: number
          credits_before: number
          description: string | null
          id: string
          metadata: Json | null
          org_id: string
          reference_id: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credits_after: number
          credits_before: number
          description?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          reference_id?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credits_after?: number
          credits_before?: number
          description?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          reference_id?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string
          event_long_name: string | null
          event_name: string
          event_url: string | null
          id: string
          is_public: boolean | null
          org_id: string
          other_info: Json | null
          payment_timeout_minutes: number | null
          ticketing_data: Json[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          event_long_name?: string | null
          event_name: string
          event_url?: string | null
          id?: string
          is_public?: boolean | null
          org_id: string
          other_info?: Json | null
          payment_timeout_minutes?: number | null
          ticketing_data?: Json[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          event_long_name?: string | null
          event_name?: string
          event_url?: string | null
          id?: string
          is_public?: boolean | null
          org_id?: string
          other_info?: Json | null
          payment_timeout_minutes?: number | null
          ticketing_data?: Json[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          expense_date: string | null
          id: number
          property_id: number | null
          status: Database["public"]["Enums"]["expense_status"]
          type: Database["public"]["Enums"]["expense_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string | null
          id?: number
          property_id?: number | null
          status?: Database["public"]["Enums"]["expense_status"]
          type: Database["public"]["Enums"]["expense_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string | null
          id?: number
          property_id?: number | null
          status?: Database["public"]["Enums"]["expense_status"]
          type?: Database["public"]["Enums"]["expense_type"]
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          created_at: string
          floor_number: number
          id: number
          property_id: number
          status: Database["public"]["Enums"]["floor_status"]
          updated_at: string | null
          wing: string | null
        }
        Insert: {
          created_at?: string
          floor_number: number
          id?: number
          property_id: number
          status?: Database["public"]["Enums"]["floor_status"]
          updated_at?: string | null
          wing?: string | null
        }
        Update: {
          created_at?: string
          floor_number?: number
          id?: number
          property_id?: number
          status?: Database["public"]["Enums"]["floor_status"]
          updated_at?: string | null
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floors_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      idcards: {
        Row: {
          back_image: string | null
          created_at: string | null
          data: Json | null
          front_image: string | null
          id: string
          org_id: string
          template_id: string | null
        }
        Insert: {
          back_image?: string | null
          created_at?: string | null
          data?: Json | null
          front_image?: string | null
          id?: string
          org_id: string
          template_id?: string | null
        }
        Update: {
          back_image?: string | null
          created_at?: string | null
          data?: Json | null
          front_image?: string | null
          id?: string
          org_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idcards_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idcards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_tenants: {
        Row: {
          created_at: string
          id: number
          lease_id: number
          tenant_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          lease_id: number
          tenant_id: number
        }
        Update: {
          created_at?: string
          id?: number
          lease_id?: number
          tenant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lease_tenants_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          end_date: string
          id: number
          name: string
          notes: string | null
          rent_amount: number
          rental_unit_id: number
          security_deposit: number
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          terms_month: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          end_date: string
          id?: number
          name: string
          notes?: string | null
          rent_amount: number
          rental_unit_id: number
          security_deposit: number
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          terms_month?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          end_date?: string
          id?: number
          name?: string
          notes?: string | null
          rent_amount?: number
          rental_unit_id?: number
          security_deposit?: number
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          terms_month?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_rental_unit_id_fkey"
            columns: ["rental_unit_id"]
            isOneToOne: false
            referencedRelation: "rental_unit"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          id: number
          location_id: number
          status: Database["public"]["Enums"]["maintenance_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          id?: number
          location_id: number
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: number
          location_id?: number
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "rental_unit"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          created_at: string
          floor_id: number | null
          id: number
          initial_reading: number | null
          is_active: boolean | null
          location_type: Database["public"]["Enums"]["meter_location_type"]
          name: string
          notes: string | null
          property_id: number | null
          rental_unit_id: number | null
          status: Database["public"]["Enums"]["meter_status"]
          type: Database["public"]["Enums"]["utility_type"]
        }
        Insert: {
          created_at?: string
          floor_id?: number | null
          id?: number
          initial_reading?: number | null
          is_active?: boolean | null
          location_type: Database["public"]["Enums"]["meter_location_type"]
          name: string
          notes?: string | null
          property_id?: number | null
          rental_unit_id?: number | null
          status?: Database["public"]["Enums"]["meter_status"]
          type: Database["public"]["Enums"]["utility_type"]
        }
        Update: {
          created_at?: string
          floor_id?: number | null
          id?: number
          initial_reading?: number | null
          is_active?: boolean | null
          location_type?: Database["public"]["Enums"]["meter_location_type"]
          name?: string
          notes?: string | null
          property_id?: number | null
          rental_unit_id?: number | null
          status?: Database["public"]["Enums"]["meter_status"]
          type?: Database["public"]["Enums"]["utility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "meters_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_rental_unit_id_fkey"
            columns: ["rental_unit_id"]
            isOneToOne: false
            referencedRelation: "rental_unit"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          org_id: string
          payments_bypass: boolean
          payments_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          org_id: string
          payments_bypass?: boolean
          payments_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          org_id?: string
          payments_bypass?: boolean
          payments_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          amount: number
          billing_id: number | null
          created_at: string | null
          id: number
          payment_id: number | null
        }
        Insert: {
          amount: number
          billing_id?: number | null
          created_at?: string | null
          id?: number
          payment_id?: number | null
        }
        Update: {
          amount?: number
          billing_id?: number | null
          created_at?: string | null
          id?: number
          payment_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount_php: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string
          kind: string
          metadata: Json | null
          method: string | null
          method_allowed: string[]
          paid_at: string | null
          provider_payment_id: string | null
          raw_event: Json | null
          reason: string | null
          session_id: string
          sku_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_php: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key: string
          kind: string
          metadata?: Json | null
          method?: string | null
          method_allowed: string[]
          paid_at?: string | null
          provider_payment_id?: string | null
          raw_event?: Json | null
          reason?: string | null
          session_id: string
          sku_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_php?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string
          kind?: string
          metadata?: Json | null
          method?: string | null
          method_allowed?: string[]
          paid_at?: string | null
          provider_payment_id?: string | null
          raw_event?: Json | null
          reason?: string | null
          session_id?: string
          sku_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          billing_id: number | null
          billing_ids: number[]
          created_at: string
          created_by: string | null
          id: number
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          paid_by: string
          receipt_url: string | null
          reference_number: string | null
          revert_reason: string | null
          reverted_at: string | null
          reverted_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          billing_id?: number | null
          billing_ids: number[]
          created_at?: string
          created_by?: string | null
          id?: number
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at: string
          paid_by: string
          receipt_url?: string | null
          reference_number?: string | null
          revert_reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          billing_id?: number | null
          billing_ids?: number[]
          created_at?: string
          created_by?: string | null
          id?: number
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          paid_by?: string
          receipt_url?: string | null
          reference_number?: string | null
          revert_reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_configs: {
        Row: {
          compound_period: number | null
          created_at: string
          grace_period: number
          id: number
          max_penalty_percentage: number | null
          penalty_percentage: number
          type: Database["public"]["Enums"]["billing_type"]
          updated_at: string | null
        }
        Insert: {
          compound_period?: number | null
          created_at?: string
          grace_period: number
          id?: number
          max_penalty_percentage?: number | null
          penalty_percentage: number
          type: Database["public"]["Enums"]["billing_type"]
          updated_at?: string | null
        }
        Update: {
          compound_period?: number | null
          created_at?: string
          grace_period?: number
          id?: number
          max_penalty_percentage?: number | null
          penalty_percentage?: number
          type?: Database["public"]["Enums"]["billing_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          card_generation_count: number
          context: Json | null
          created_at: string | null
          credits_balance: number
          email: string | null
          id: string
          org_id: string | null
          remove_watermarks: boolean
          role: Database["public"]["Enums"]["user_role"] | null
          template_count: number
          unlimited_templates: boolean
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          card_generation_count?: number
          context?: Json | null
          created_at?: string | null
          credits_balance?: number
          email?: string | null
          id: string
          org_id?: string | null
          remove_watermarks?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          template_count?: number
          unlimited_templates?: boolean
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          card_generation_count?: number
          context?: Json | null
          created_at?: string | null
          credits_balance?: number
          email?: string | null
          id?: string
          org_id?: string | null
          remove_watermarks?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          template_count?: number
          unlimited_templates?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          created_at: string
          id: number
          name: string
          status: Database["public"]["Enums"]["property_status"]
          type: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: number
          name: string
          status?: Database["public"]["Enums"]["property_status"]
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: number
          name?: string
          status?: Database["public"]["Enums"]["property_status"]
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      readings: {
        Row: {
          backdating_enabled: boolean | null
          created_at: string
          id: number
          meter_id: number
          meter_name: string | null
          previous_reading: number | null
          rate_at_reading: number | null
          reading: number
          reading_date: string
        }
        Insert: {
          backdating_enabled?: boolean | null
          created_at?: string
          id?: number
          meter_id: number
          meter_name?: string | null
          previous_reading?: number | null
          rate_at_reading?: number | null
          reading: number
          reading_date: string
        }
        Update: {
          backdating_enabled?: boolean | null
          created_at?: string
          id?: number
          meter_id?: number
          meter_name?: string | null
          previous_reading?: number | null
          rate_at_reading?: number | null
          reading?: number
          reading_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_unit: {
        Row: {
          amenities: Json | null
          base_rate: number
          capacity: number
          created_at: string
          floor_id: number
          id: number
          name: string
          number: number
          property_id: number
          rental_unit_status: Database["public"]["Enums"]["location_status"]
          type: string
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          base_rate: number
          capacity: number
          created_at?: string
          floor_id: number
          id?: number
          name: string
          number: number
          property_id: number
          rental_unit_status?: Database["public"]["Enums"]["location_status"]
          type: string
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          base_rate?: number
          capacity?: number
          created_at?: string
          floor_id?: number
          id?: number
          name?: string
          number?: number
          property_id?: number
          rental_unit_status?: Database["public"]["Enums"]["location_status"]
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_unit_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_unit_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      templates: {
        Row: {
          back_background: string | null
          created_at: string | null
          dpi: number | null
          front_background: string | null
          height_pixels: number | null
          id: string
          name: string
          org_id: string | null
          orientation: string | null
          template_elements: Json
          updated_at: string | null
          user_id: string | null
          width_pixels: number | null
        }
        Insert: {
          back_background?: string | null
          created_at?: string | null
          dpi?: number | null
          front_background?: string | null
          height_pixels?: number | null
          id?: string
          name: string
          org_id?: string | null
          orientation?: string | null
          template_elements: Json
          updated_at?: string | null
          user_id?: string | null
          width_pixels?: number | null
        }
        Update: {
          back_background?: string | null
          created_at?: string | null
          dpi?: number | null
          front_background?: string | null
          height_pixels?: number | null
          id?: string
          name?: string
          org_id?: string | null
          orientation?: string | null
          template_elements?: Json
          updated_at?: string | null
          user_id?: string | null
          width_pixels?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          auth_id: string | null
          birthday: string | null
          contact_number: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact: Json | null
          facebook_name: string | null
          id: number
          name: string
          profile_picture_url: string | null
          school_or_workplace: string | null
          tenant_status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auth_id?: string | null
          birthday?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: Json | null
          facebook_name?: string | null
          id?: number
          name: string
          profile_picture_url?: string | null
          school_or_workplace?: string | null
          tenant_status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auth_id?: string | null
          birthday?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: Json | null
          facebook_name?: string | null
          id?: number
          name?: string
          profile_picture_url?: string | null
          school_or_workplace?: string | null
          tenant_status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          processed_at: string
          provider: string
          raw_payload: Json
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          processed_at?: string
          provider?: string
          raw_payload: Json
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string
          provider?: string
          raw_payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      payment_summary_by_receiver: {
        Row: {
          receiver_email: string | null
          total_amount: number | null
          total_attendees: number | null
        }
        Relationships: []
      }
      public_events: {
        Row: {
          event_long_name: string | null
          event_name: string | null
          event_url: string | null
          id: string | null
          is_public: boolean | null
          org_id: string | null
          organization_name: string | null
          other_info: Json | null
          ticketing_data: Json[] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _determine_billing_status: {
        Args: {
          p_amount: number
          p_due_date: string
          p_paid_amount: number
          p_penalty_amount: number
        }
        Returns: Database["public"]["Enums"]["payment_status"]
      }
      archive_expired_attendees: {
        Args: { p_attendee_ids: string[] }
        Returns: {
          message: string
          success: boolean
          updated_count: number
        }[]
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_penalty: {
        Args: { p_billing_id: number }
        Returns: number
      }
      check_registration_status: {
        Args: { p_reference_code: string }
        Returns: Json
      }
      cleanup_expired_registrations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      confirm_attendee_payment: {
        Args:
          | { p_attendee_id: string }
          | { p_attendee_id: string; p_received_by: string }
        Returns: Json
      }
      create_payment: {
        Args: {
          p_amount: number
          p_billing_ids: number[]
          p_created_by?: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_notes?: string
          p_paid_at: string
          p_paid_by: string
          p_reference_number?: string
        }
        Returns: Json
      }
      create_security_deposit_payment: {
        Args: {
          p_amount: number
          p_billing_ids: number[]
          p_created_by?: string
          p_notes?: string
          p_paid_at: string
          p_paid_by: string
          p_reference_number?: string
        }
        Returns: Json
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      delete_lease_and_dependents: {
        Args: { p_lease_id: number }
        Returns: undefined
      }
      delete_property: {
        Args: { property_id: number }
        Returns: boolean
      }
      delete_property_v2: {
        Args: { property_id: number }
        Returns: boolean
      }
      delete_trigger_and_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      drop_all_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enable_all_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_effective_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_idcards_by_org: {
        Args: { org_id: string; page_limit?: number; page_offset?: number }
        Returns: Json
      }
      get_template_by_id: {
        Args: { p_template_id: string; p_user_id: string }
        Returns: {
          back_background: string | null
          created_at: string | null
          dpi: number | null
          front_background: string | null
          height_pixels: number | null
          id: string
          name: string
          org_id: string | null
          orientation: string | null
          template_elements: Json
          updated_at: string | null
          user_id: string | null
          width_pixels: number | null
        }[]
      }
      get_tenant_monthly_balances: {
        Args: { p_months_back: number; p_property_id: number }
        Returns: {
          balance: number
          month: string
          tenant_id: number
        }[]
      }
      get_tenant_payment_history: {
        Args: { p_tenant_id: number }
        Returns: {
          amount: number
          days_overdue: number
          due_date: string
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["billing_type"]
        }[]
      }
      get_user_role_type_oid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      insert_admin_audit: {
        Args: {
          p_action: string
          p_admin_id: string
          p_metadata?: Json
          p_org_id: string
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      is_admin_level: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff_level: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_penalties: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_attendee: {
        Args: {
          p_basic_info: Json
          p_event_id: string
          p_org_id: string
          p_qr_link: string
          p_reference_code: string
          p_ticket_info: Json
          p_ticket_type: string
        }
        Returns: Json
      }
      revert_payment: {
        Args: {
          p_payment_id: number
          p_performed_by?: string
          p_reason?: string
        }
        Returns: Json
      }
      rollback_payments: {
        Args: Record<PropertyKey, never>
        Returns: {
          billing_id: number
          old_amount: number
          old_balance: number
          old_status: Database["public"]["Enums"]["payment_status"]
          reset_success: boolean
        }[]
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      soft_delete_lease: {
        Args: { p_deleted_by: string; p_lease_id: number; p_reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_permission:
        | "properties.create"
        | "properties.read"
        | "properties.update"
        | "properties.delete"
        | "floors.create"
        | "floors.read"
        | "floors.update"
        | "floors.delete"
        | "rental_units.create"
        | "rental_units.read"
        | "rental_units.update"
        | "rental_units.delete"
        | "maintenance.create"
        | "maintenance.read"
        | "maintenance.update"
        | "maintenance.delete"
        | "expenses.create"
        | "expenses.read"
        | "expenses.update"
        | "expenses.delete"
        | "tenants.create"
        | "tenants.read"
        | "tenants.update"
        | "tenants.delete"
        | "leases.create"
        | "leases.read"
        | "leases.update"
        | "leases.delete"
        | "billings.create"
        | "billings.read"
        | "billings.update"
        | "billings.delete"
        | "payments.create"
        | "payments.read"
        | "payments.update"
        | "payments.delete"
        | "payment_schedules.manage"
        | "payment_schedules.read"
        | "penalties.configure"
        | "meters.create"
        | "meters.read"
        | "meters.update"
        | "meters.delete"
        | "readings.create"
        | "readings.read"
        | "readings.update"
        | "readings.delete"
        | "events.create"
        | "events.read"
        | "events.update"
        | "events.delete"
        | "attendees.create"
        | "attendees.read"
        | "attendees.update"
        | "attendees.delete"
        | "attendees.check_qr"
        | "templates.create"
        | "templates.read"
        | "templates.update"
        | "templates.delete"
        | "idcards.create"
        | "idcards.read"
        | "idcards.update"
        | "idcards.delete"
        | "organizations.create"
        | "organizations.read"
        | "organizations.update"
        | "organizations.delete"
        | "profiles.read"
        | "profiles.update"
        | "bookings.read"
        | "bookings.update"
        | "bookings.delete"
      app_role:
        | "super_admin"
        | "org_admin"
        | "user"
        | "event_admin"
        | "event_qr_checker"
        | "property_admin"
        | "property_user"
        | "id_gen_admin"
        | "id_gen_user"
      billing_type:
        | "RENT"
        | "UTILITY"
        | "PENALTY"
        | "MAINTENANCE"
        | "SERVICE"
        | "SECURITY_DEPOSIT"
      expense_status: "PENDING" | "APPROVED" | "REJECTED"
      expense_type: "OPERATIONAL" | "CAPITAL"
      floor_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
      lease_status:
        | "ACTIVE"
        | "INACTIVE"
        | "EXPIRED"
        | "TERMINATED"
        | "PENDING"
        | "ARCHIVED"
      lease_type: "BEDSPACER" | "PRIVATEROOM"
      location_status: "VACANT" | "OCCUPIED" | "RESERVED"
      maintenance_status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
      meter_location_type: "PROPERTY" | "FLOOR" | "RENTAL_UNIT"
      meter_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
      payment_frequency:
        | "MONTHLY"
        | "QUARTERLY"
        | "ANNUAL"
        | "CUSTOM"
        | "ONE_TIME"
      payment_method: "CASH" | "BANK" | "GCASH" | "OTHER" | "SECURITY_DEPOSIT"
      payment_status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "PENALIZED"
      property_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
      tenant_status: "ACTIVE" | "INACTIVE" | "PENDING" | "BLACKLISTED"
      unit_type: "BEDSPACER" | "PRIVATE_ROOM"
      user_role:
        | "super_admin"
        | "org_admin"
        | "user"
        | "event_admin"
        | "event_qr_checker"
        | "property_admin"
        | "property_manager"
        | "property_accountant"
        | "property_maintenance"
        | "property_utility"
        | "property_frontdesk"
        | "property_tenant"
        | "property_guest"
        | "id_gen_admin"
        | "id_gen_user"
      utility_type: "ELECTRICITY" | "WATER" | "INTERNET"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "properties.create",
        "properties.read",
        "properties.update",
        "properties.delete",
        "floors.create",
        "floors.read",
        "floors.update",
        "floors.delete",
        "rental_units.create",
        "rental_units.read",
        "rental_units.update",
        "rental_units.delete",
        "maintenance.create",
        "maintenance.read",
        "maintenance.update",
        "maintenance.delete",
        "expenses.create",
        "expenses.read",
        "expenses.update",
        "expenses.delete",
        "tenants.create",
        "tenants.read",
        "tenants.update",
        "tenants.delete",
        "leases.create",
        "leases.read",
        "leases.update",
        "leases.delete",
        "billings.create",
        "billings.read",
        "billings.update",
        "billings.delete",
        "payments.create",
        "payments.read",
        "payments.update",
        "payments.delete",
        "payment_schedules.manage",
        "payment_schedules.read",
        "penalties.configure",
        "meters.create",
        "meters.read",
        "meters.update",
        "meters.delete",
        "readings.create",
        "readings.read",
        "readings.update",
        "readings.delete",
        "events.create",
        "events.read",
        "events.update",
        "events.delete",
        "attendees.create",
        "attendees.read",
        "attendees.update",
        "attendees.delete",
        "attendees.check_qr",
        "templates.create",
        "templates.read",
        "templates.update",
        "templates.delete",
        "idcards.create",
        "idcards.read",
        "idcards.update",
        "idcards.delete",
        "organizations.create",
        "organizations.read",
        "organizations.update",
        "organizations.delete",
        "profiles.read",
        "profiles.update",
        "bookings.read",
        "bookings.update",
        "bookings.delete",
      ],
      app_role: [
        "super_admin",
        "org_admin",
        "user",
        "event_admin",
        "event_qr_checker",
        "property_admin",
        "property_user",
        "id_gen_admin",
        "id_gen_user",
      ],
      billing_type: [
        "RENT",
        "UTILITY",
        "PENALTY",
        "MAINTENANCE",
        "SERVICE",
        "SECURITY_DEPOSIT",
      ],
      expense_status: ["PENDING", "APPROVED", "REJECTED"],
      expense_type: ["OPERATIONAL", "CAPITAL"],
      floor_status: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
      lease_status: [
        "ACTIVE",
        "INACTIVE",
        "EXPIRED",
        "TERMINATED",
        "PENDING",
        "ARCHIVED",
      ],
      lease_type: ["BEDSPACER", "PRIVATEROOM"],
      location_status: ["VACANT", "OCCUPIED", "RESERVED"],
      maintenance_status: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      meter_location_type: ["PROPERTY", "FLOOR", "RENTAL_UNIT"],
      meter_status: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
      payment_frequency: [
        "MONTHLY",
        "QUARTERLY",
        "ANNUAL",
        "CUSTOM",
        "ONE_TIME",
      ],
      payment_method: ["CASH", "BANK", "GCASH", "OTHER", "SECURITY_DEPOSIT"],
      payment_status: ["PENDING", "PARTIAL", "PAID", "OVERDUE", "PENALIZED"],
      property_status: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
      tenant_status: ["ACTIVE", "INACTIVE", "PENDING", "BLACKLISTED"],
      unit_type: ["BEDSPACER", "PRIVATE_ROOM"],
      user_role: [
        "super_admin",
        "org_admin",
        "user",
        "event_admin",
        "event_qr_checker",
        "property_admin",
        "property_manager",
        "property_accountant",
        "property_maintenance",
        "property_utility",
        "property_frontdesk",
        "property_tenant",
        "property_guest",
        "id_gen_admin",
        "id_gen_user",
      ],
      utility_type: ["ELECTRICITY", "WATER", "INTERNET"],
    },
  },
} as const