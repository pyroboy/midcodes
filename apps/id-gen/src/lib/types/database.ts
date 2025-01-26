export interface Database {
  public: {
    Tables: {
      templates: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          description: string | null;
          org_id: string;
          front_background: string;
          back_background: string;
          front_background_url: string | null;
          back_background_url: string | null;
          orientation: 'landscape' | 'portrait';
          template_elements: any[];
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          description?: string | null;
          org_id: string;
          front_background: string;
          back_background: string;
          front_background_url?: string | null;
          back_background_url?: string | null;
          orientation: 'landscape' | 'portrait';
          template_elements: any[];
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          org_id?: string;
          front_background?: string;
          back_background?: string;
          front_background_url?: string | null;
          back_background_url?: string | null;
          orientation?: 'landscape' | 'portrait';
          template_elements?: any[];
          updated_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          org_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          org_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          org_id?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
