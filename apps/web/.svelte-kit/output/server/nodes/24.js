import * as server from '../entries/pages/dorm/transactions/_page.server.ts.js';

export const index = 24;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dorm/transactions/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dorm/transactions/+page.server.ts";
export const imports = ["_app/immutable/nodes/24.NvbgY7vf.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js","_app/immutable/chunks/each.DIkwcrxx.js","_app/immutable/chunks/utils.DSScpxlp.js","_app/immutable/chunks/index.C9tjxovB.js","_app/immutable/chunks/input.CuGHtir4.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/label.nGZ3SWbE.js","_app/immutable/chunks/create.Ba7rV8ab.js","_app/immutable/chunks/attrs.B9zgB7jn.js","_app/immutable/chunks/events.DabAiKSe.js","_app/immutable/chunks/index.D5P3bu3G.js","_app/immutable/chunks/index.scr5bG6o.js","_app/immutable/chunks/formData.Cqbx9YEq.js","_app/immutable/chunks/stores.COJDcE9o.js","_app/immutable/chunks/entry.CPepBop_.js","_app/immutable/chunks/forms.DqzkT_8L.js","_app/immutable/chunks/index.D4CdqmV7.js"];
export const stylesheets = [];
export const fonts = [];
