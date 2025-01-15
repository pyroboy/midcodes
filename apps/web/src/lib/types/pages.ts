import type { User } from '@supabase/supabase-js';
import type { ServerProfile, SessionWithAuth } from './auth';
import type { NavigationState } from './navigation';
import type { Emulation } from './roles';

export interface PageParentData {
  user: User | null;
  profile: ServerProfile | null;
  navigation: NavigationState;
  session: SessionWithAuth;
  emulation: Emulation;
  special_url: string | undefined;
}