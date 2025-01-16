export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["app.css","favicon.png"]),
	mimeTypes: {".css":"text/css",".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.C1laR7TC.js","app":"_app/immutable/entry/app.B4VYKyqq.js","imports":["_app/immutable/entry/start.C1laR7TC.js","_app/immutable/chunks/entry.Uc0ZAp3f.js","_app/immutable/chunks/runtime.DLo6uQS5.js","_app/immutable/chunks/paths.COcRFZjt.js","_app/immutable/chunks/index-client.BSGpTFrV.js","_app/immutable/entry/app.B4VYKyqq.js","_app/immutable/chunks/runtime.DLo6uQS5.js","_app/immutable/chunks/render.CZlMgkAb.js","_app/immutable/chunks/disclose-version.D83qhv8K.js","_app/immutable/chunks/index-client.BSGpTFrV.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
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
