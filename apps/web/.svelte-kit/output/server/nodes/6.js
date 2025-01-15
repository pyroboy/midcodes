import * as server from '../entries/pages/auth/forgot-password/_page.server.ts.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/auth/forgot-password/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/auth/forgot-password/+page.server.ts";
export const imports = ["_app/immutable/nodes/6.BSAdifip.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js","_app/immutable/chunks/forms.DqzkT_8L.js","_app/immutable/chunks/entry.CPepBop_.js","_app/immutable/chunks/index.C9tjxovB.js","_app/immutable/chunks/index.D5P3bu3G.js","_app/immutable/chunks/index.scr5bG6o.js","_app/immutable/chunks/utils.DSScpxlp.js","_app/immutable/chunks/input.CuGHtir4.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/card.VXLJCglc.js","_app/immutable/chunks/card-content.BcXlgrz8.js","_app/immutable/chunks/card-description.5Vnb1SMn.js","_app/immutable/chunks/card-title.BtGlweLB.js","_app/immutable/chunks/button.UQtnxgui.js","_app/immutable/chunks/loader-circle.B-ao0uyb.js","_app/immutable/chunks/Icon.DbxfvhXQ.js","_app/immutable/chunks/each.DIkwcrxx.js"];
export const stylesheets = [];
export const fonts = [];
