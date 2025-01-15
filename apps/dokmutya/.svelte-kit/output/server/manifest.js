export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["app.css"]),
	mimeTypes: {".css":"text/css"},
	_: {
		client: {"start":"_app/immutable/entry/start.CP_65s5E.js","app":"_app/immutable/entry/app.BMHFY0c0.js","imports":["_app/immutable/entry/start.CP_65s5E.js","_app/immutable/chunks/entry.B_S4jhmL.js","_app/immutable/chunks/scheduler.DiXKfncd.js","_app/immutable/entry/app.BMHFY0c0.js","_app/immutable/chunks/scheduler.DiXKfncd.js","_app/immutable/chunks/index.BgLdwERb.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
