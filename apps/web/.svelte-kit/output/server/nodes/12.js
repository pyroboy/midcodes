import * as server from '../entries/pages/dorm/accounts/_page.server.ts.js';

export const index = 12;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/accounts/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/accounts/+page.server.ts";
export const imports = ["_app/immutable/nodes/12.C5xsWkjD.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js","_app/immutable/chunks/each.DIkwcrxx.js","_app/immutable/chunks/formData.Cqbx9YEq.js","_app/immutable/chunks/index.C9tjxovB.js","_app/immutable/chunks/stores.COJDcE9o.js","_app/immutable/chunks/entry.CPepBop_.js","_app/immutable/chunks/forms.DqzkT_8L.js","_app/immutable/chunks/SuperDebug.BSipUZAZ.js","_app/immutable/chunks/index.D5P3bu3G.js","_app/immutable/chunks/index.scr5bG6o.js","_app/immutable/chunks/utils.DSScpxlp.js","_app/immutable/chunks/input.CuGHtir4.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/index.D4CdqmV7.js","_app/immutable/chunks/string.DBeRn4Bt.js","_app/immutable/chunks/zod.Cm6Z4om1.js","_app/immutable/chunks/_commonjsHelpers.BosuxZz1.js","_app/immutable/chunks/button.UQtnxgui.js"];
export const stylesheets = [];
export const fonts = [];
