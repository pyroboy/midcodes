

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.D0FC3nci.js","_app/immutable/chunks/disclose-version.D83qhv8K.js","_app/immutable/chunks/runtime.DLo6uQS5.js","_app/immutable/chunks/legacy.BcJfnSBO.js","_app/immutable/chunks/render.CZlMgkAb.js"];
export const stylesheets = [];
export const fonts = [];
