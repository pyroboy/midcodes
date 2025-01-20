import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.CIbwOwX9.js","_app/immutable/chunks/disclose-version.Dwx91cSg.js","_app/immutable/chunks/runtime.SUhmQRTV.js","_app/immutable/chunks/if.CXCQr8F4.js","_app/immutable/chunks/attributes.BcxJE56g.js","_app/immutable/chunks/index.ErnaTn-K.js","_app/immutable/chunks/this.CuSE4501.js","_app/immutable/chunks/index-client.MM9GxDro.js","_app/immutable/chunks/paths.bSai36zI.js"];
export const stylesheets = ["_app/immutable/assets/0.Dv7tkJDR.css"];
export const fonts = [];
