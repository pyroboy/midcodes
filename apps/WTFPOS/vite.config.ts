import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';

/** Vite plugin that detects new LAN devices at the TCP socket level */
function connectionLogger(): Plugin {
	const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
	const seenIPs = new Set<string>();

	return {
		name: 'wtfpos-connection-logger',
		configureServer(server) {
			// Detect new LAN clients at the raw TCP level
			if (server.httpServer) {
				server.httpServer.on('connection', (socket) => {
					const ip = socket.remoteAddress || '';
					const clean = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
					if (LOOPBACK.has(ip) || LOOPBACK.has(clean)) return;
					if (seenIPs.has(clean)) return;
					seenIPs.add(clean);
					console.log(`[LAN] 🔌 New device socket: ${clean}`);
				});
			}
		}
	};
}

export default defineConfig({
	plugins: [connectionLogger(), basicSsl(), sveltekit()],
	define: {
		__BUILD_DATE__: JSON.stringify(new Date().toISOString()),
		__BUILD_MODE__: JSON.stringify(process.env.NODE_ENV ?? 'development'),
		'process.env': {},
		'process': { env: {} }
	},
	server: {
		host: '0.0.0.0', // expose on LAN for tablet access
		port: 5173,
		allowedHosts: true
	},
	preview: {
		allowedHosts: true
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		alias: {
			'$lib': new URL('./src/lib', import.meta.url).pathname
		}
	}
});
