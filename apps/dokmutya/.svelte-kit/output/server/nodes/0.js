import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.ygIi5FZz.js","_app/immutable/chunks/disclose-version.BThiBzYQ.js","_app/immutable/chunks/runtime.EYMxEfHR.js","_app/immutable/chunks/render.BgczM795.js","_app/immutable/chunks/if.DF2-4gcI.js","_app/immutable/chunks/attributes.DjcDhwSZ.js","_app/immutable/chunks/index.Bdq8wyyV.js","_app/immutable/chunks/this.C5p-Zx2L.js","_app/immutable/chunks/index-client.d30sTLeJ.js","_app/immutable/chunks/paths.CiDYiR5a.js"];
export const stylesheets = ["_app/immutable/assets/0.BVgE0a-k.css"];
export const fonts = [];
