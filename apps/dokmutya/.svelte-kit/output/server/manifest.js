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
		client: {"start":"_app/immutable/entry/start.Dc674LZz.js","app":"_app/immutable/entry/app.Cavd-Rsj.js","imports":["_app/immutable/entry/start.Dc674LZz.js","_app/immutable/chunks/entry.Bli-VXNU.js","_app/immutable/chunks/runtime.EYMxEfHR.js","_app/immutable/chunks/paths.CiDYiR5a.js","_app/immutable/chunks/index-client.d30sTLeJ.js","_app/immutable/entry/app.Cavd-Rsj.js","_app/immutable/chunks/runtime.EYMxEfHR.js","_app/immutable/chunks/render.BgczM795.js","_app/immutable/chunks/disclose-version.BThiBzYQ.js","_app/immutable/chunks/if.DF2-4gcI.js","_app/immutable/chunks/this.C5p-Zx2L.js","_app/immutable/chunks/index-client.d30sTLeJ.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
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
