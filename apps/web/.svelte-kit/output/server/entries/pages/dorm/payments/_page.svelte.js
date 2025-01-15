import { c as create_ssr_component, v as validate_component, b as each, e as escape } from "../../../../chunks/ssr.js";
import "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "memoize-weak";
import "zod-to-json-schema";
import { B as Button } from "../../../../chunks/button.js";
import "clsx";
import "dequal";
import "../../../../chunks/create.js";
import { B as Badge } from "../../../../chunks/index9.js";
import "../../../../chunks/formSchema6.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import { C as Card_description } from "../../../../chunks/card-description.js";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
function getStatusVariant(status) {
  switch (status) {
    case "PAID":
      return "default";
    case "PENDING":
      return "secondary";
    case "PARTIAL":
      return "outline";
    case "OVERDUE":
      return "destructive";
    default:
      return "outline";
  }
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<div class="space-y-4">${`<div class="flex justify-between items-center"><h1 class="text-2xl font-bold" data-svelte-h="svelte-1n3kx7h">Payments</h1> ${data.isAdminLevel || data.isAccountant || data.isFrontdesk || data.isResident ? `${validate_component(Button, "Button").$$render($$result, {}, {}, {
    default: () => {
      return `Create Payment`;
    }
  })}` : ``}</div> ${data.payments ? `<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">${each(data.payments, (payment) => {
    return `${validate_component(Card, "Card.Root").$$render($$result, { class: "cursor-pointer" }, {}, {
      default: () => {
        return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Card_title, "Card.Title").$$render(
              $$result,
              {
                class: "flex justify-between items-center"
              },
              {},
              {
                default: () => {
                  return `${escape(payment.billing?.lease?.name ?? "Unknown")} ${validate_component(Badge, "Badge").$$render(
                    $$result,
                    {
                      variant: getStatusVariant(payment.billing?.status)
                    },
                    {},
                    {
                      default: () => {
                        return `${escape(payment.billing?.status)} `;
                      }
                    }
                  )} `;
                }
              }
            )} ${validate_component(Card_description, "Card.Description").$$render($$result, {}, {}, {
              default: () => {
                return `${escape(payment.billing?.type)} ${payment.billing?.utility_type ? `- ${escape(payment.billing.utility_type)}` : ``} `;
              }
            })} `;
          }
        })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
          default: () => {
            return `<div class="space-y-2"><div class="flex justify-between"><span class="text-muted-foreground" data-svelte-h="svelte-zt38xe">Amount:</span> <span class="font-medium">$${escape(payment.amount)}</span></div> <div class="flex justify-between"><span class="text-muted-foreground" data-svelte-h="svelte-7c89cj">Method:</span> <span class="font-medium">${escape(payment.method)}</span></div> <div class="flex justify-between"><span class="text-muted-foreground" data-svelte-h="svelte-18ak01e">Date:</span> <span class="font-medium">${escape(new Date(payment.paid_at).toLocaleDateString())} </span></div> ${payment.billing?.rental_unit ? `<div class="flex justify-between"><span class="text-muted-foreground" data-svelte-h="svelte-1ozu0dp">Rental_unit:</span> <span class="font-medium">${escape(payment.billing.rental_unit.rental_unit_number)} ${payment.billing.rental_unit.floor ? `- Floor ${escape(payment.billing.rental_unit.floor.floor_number)} ${payment.billing.rental_unit.floor.wing ? `Wing ${escape(payment.billing.rental_unit.floor.wing)}` : ``}` : ``}</span> </div>` : ``}</div> `;
          }
        })} `;
      }
    })}`;
  })}</div>` : `<div class="text-center py-8 text-muted-foreground" data-svelte-h="svelte-12nr9ed">No payments found</div>`}`}</div> ${!data.isAdminLevel && !data.isAccountant && !data.isFrontdesk && !data.isResident ? `<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-svelte-h="svelte-dzu69c"><p class="text-yellow-800">You are viewing this page in read-only mode. Contact an administrator if you need to make changes.</p></div>` : ``}`;
});
export {
  Page as default
};
