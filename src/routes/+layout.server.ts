import type { LayoutServerLoadEvent } from './$types';
import { ADMIN_URL } from '$env/static/private';

type NavigationState = {
  homeUrl: string;
  showHeader: boolean;
  allowedPaths: string[];
}

export const load = async ({ locals: { safeGetSession, profile }, url }: LayoutServerLoadEvent) => {
  const { session, user } = await safeGetSession();
  
  const response = new Response();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');

  const navigation: NavigationState = {
    homeUrl: '/auth',
    showHeader: false,
    allowedPaths: ['/auth']
  };

  if (session && user && profile) {
    navigation.homeUrl = profile.role === 'super_admin' ? `/${ADMIN_URL}` : '/templates';
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