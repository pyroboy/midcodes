import { c as create_ssr_component, v as validate_component, e as escape } from "../../../../chunks/ssr.js";
import "../../../../chunks/client.js";
import "../../../../chunks/index2.js";
import { I as Input } from "../../../../chunks/input.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import { C as Card_description } from "../../../../chunks/card-description.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import { B as Button } from "../../../../chunks/button.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { form } = $$props;
  let isLoading = false;
  if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
  return `<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">${validate_component(Card, "Card").$$render($$result, { class: "w-full max-w-[450px] p-4" }, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, { class: "text-center" }, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, {}, {}, {
            default: () => {
              return `Forgot Password`;
            }
          })} ${validate_component(Card_description, "CardDescription").$$render($$result, {}, {}, {
            default: () => {
              return `Enter your email address and we&#39;ll send you a link to reset your password`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `<form method="POST" class="space-y-4"><div class="space-y-2">${validate_component(Input, "Input").$$render(
            $$result,
            {
              id: "email",
              name: "email",
              type: "email",
              placeholder: "Email",
              required: true,
              value: form?.email ?? ""
            },
            {},
            {}
          )}</div> ${form?.error && !form?.success ? `<p class="text-sm text-destructive">${escape(form.error)}</p>` : ``} ${form?.success ? `<p class="text-sm text-green-600">${escape(form.message)}</p>` : ``} ${validate_component(Button, "Button").$$render(
            $$result,
            {
              type: "submit",
              class: "w-full",
              disabled: isLoading
            },
            {},
            {
              default: () => {
                return `${`Send Reset Link`}`;
              }
            }
          )} <div class="text-center" data-svelte-h="svelte-1qv2sls"><a href="/auth" class="text-sm text-muted-foreground hover:text-primary">Back to Sign In</a></div></form>`;
        }
      })}`;
    }
  })}</div>`;
});
export {
  Page as default
};
