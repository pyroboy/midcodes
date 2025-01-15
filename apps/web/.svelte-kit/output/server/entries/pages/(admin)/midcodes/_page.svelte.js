import { c as create_ssr_component } from "../../../../chunks/ssr.js";
import "../../../../chunks/client.js";
import "../../../../chunks/index2.js";
import "dequal";
import "../../../../chunks/create.js";
import "clsx";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${`<div class="loading-spinner" data-svelte-h="svelte-1s6yopp">Loading midcodes dashboard...</div>`}`;
  } while (!$$settled);
  return $$rendered;
});
export {
  Page as default
};
