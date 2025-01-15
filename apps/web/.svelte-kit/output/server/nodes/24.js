import * as server from '../entries/pages/dorm/transactions/_page.server.ts.js';

export const index = 24;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/transactions/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/transactions/+page.server.ts";
export const imports = ["_app/immutable/nodes/24.7vCEvqdC.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/index.DR8de1tj.js","_app/immutable/chunks/each.En5UpT5R.js","_app/immutable/chunks/utils.D33FkIxg.js","_app/immutable/chunks/index.CtH2YV38.js","_app/immutable/chunks/input.CkoDOh7A.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/label.BX-RGDB2.js","_app/immutable/chunks/create.D2Ln-72y.js","_app/immutable/chunks/attrs.B9zgB7jn.js","_app/immutable/chunks/events.InG5F_rQ.js","_app/immutable/chunks/index.D4E8IgGl.js","_app/immutable/chunks/index.CjIr0BUl.js","_app/immutable/chunks/formData.IVesd0ZS.js","_app/immutable/chunks/stores.Cq8_Q5sV.js","_app/immutable/chunks/entry.B5jMEGBp.js","_app/immutable/chunks/forms.BAKYq1CP.js","_app/immutable/chunks/index.D4CdqmV7.js"];
export const stylesheets = [];
export const fonts = [];
