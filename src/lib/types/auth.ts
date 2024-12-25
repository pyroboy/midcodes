import type { Session as SupabaseSession } from '@supabase/supabase-js';
import type { UserRole } from '../auth/roleConfig';

export interface SessionWithAuth extends SupabaseSession {
  roleEmulation?: RoleEmulationInfo;
  session: SessionInfo | null;
  profile: ServerProfile | null;
  error: Error | null;
}

export interface RoleEmulationInfo {
  active: boolean;
  original_role: UserRole;
  emulated_role: UserRole;
  original_org_id: string | null;
  emulated_org_id: string | null;
  expires_at: string;
  session_id: string;
  organizationName: string | null;
}

export interface ServerProfile {
  id: string;
  email: string;
  role: UserRole;
  org_id: string | null;
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
  isEmulated: boolean;
  originalRole: UserRole;
  originalOrgId: string | null;
}

export interface SessionInfo {
  roleEmulation?: {
    active: boolean;
    emulated_org_id: string | null;
  } | null;
}