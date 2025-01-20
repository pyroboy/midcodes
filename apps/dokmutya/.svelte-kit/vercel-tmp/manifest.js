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
		client: {"start":"_app/immutable/entry/start.C_tSL642.js","app":"_app/immutable/entry/app.CJiFcQZt.js","imports":["_app/immutable/entry/start.C_tSL642.js","_app/immutable/chunks/entry.Ds688rAF.js","_app/immutable/chunks/runtime.SUhmQRTV.js","_app/immutable/chunks/paths.bSai36zI.js","_app/immutable/chunks/index-client.MM9GxDro.js","_app/immutable/entry/app.CJiFcQZt.js","_app/immutable/chunks/runtime.SUhmQRTV.js","_app/immutable/chunks/disclose-version.Dwx91cSg.js","_app/immutable/chunks/if.CXCQr8F4.js","_app/immutable/chunks/this.CuSE4501.js","_app/immutable/chunks/index-client.MM9GxDro.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js'))
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
