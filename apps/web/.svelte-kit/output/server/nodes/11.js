import * as server from '../entries/pages/dorm/_page.server.ts.js';

export const index = 11;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/+page.server.ts";
export const imports = ["_app/immutable/nodes/11.Bf__z8UP.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/index.DR8de1tj.js","_app/immutable/chunks/each.En5UpT5R.js","_app/immutable/chunks/roleConfig.DlmfXarb.js","_app/immutable/chunks/card.Di3vQaZg.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/utils.D33FkIxg.js","_app/immutable/chunks/index.CtH2YV38.js","_app/immutable/chunks/card-title.DkwblUMR.js","_app/immutable/chunks/stores.Cq8_Q5sV.js","_app/immutable/chunks/entry.B5jMEGBp.js"];
export const stylesheets = [];
export const fonts = [];
