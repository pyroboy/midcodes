import * as universal from '../entries/pages/_layout.ts.js';
import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.D0KU8Lma.js","_app/immutable/chunks/supabaseClient.1oeZSPjs.js","_app/immutable/chunks/_commonjsHelpers.BosuxZz1.js","_app/immutable/chunks/36.jKjWACjA.js","_app/immutable/chunks/public.BiNjus4Z.js","_app/immutable/chunks/scheduler.Bl--k1HL.js","_app/immutable/chunks/index.DR8de1tj.js","_app/immutable/chunks/each.En5UpT5R.js","_app/immutable/chunks/stores.Cq8_Q5sV.js","_app/immutable/chunks/entry.B5jMEGBp.js","_app/immutable/chunks/index.CtH2YV38.js","_app/immutable/chunks/progress.rgsM-zn2.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/utils.D33FkIxg.js","_app/immutable/chunks/updater.OXwryOUo.js","_app/immutable/chunks/attrs.B9zgB7jn.js","_app/immutable/chunks/index.D4E8IgGl.js","_app/immutable/chunks/index.CjIr0BUl.js","_app/immutable/chunks/typeahead.D5WM79ox.js","_app/immutable/chunks/array.BdJ5qWx2.js","_app/immutable/chunks/helpers.CIlnAZ6Z.js","_app/immutable/chunks/focus.ClnM2FxW.js","_app/immutable/chunks/events.InG5F_rQ.js","_app/immutable/chunks/auth.Curs6txW.js","_app/immutable/chunks/fonts.7XzQP8PC.js","_app/immutable/chunks/button.BqeWxtk_.js","_app/immutable/chunks/Icon.X1g8dxaz.js","_app/immutable/chunks/x.CfuoG80Q.js"];
export const stylesheets = ["_app/immutable/assets/0.CpogDyrn.css"];
export const fonts = [];
