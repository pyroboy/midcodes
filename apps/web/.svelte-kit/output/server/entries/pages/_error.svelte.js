import { c as create_ssr_component, s as subscribe, e as escape } from "../../chunks/ssr.js";
import { p as page } from "../../chunks/stores.js";
import "../../chunks/client.js";
const Error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_page();
  return `  ${$page.status === 401 ? `<div class="flex items-center justify-center min-h-screen" data-svelte-h="svelte-1vdt8w9"><div class="text-center"><h1 class="text-2xl font-bold mb-4">Unauthorized Access</h1> <p class="mb-4">Please log in to access this page.</p> <p>Redirecting to login page...</p></div></div>` : `<div class="flex items-center justify-center min-h-screen"><div class="text-center"><h1 class="text-2xl font-bold mb-4">Error ${escape($page.status)}</h1> <p class="mb-4">${escape($page.error?.message || "An error occurred")}</p></div></div>`}`;
});
export {
  Error as default
};
