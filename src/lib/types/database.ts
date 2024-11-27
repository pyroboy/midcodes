export interface Organization {
    id: string;  // UUID
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;  // UUID, matches auth.users.id
    role: 'super_admin' | 'org_admin' | 'user';
    org_id: string | null;  // UUID reference to organizations.id
    created_at: string;
    updated_at: string;
}

// Add this to your existing Database interface or create it if it doesn't exist
export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: Organization;
                Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Organization, 'id'>>;
            };
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id'>>;
            };
            // ... other tables
        };
    };
}
