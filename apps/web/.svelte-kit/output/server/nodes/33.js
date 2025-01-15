import * as server from '../entries/pages/id-gen/_page.server.ts.js';

export const index = 33;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/id-gen/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/id-gen/+page.server.ts";
export const imports = ["_app/immutable/nodes/33.CwhFiIvW.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/each.DIkwcrxx.js","_app/immutable/chunks/index.ZL6-Qda4.js","_app/immutable/chunks/roleConfig.DlmfXarb.js"];
export const stylesheets = ["_app/immutable/assets/33.D3qDaN8H.css"];
export const fonts = [];
