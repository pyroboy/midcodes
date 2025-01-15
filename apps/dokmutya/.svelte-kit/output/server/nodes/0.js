

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.bZbAevmU.js","_app/immutable/chunks/scheduler.DiXKfncd.js","_app/immutable/chunks/index.BgLdwERb.js"];
export const stylesheets = ["_app/immutable/assets/0.X9l98EF2.css"];
export const fonts = [];
