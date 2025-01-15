import * as server from '../entries/pages/dorm/overview/monthly/_page.server.ts.js';

export const index = 18;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/overview/monthly/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/overview/monthly/+page.server.ts";
export const imports = ["_app/immutable/nodes/18.BCxNybf5.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/index.DR8de1tj.js","_app/immutable/chunks/each.En5UpT5R.js","_app/immutable/chunks/card.Di3vQaZg.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/utils.D33FkIxg.js","_app/immutable/chunks/index.CtH2YV38.js","_app/immutable/chunks/card-content.h6m9fR2F.js","_app/immutable/chunks/card-title.DkwblUMR.js","_app/immutable/chunks/table-row.rK6DUprU.js","_app/immutable/chunks/index.CvjD20Hh.js","_app/immutable/chunks/index.CjIr0BUl.js","_app/immutable/chunks/index.kFL1hNSt.js","_app/immutable/chunks/array.BdJ5qWx2.js","_app/immutable/chunks/updater.OXwryOUo.js","_app/immutable/chunks/attrs.B9zgB7jn.js","_app/immutable/chunks/events.InG5F_rQ.js"];
export const stylesheets = [];
export const fonts = [];
