import * as server from '../entries/pages/dorm/readings/_page.server.ts.js';

export const index = 21;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/readings/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/readings/+page.server.ts";
export const imports = ["_app/immutable/nodes/21.CmqUnCBi.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/index.DR8de1tj.js","_app/immutable/chunks/each.En5UpT5R.js","_app/immutable/chunks/formData.IVesd0ZS.js","_app/immutable/chunks/index.CtH2YV38.js","_app/immutable/chunks/stores.Cq8_Q5sV.js","_app/immutable/chunks/entry.B5jMEGBp.js","_app/immutable/chunks/forms.BAKYq1CP.js","_app/immutable/chunks/index.D4CdqmV7.js","_app/immutable/chunks/index.BkiOxIzK.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/utils.D33FkIxg.js","_app/immutable/chunks/events.InG5F_rQ.js","_app/immutable/chunks/check.C8hdgrCp.js","_app/immutable/chunks/Icon.X1g8dxaz.js","_app/immutable/chunks/index.NUNB5A5N.js","_app/immutable/chunks/array.BdJ5qWx2.js","_app/immutable/chunks/typeahead.D5WM79ox.js","_app/immutable/chunks/helpers.CIlnAZ6Z.js","_app/immutable/chunks/updater.OXwryOUo.js","_app/immutable/chunks/create.D2Ln-72y.js","_app/immutable/chunks/attrs.B9zgB7jn.js","_app/immutable/chunks/index.D4E8IgGl.js","_app/immutable/chunks/index.CjIr0BUl.js","_app/immutable/chunks/input.CkoDOh7A.js","_app/immutable/chunks/label.BX-RGDB2.js","_app/immutable/chunks/progress.rgsM-zn2.js","_app/immutable/chunks/Toaster.svelte_svelte_type_style_lang.Rgr6G_b5.js","_app/immutable/chunks/Toaster.ClvMR0yn.js","_app/immutable/chunks/button.BqeWxtk_.js"];
export const stylesheets = ["_app/immutable/assets/Toaster.B9JcwM7w.css"];
export const fonts = [];
