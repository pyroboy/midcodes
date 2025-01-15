import { c as create_ssr_component, e as escape } from "../../../../../chunks/ssr.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<div class="p-4"><h1 class="text-2xl font-bold mb-4" data-svelte-h="svelte-8lyc9t">Test Route</h1> <div class="bg-white shadow rounded-lg p-6 mb-4"><h2 class="text-xl font-semibold mb-2" data-svelte-h="svelte-ur5h60">Event Information</h2> <pre class="bg-gray-100 p-4 rounded overflow-auto">            ${escape(JSON.stringify(data.event, null, 2))}
        </pre></div> <div class="bg-white shadow rounded-lg p-6"><h2 class="text-xl font-semibold mb-2" data-svelte-h="svelte-mydbon">Debug Information</h2> <pre class="bg-gray-100 p-4 rounded overflow-auto">            ${escape(JSON.stringify(data.debug, null, 2))}
        </pre></div></div>`;
});
export {
  Page as default
};
