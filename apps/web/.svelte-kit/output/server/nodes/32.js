import * as server from '../entries/pages/events/_event_url_/test/_page.server.ts.js';

export const index = 32;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/events/_event_url_/test/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/events/[event_url]/test/+page.server.ts";
export const imports = ["_app/immutable/nodes/32.oU9YWM1_.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js"];
export const stylesheets = [];
export const fonts = [];
