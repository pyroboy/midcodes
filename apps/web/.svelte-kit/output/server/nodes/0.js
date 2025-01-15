import * as universal from '../entries/pages/_layout.ts.js';
import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.B-PhPudo.js","_app/immutable/chunks/supabaseClient.1oeZSPjs.js","_app/immutable/chunks/_commonjsHelpers.BosuxZz1.js","_app/immutable/chunks/36.jKjWACjA.js","_app/immutable/chunks/public.BiNjus4Z.js","_app/immutable/chunks/scheduler.O3yElrGi.js","_app/immutable/chunks/index.ZL6-Qda4.js","_app/immutable/chunks/each.DIkwcrxx.js","_app/immutable/chunks/stores.COJDcE9o.js","_app/immutable/chunks/entry.CPepBop_.js","_app/immutable/chunks/index.C9tjxovB.js","_app/immutable/chunks/progress.Di6vMoO1.js","_app/immutable/chunks/spread.CgU5AtxT.js","_app/immutable/chunks/utils.DSScpxlp.js","_app/immutable/chunks/updater.CFVgRrpw.js","_app/immutable/chunks/attrs.B9zgB7jn.js","_app/immutable/chunks/index.D5P3bu3G.js","_app/immutable/chunks/index.scr5bG6o.js","_app/immutable/chunks/typeahead.BXZeH0TS.js","_app/immutable/chunks/array.DDZSQHHD.js","_app/immutable/chunks/helpers.xm3Hvi3u.js","_app/immutable/chunks/focus.BetWQ8EM.js","_app/immutable/chunks/events.DabAiKSe.js","_app/immutable/chunks/auth.CboM_Y4m.js","_app/immutable/chunks/fonts.7XzQP8PC.js","_app/immutable/chunks/button.UQtnxgui.js","_app/immutable/chunks/Icon.DbxfvhXQ.js","_app/immutable/chunks/x.z9h3ATJ7.js"];
export const stylesheets = ["_app/immutable/assets/0.CpogDyrn.css"];
export const fonts = [];
