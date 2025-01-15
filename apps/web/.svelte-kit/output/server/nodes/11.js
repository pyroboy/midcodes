import * as server from '../entries/pages/dorm/_page.server.ts.js';

export const index = 11;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/+page.server.ts";
export const imports = ["_app/immutable/nodes/11.CsuQavdn.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js","_app/immutable/chunks/each.DIkwcrxx.js","_app/immutable/chunks/roleConfig.DlmfXarb.js","_app/immutable/chunks/card.VXLJCglc.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/utils.DSScpxlp.js","_app/immutable/chunks/index.C9tjxovB.js","_app/immutable/chunks/card-title.BtGlweLB.js","_app/immutable/chunks/stores.COJDcE9o.js","_app/immutable/chunks/entry.CPepBop_.js"];
export const stylesheets = [];
export const fonts = [];
