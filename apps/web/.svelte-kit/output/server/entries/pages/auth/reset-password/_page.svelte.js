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
              return `Reset Password`;
            }
          })} ${validate_component(Card_description, "CardDescription").$$render($$result, {}, {}, {
            default: () => {
              return `Enter your new password below`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `<form method="POST" class="space-y-4"><div class="space-y-2">${validate_component(Input, "Input").$$render(
            $$result,
            {
              id: "password",
              name: "password",
              type: "password",
              placeholder: "New Password",
              required: true
            },
            {},
            {}
          )}</div> ${form?.error ? `<p class="text-sm text-destructive">${escape(form.error)}</p>` : ``} ${validate_component(Button, "Button").$$render(
            $$result,
            {
              type: "submit",
              class: "w-full",
              disabled: isLoading
            },
            {},
            {
              default: () => {
                return `${`Update Password`}`;
              }
            }
          )}</form>`;
        }
      })}`;
    }
  })}</div>`;
});
export {
  Page as default
};
