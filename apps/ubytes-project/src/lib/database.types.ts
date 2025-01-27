export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: number
          department_name: string
          department_logo: string | null
          created_at: string
          updated_at: string
          department_acronym: string
          mascot_name: string | null
          mascot_logo: string | null
        }
        Insert: {
          id?: number
          department_name: string
          department_logo?: string | null
          created_at?: string
          updated_at?: string
          department_acronym: string
          mascot_name?: string | null
          mascot_logo?: string | null
        }
        Update: {
          id?: number
          department_name?: string
          department_logo?: string | null
          created_at?: string
          updated_at?: string
          department_acronym?: string
          mascot_name?: string | null
          mascot_logo?: string | null
        }
      }
      event_department_link: {
        Row: {
          id: string
          event_id: string | null
          department_id: number | null
          rank: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          department_id?: number | null
          rank?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          department_id?: number | null
          rank?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          event_name: string
          medal_count: number | null
          updated_by: string | null
          updated_at: string
          created_at: string
          player_count: number | null
          event_status: string
          is_locked: boolean
          is_published: boolean
          locked_by: string | null
          locked_at: string | null
          published_by: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          event_name: string
          medal_count?: number | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
          player_count?: number | null
          event_status?: string
          is_locked?: boolean
          is_published?: boolean
          locked_by?: string | null
          locked_at?: string | null
          published_by?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          event_name?: string
          medal_count?: number | null
          updated_by?: string | null
          updated_at?: string
          created_at?: string
          player_count?: number | null
          event_status?: string
          is_locked?: boolean
          is_published?: boolean
          locked_by?: string | null
          locked_at?: string | null
          published_by?: string | null
          published_at?: string | null
        }
      }
      leaderboard: {
        Row: {
          id: number
          user_id: string | null
          event_id: number | null
          total_score: number
          rank: number
          updated_at: string
        }
        Insert: {
          id: number
          user_id?: string | null
          event_id?: number | null
          total_score: number
          rank: number
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          event_id?: number | null
          total_score?: number
          rank?: number
          updated_at?: string
        }
      }
      logging_activities: {
        Row: {
          id: number
          user_id: string | null
          activity: string
          created_at: string
          previous_data: Json | null
          new_data: Json | null
        }
        Insert: {
          id: number
          user_id?: string | null
          activity: string
          created_at?: string
          previous_data?: Json | null
          new_data?: Json | null
        }
        Update: {
          id?: number
          user_id?: string | null
          activity?: string
          created_at?: string
          previous_data?: Json | null
          new_data?: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          role: string
          department_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          role: string
          department_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          role?: string
          department_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      scores: {
        Row: {
          id: number
          user_id: string | null
          event_id: number | null
          score: number
          validation_status: string
          validated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: number
          user_id?: string | null
          event_id?: number | null
          score: number
          validation_status: string
          validated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          event_id?: number | null
          score?: number
          validation_status?: string
          validated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tabulation: {
        Row: {
          id: string
          event_id: string
          department_id: number
          rank: number
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          event_id: string
          department_id: number
          rank: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          department_id?: number
          rank?: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
      }
      users: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: string
          department_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          role: string
          department_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          role?: string
          department_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      activity_logs_view: {
        Row: {
          id: number | null
          user_id: string | null
          activity: string | null
          previous_data: Json | null
          new_data: Json | null
          created_at: string | null
          username: string | null
          role: string | null
        }
      }
      medal_tally_view: {
        Row: {
          department_id: number | null
          department_name: string | null
          gold_count: number | null
          silver_count: number | null
          bronze_count: number | null
          department_logo: string | null
        }
      }
      tabulations_view: {
        Row: {
          id: string | null
          event_id: string | null
          event_name: string | null
          medal_count: number | null
          player_count: number | null
          department_id: number | null
          department_name: string | null
          department_logo: string | null
          rank: number | null
          updated_at: string | null
          updated_by: string | null
          event_status: string | null
          is_locked: boolean | null
          is_published: boolean | null
          locked_by: string | null
          locked_at: string | null
          published_by: string | null
          published_at: string | null
          updated_by_username: string | null
          locked_by_username: string | null
          published_by_username: string | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}