import * as server from '../entries/pages/id-gen/_page.server.ts.js';

export const index = 33;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/id-gen/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/id-gen/+page.server.ts";
export const imports = ["_app/immutable/nodes/33.B0VocxYF.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/each.En5UpT5R.js","_app/immutable/chunks/index.DR8de1tj.js","_app/immutable/chunks/roleConfig.DlmfXarb.js"];
export const stylesheets = ["_app/immutable/assets/33.D3qDaN8H.css"];
export const fonts = [];
