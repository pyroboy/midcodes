import { c as create_ssr_component, v as validate_component, e as escape } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
import "../../../chunks/index2.js";
import { I as Input } from "../../../chunks/input.js";
import { C as Card } from "../../../chunks/card.js";
import { C as Card_content } from "../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../chunks/card-title.js";
import { R as Root, T as Tabs_content } from "../../../chunks/index3.js";
import { B as Button } from "../../../chunks/button.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { form } = $$props;
  let isLoading = false;
  if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
  return `<div class="min-h-screen w-full bg-background px-4 py-8 sm:px-6 lg:px-8"><div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px] lg:w-[600px]">${validate_component(Card, "Card").$$render($$result, { class: "w-full p-6 shadow-lg" }, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, { class: "space-y-4 text-center" }, {}, {
        default: () => {
          return `<img src="/android-chrome-192x192.png" alt="March of Faith Logo" class="mx-auto h-60 w-60"> ${validate_component(Card_title, "CardTitle").$$render(
            $$result,
            {
              class: "text-3xl font-bold tracking-tight"
            },
            {},
            {
              default: () => {
                return `Welcome to March of Faith, Inc.`;
              }
            }
          )} `;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, { class: "pt-6" }, {}, {
        default: () => {
          return `${validate_component(Root, "Tabs").$$render($$result, { value: "signin", class: "w-full" }, {}, {
            default: () => {
              return `${``} ${validate_component(Tabs_content, "TabsContent").$$render($$result, { value: "signin" }, {}, {
                default: () => {
                  return `<form method="POST" action="?/signin" class="space-y-6"><div class="space-y-4"><div class="space-y-2">${validate_component(Input, "Input").$$render(
                    $$result,
                    {
                      id: "signin-email",
                      name: "email",
                      type: "email",
                      placeholder: "name@example.com",
                      value: form?.email ?? "",
                      required: true
                    },
                    {},
                    {}
                  )}</div> <div class="space-y-2">${validate_component(Input, "Input").$$render(
                    $$result,
                    {
                      id: "signin-password",
                      name: "password",
                      type: "password",
                      placeholder: "••••••••",
                      required: true
                    },
                    {},
                    {}
                  )}</div></div> ${form?.error ? `<div class="text-sm text-red-500" role="alert">${escape(form.error)}</div>` : ``} ${validate_component(Button, "Button").$$render(
                    $$result,
                    {
                      type: "submit",
                      class: "w-full",
                      disabled: isLoading
                    },
                    {},
                    {
                      default: () => {
                        return `${``} ${escape("Sign In")}`;
                      }
                    }
                  )}</form>`;
                }
              })} ${``}`;
            }
          })}`;
        }
      })}`;
    }
  })}</div></div>`;
});
export {
  Page as default
};
