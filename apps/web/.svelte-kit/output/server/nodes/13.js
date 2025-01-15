import * as server from '../entries/pages/dorm/budgets/_page.server.ts.js';

export const index = 13;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/budgets/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/budgets/+page.server.ts";
export const imports = ["_app/immutable/nodes/13.DupJ5gWk.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js"];
export const stylesheets = [];
export const fonts = [];
