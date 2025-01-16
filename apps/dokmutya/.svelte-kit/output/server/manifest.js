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
		client: {"start":"_app/immutable/entry/start.DmIzB2jZ.js","app":"_app/immutable/entry/app.Bpp7_zWL.js","imports":["_app/immutable/entry/start.DmIzB2jZ.js","_app/immutable/chunks/entry.xQLXoURG.js","_app/immutable/chunks/runtime.Dvs5Ud68.js","_app/immutable/chunks/paths.9NbgWD2o.js","_app/immutable/chunks/index-client.DrWtTyZV.js","_app/immutable/entry/app.Bpp7_zWL.js","_app/immutable/chunks/runtime.Dvs5Ud68.js","_app/immutable/chunks/disclose-version.B5GWarkr.js","_app/immutable/chunks/if.wNEY2zMS.js","_app/immutable/chunks/this.Mvv0QzSo.js","_app/immutable/chunks/index-client.DrWtTyZV.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
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
