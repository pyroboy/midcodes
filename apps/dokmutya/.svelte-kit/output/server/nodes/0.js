import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.DKM09pDX.js","_app/immutable/chunks/disclose-version.D83qhv8K.js","_app/immutable/chunks/runtime.DLo6uQS5.js","_app/immutable/chunks/paths.COcRFZjt.js"];
export const stylesheets = ["_app/immutable/assets/0.DqLWg1Rq.css"];
export const fonts = [];
