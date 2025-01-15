import * as server from '../entries/pages/dorm/overview/monthly/_page.server.ts.js';

export const index = 18;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/overview/monthly/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/overview/monthly/+page.server.ts";
export const imports = ["_app/immutable/nodes/18.B7DeizmZ.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js","_app/immutable/chunks/each.DIkwcrxx.js","_app/immutable/chunks/card.VXLJCglc.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/utils.DSScpxlp.js","_app/immutable/chunks/index.C9tjxovB.js","_app/immutable/chunks/card-content.BcXlgrz8.js","_app/immutable/chunks/card-title.BtGlweLB.js","_app/immutable/chunks/table-row._jvj8VnP.js","_app/immutable/chunks/index.BzLgNpIl.js","_app/immutable/chunks/index.scr5bG6o.js","_app/immutable/chunks/index.DJDgGeg3.js","_app/immutable/chunks/array.DDZSQHHD.js","_app/immutable/chunks/updater.CFVgRrpw.js","_app/immutable/chunks/attrs.B9zgB7jn.js","_app/immutable/chunks/events.DabAiKSe.js"];
export const stylesheets = [];
export const fonts = [];
