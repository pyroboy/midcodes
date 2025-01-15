

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.DeDWuMsR.js","_app/immutable/chunks/scheduler.DiXKfncd.js","_app/immutable/chunks/index.BgLdwERb.js","_app/immutable/chunks/entry.Dw7epz9C.js"];
export const stylesheets = [];
export const fonts = [];
