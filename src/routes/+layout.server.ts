import type { LayoutServerLoadEvent } from './$types';
import { ADMIN_URL } from '$env/static/private';
import { RoleConfig } from '../rolePermissions';

type NavigationState = {
  homeUrl: string;
  showHeader: boolean;
  allowedPaths: string[];
  showRoleEmulation: boolean;
}

type EmulatedProfile = {
  isEmulated: boolean;
}

type RoleConfig = {
  [key: string]: {
    defaultRedirect: string;
  }
}

export const load = async ({ locals: { safeGetSession, profile }, url }: LayoutServerLoadEvent) => {
  const { session, user } = await safeGetSession();
  
  const response = new Response();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');

  const navigation: NavigationState = {
    homeUrl: '',
    showHeader: false,
    allowedPaths: ['/auth'],
    showRoleEmulation: false
  };

  if (session && user && profile) {
    // Set home URL based on role and emulation status
    const isEmulated = (profile as EmulatedProfile)?.isEmulated;
    if (isEmulated) {
      navigation.homeUrl = '/midcodes';
      navigation.showRoleEmulation = true;
    } else {
      navigation.homeUrl = RoleConfig[profile.role].defaultRedirect;
    }

    // Show nav for all authenticated users
    navigation.showHeader = !url.pathname.startsWith('/auth');
    navigation.allowedPaths = ['/templates', '/all-ids'];
  }

  return {
    session,
    user,
    profile,
    navigation
  };
};