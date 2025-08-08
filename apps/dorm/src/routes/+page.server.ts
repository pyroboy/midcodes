// Disable ISR on auth-guarded root to avoid unexpected cache/redirect behavior on Vercel
export const config = { runtime: 'nodejs20.x' };
