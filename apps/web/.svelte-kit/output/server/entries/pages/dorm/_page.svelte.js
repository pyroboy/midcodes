import { c as create_ssr_component, s as subscribe, e as escape, b as each, v as validate_component, a as add_attribute } from "../../../chunks/ssr.js";
import { R as RoleConfig } from "../../../chunks/roleConfig.js";
import { C as Card } from "../../../chunks/card.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../chunks/card-title.js";
import "dequal";
import "../../../chunks/create.js";
import { p as page } from "../../../chunks/stores.js";
import "../../../chunks/client.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let currentPath;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { data } = $$props;
  const role = data.profile?.role || "property_admin";
  const roleConfig = RoleConfig[role];
  const allowedPaths = roleConfig.allowedPaths.filter((path) => path.path.startsWith("/dorm/") && path.showInNav).sort((a, b) => (a.label || "").localeCompare(b.label || ""));
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  currentPath = $page.url.pathname;
  currentPath.split("/")[2] || "overview";
  $$unsubscribe_page();
  return `<div class="container mx-auto px-4 py-8"> <div class="card-content bg-white rounded-lg shadow-md p-6 mb-8"><h1 class="text-3xl font-bold mb-2" data-svelte-h="svelte-1qx4hld">Welcome to Dorm Management</h1> <p class="text-gray-600">Role: ${escape(roleConfig.label)}</p></div>  ${allowedPaths.length > 0 ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${each(allowedPaths, (item) => {
    return `${validate_component(Card, "Card.Root").$$render(
      $$result,
      {
        class: "hover:bg-accent transition-colors"
      },
      {},
      {
        default: () => {
          return `<a${add_attribute("href", item.path, 0)} class="block">${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
                default: () => {
                  return `${escape(item.label)}`;
                }
              })} `;
            }
          })}</a> `;
        }
      }
    )}`;
  })}</div>` : ``}</div>`;
});
export {
  Page as default
};
