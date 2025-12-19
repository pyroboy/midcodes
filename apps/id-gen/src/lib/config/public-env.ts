import { env as publicEnv } from '$env/dynamic/public';
import { dev } from '$app/environment';

/**
 * Public configuration safe for client-side use.
 */
export const publicConfig = {
    app: {
        url: publicEnv.PUBLIC_APP_URL || (dev ? 'http://localhost:5173' : ''),
        environment: dev ? 'development' : 'production'
    }
} as const;
