import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.BKIrC0S5.js","_app/immutable/chunks/disclose-version.B5GWarkr.js","_app/immutable/chunks/runtime.Dvs5Ud68.js","_app/immutable/chunks/if.wNEY2zMS.js","_app/immutable/chunks/attributes.BwTrt_xX.js","_app/immutable/chunks/index.BTGZjI-o.js","_app/immutable/chunks/this.Mvv0QzSo.js","_app/immutable/chunks/index-client.DrWtTyZV.js","_app/immutable/chunks/paths.9NbgWD2o.js"];
export const stylesheets = ["_app/immutable/assets/0.pRtJH-Ca.css"];
export const fonts = [];
