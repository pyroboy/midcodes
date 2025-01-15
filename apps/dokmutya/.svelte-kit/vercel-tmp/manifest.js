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
		client: {"start":"_app/immutable/entry/start.BNDhkV0L.js","app":"_app/immutable/entry/app.CvhIia5r.js","imports":["_app/immutable/entry/start.BNDhkV0L.js","_app/immutable/chunks/entry.Dw7epz9C.js","_app/immutable/chunks/scheduler.DiXKfncd.js","_app/immutable/entry/app.CvhIia5r.js","_app/immutable/chunks/scheduler.DiXKfncd.js","_app/immutable/chunks/index.BgLdwERb.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js'))
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
