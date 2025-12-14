import type { Session, User } from '@supabase/supabase-js';

export interface UserJWTPayload {
	// Updated to match Supabase's actual structure
	user_roles?: string[]; // Legacy/Custom
	app_metadata: {
		provider?: string;
		providers?: string[];
		role?: string;
		roles?: string[];
		role_emulation?: {
			active: boolean;
			expires_at?: string;
			session_id?: string;
			emulated_role?: string;
			original_role?: string;
			emulated_org_id?: string;
		};
		[key: string]: any;
	};
}

export interface GetSessionResult {
	session: Session | null;
	error: Error | null;
	user: User | null;
	org_id: string | null;
	permissions?: string[];
	decodedToken?: UserJWTPayload | null;
}
