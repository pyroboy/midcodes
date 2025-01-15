import { c as create_ssr_component, v as validate_component, s as subscribe, e as escape, b as each, a as add_attribute } from "../../../../../chunks/ssr.js";
import { r as registrationSchema } from "../../../../../chunks/schema3.js";
import { s as superForm } from "../../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../../chunks/formData.js";
import "memoize-weak";
import { z as zod } from "../../../../../chunks/zod.js";
import "../../../../../chunks/index2.js";
import { I as Input } from "../../../../../chunks/input.js";
import { L as Label } from "../../../../../chunks/label.js";
import { c as cn } from "../../../../../chunks/utils.js";
import { p as page } from "../../../../../chunks/stores.js";
import { g as goto } from "../../../../../chunks/client.js";
import { t as toast } from "../../../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
import { T as Toaster } from "../../../../../chunks/Toaster.js";
import { C as Check } from "../../../../../chunks/check.js";
import { B as Button } from "../../../../../chunks/button.js";
const css = {
  code: ".opacity-0.svelte-1tc2qf2{opacity:0}.opacity-100.svelte-1tc2qf2{opacity:1}.scale-0.svelte-1tc2qf2{transform:scale(0)}.scale-50.svelte-1tc2qf2{transform:scale(0.5)}.scale-100.svelte-1tc2qf2{transform:scale(1)}",
  map: '{"version":3,"file":"SimplerSuccessMessage.svelte","sources":["SimplerSuccessMessage.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { Check } from \\"lucide-svelte\\";\\nimport { onMount } from \\"svelte\\";\\nimport { fade } from \\"svelte/transition\\";\\nexport let data;\\nlet visible = false;\\nlet showCheck = false;\\nlet showText = false;\\nlet typedText = \\"\\";\\nconst fullText = `Please complete payment within ${data.paymentTimeoutMinutes} minutes`;\\nonMount(() => {\\n  visible = true;\\n  setTimeout(() => showCheck = true, 300);\\n  setTimeout(() => showText = true, 1e3);\\n  let currentChar = 0;\\n  const typeInterval = setInterval(() => {\\n    if (currentChar < fullText.length) {\\n      typedText = fullText.slice(0, currentChar + 1);\\n      currentChar++;\\n    } else {\\n      clearInterval(typeInterval);\\n    }\\n  }, 50);\\n  return () => clearInterval(typeInterval);\\n});\\n<\/script>\\n\\n<div class=\\"fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]\\"\\n    class:opacity-0={!visible}\\n    class:opacity-100={visible}\\n    transition:fade={{ duration: 200 }}>\\n    <div class=\\"bg-white rounded-2xl shadow-xl w-full max-w-lg p-12 relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500\\">\\n        <!-- Success Check Animation -->\\n        <div class=\\"relative w-32 h-32 mb-8\\">\\n            <div class=\\"absolute inset-0 bg-green-100 rounded-full scale-0 animate-in zoom-in duration-500 delay-300\\"\\n                class:scale-100={showCheck}></div>\\n            <div class=\\"absolute inset-0 flex items-center justify-center opacity-0 scale-50\\"\\n                class:opacity-100={showCheck}\\n                class:scale-100={showCheck}\\n                style=\\"transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s\\">\\n                <Check class=\\"w-16 h-16 text-green-600 stroke-[3]\\" />\\n            </div>\\n        </div>\\n\\n        <!-- Success Message -->\\n        <div class=\\"text-center space-y-4\\">\\n            <h2 class=\\"text-2xl font-bold text-gray-900 animate-in fade-in slide-in-from-bottom duration-500 delay-500\\">\\n                Registration Successful!\\n            </h2>\\n            {#if showText}\\n                <p class=\\"text-gray-600 h-6 font-medium\\">\\n                    {typedText}\\n                </p>\\n                <p class=\\"text-gray-600 mt-2\\">\\n                    Reference Code: <span class=\\"font-mono font-bold\\">{data.referenceCode}</span>\\n                </p>\\n            {/if}\\n        </div>\\n    </div>\\n</div>\\n\\n<style>\\n    .opacity-0 {\\n        opacity: 0;\\n    }\\n    .opacity-100 {\\n        opacity: 1;\\n    }\\n    .scale-0 {\\n        transform: scale(0);\\n    }\\n    .scale-50 {\\n        transform: scale(0.5);\\n    }\\n    .scale-100 {\\n        transform: scale(1);\\n    }\\n</style>"],"names":[],"mappings":"AA6DI,yBAAW,CACP,OAAO,CAAE,CACb,CACA,2BAAa,CACT,OAAO,CAAE,CACb,CACA,uBAAS,CACL,SAAS,CAAE,MAAM,CAAC,CACtB,CACA,wBAAU,CACN,SAAS,CAAE,MAAM,GAAG,CACxB,CACA,yBAAW,CACP,SAAS,CAAE,MAAM,CAAC,CACtB"}'
};
const SimplerSuccessMessage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  `Please complete payment within ${data.paymentTimeoutMinutes} minutes`;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$result.css.add(css);
  return `<div class="${[
    "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] svelte-1tc2qf2",
    "opacity-0 "
  ].join(" ").trim()}"><div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-12 relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500"> <div class="relative w-32 h-32 mb-8"><div class="${[
    "absolute inset-0 bg-green-100 rounded-full scale-0 animate-in zoom-in duration-500 delay-300 svelte-1tc2qf2",
    ""
  ].join(" ").trim()}"></div> <div class="${[
    "absolute inset-0 flex items-center justify-center opacity-0 scale-50 svelte-1tc2qf2",
    " "
  ].join(" ").trim()}" style="transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s">${validate_component(Check, "Check").$$render(
    $$result,
    {
      class: "w-16 h-16 text-green-600 stroke-[3]"
    },
    {},
    {}
  )}</div></div>  <div class="text-center space-y-4"><h2 class="text-2xl font-bold text-gray-900 animate-in fade-in slide-in-from-bottom duration-500 delay-500" data-svelte-h="svelte-11yqtdv">Registration Successful!</h2> ${``}</div></div> </div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let availableTickets;
  let $page, $$unsubscribe_page;
  let $form, $$unsubscribe_form;
  let $errors, $$unsubscribe_errors;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { data } = $$props;
  let retoken = "";
  const isAdmin = data.profile?.role && ["super_admin", "event_admin", "org_admin"].includes(data.profile.role);
  let showConfirmation = false;
  let registrationData = null;
  let isSubmitting = false;
  const { form, errors, enhance } = superForm(data.form, {
    validators: zod(registrationSchema),
    taintedMessage: null,
    onSubmit: async ({ formData, cancel }) => {
      console.log("Form submission started");
      isSubmitting = true;
      if (!isAdmin && !retoken) {
        console.log("Missing reCAPTCHA token for non-admin user");
        toast.error("Please complete the reCAPTCHA verification");
        isSubmitting = false;
        cancel();
        return false;
      }
      if (!isAdmin) {
        console.log("Adding captcha token to form data");
        formData.append("captchaToken", retoken);
      }
    },
    onResult: ({ result }) => {
      console.log("Form submission result:", result);
      isSubmitting = false;
      if (result.type === "success" && result.data?.form?.message?.data) {
        console.log("Success data:", result.data);
        const responseData = result.data.form.message.data;
        registrationData = responseData;
        if (responseData && responseData.referenceCode) {
          console.log("Starting redirect with reference code:", responseData.referenceCode);
          toast.success("Registration successful!");
          showConfirmation = true;
          setTimeout(
            () => {
              goto(`/events/${$page.params.event_url}/${responseData.referenceCode}`);
            },
            2e3
          );
        } else {
          console.error("Missing reference code in response");
          toast.error("Missing reference code in response");
        }
      } else if (result.type === "error") {
        console.error("Form submission error:", result.error);
        toast.error(result.error?.message || "Registration failed");
        if (result.error?.message.includes("reCAPTCHA")) {
          console.log("reCAPTCHA error detected, resetting token");
          retoken = "";
          if (window.grecaptcha) {
            window.grecaptcha.reset();
          }
        }
      }
    }
  });
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  let ticketTypes = [];
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    {
      {
        ticketTypes = Array.isArray(data.event.ticketing_data) ? data.event.ticketing_data.filter((ticket) => typeof ticket.available === "number" && ticket.available > 0) : [];
      }
    }
    availableTickets = ticketTypes.length > 0;
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-zert8s_START -->${$$result.title = `<title>Register for ${escape(data.event.event_name)}</title>`, ""}<meta name="description" content="${"Registration page for " + escape(data.event.event_name, true)}"><!-- HEAD_svelte-zert8s_END -->`, ""} ${validate_component(Toaster, "Toaster").$$render($$result, {}, {}, {})} <div class="relative min-h-screen bg-background">${showConfirmation && registrationData ? `${validate_component(SimplerSuccessMessage, "SimplerSuccessMessage").$$render($$result, { data: registrationData }, {}, {})}` : ``} <div class="${"container mx-auto px-4 py-8 " + escape(showConfirmation ? "pointer-events-none blur-sm" : "", true)}"><div class="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-6 dark:border dark:border-border"><div class="mb-8"><h1 class="text-3xl font-bold mb-2 text-foreground">${escape(data.event.event_name)}</h1> ${data.event.event_long_name ? `<p class="text-lg text-muted-foreground">${escape(data.event.event_long_name)}</p>` : ``}</div> <form method="POST" class="space-y-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "firstName" }, {}, {
      default: () => {
        return `First Name`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        id: "firstName",
        name: "firstName",
        class: cn("w-full", $errors.firstName && "border-destructive"),
        value: $form.firstName
      },
      {
        value: ($$value) => {
          $form.firstName = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.firstName ? `<p class="text-sm text-destructive">${escape($errors.firstName)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "lastName" }, {}, {
      default: () => {
        return `Last Name`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        id: "lastName",
        name: "lastName",
        class: cn("w-full", $errors.lastName && "border-destructive"),
        value: $form.lastName
      },
      {
        value: ($$value) => {
          $form.lastName = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.lastName ? `<p class="text-sm text-destructive">${escape($errors.lastName)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "email" }, {}, {
      default: () => {
        return `Email`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "email",
        id: "email",
        name: "email",
        class: cn("w-full", $errors.email && "border-destructive"),
        value: $form.email
      },
      {
        value: ($$value) => {
          $form.email = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.email ? `<p class="text-sm text-destructive">${escape($errors.email)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "phone" }, {}, {
      default: () => {
        return `Phone`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "tel",
        id: "phone",
        name: "phone",
        class: cn("w-full", $errors.phone && "border-destructive"),
        value: $form.phone
      },
      {
        value: ($$value) => {
          $form.phone = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.phone ? `<p class="text-sm text-destructive">${escape($errors.phone)}</p>` : ``}</div></div> ${availableTickets ? `<div class="space-y-4">${validate_component(Label, "Label").$$render($$result, { class: "text-lg" }, {}, {
      default: () => {
        return `Select Ticket Type`;
      }
    })} <div class="grid gap-4">${each(ticketTypes, (ticket) => {
      return `<label${add_attribute(
        "class",
        cn("relative flex flex-col p-4 cursor-pointer rounded-lg border transition-colors", $form.ticketType === ticket.type ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50 border-border"),
        0
      )}><input type="radio" name="ticketType"${add_attribute("value", ticket.type, 0)} class="sr-only"${ticket.type === $form.ticketType ? add_attribute("checked", true, 1) : ""}> <div class="flex justify-between items-start gap-2"><div><div class="font-medium">${escape(ticket.type)}</div> ${ticket.includes?.length ? `<ul class="mt-1 text-sm list-disc list-inside space-y-1">${each(ticket.includes, (item) => {
        return `<li>${escape(item)}</li>`;
      })} </ul>` : ``}</div> <div class="text-right"><div class="font-medium">₱${escape(ticket.price)}</div> <span class="text-sm text-muted-foreground">${escape(ticket.available)} left</span> </div></div> </label>`;
    })}</div> ${$errors.ticketType ? `<p class="text-sm text-destructive">${escape($errors.ticketType)}</p>` : ``}</div>` : `<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4" data-svelte-h="svelte-h0wkk5"><p class="text-destructive font-medium">No tickets available for this event.</p></div>`} ${!isAdmin && data.local.recaptcha ? `<div class="mt-4"><div class="g-recaptcha dark:invert-[.95]"${add_attribute("data-sitekey", data.local.recaptcha, 0)} data-callback="onRecaptchaSuccess" data-error-callback="onRecaptchaError" data-expired-callback="onRecaptchaExpired"></div> ${``}</div>` : ``} ${validate_component(Button, "Button").$$render(
      $$result,
      {
        type: "submit",
        class: "w-full",
        disabled: isSubmitting || !availableTickets || !isAdmin && !retoken
      },
      {},
      {
        default: () => {
          return `${escape(isSubmitting ? "Registering..." : "Register")}`;
        }
      }
    )}</form></div></div></div>`;
  } while (!$$settled);
  $$unsubscribe_page();
  $$unsubscribe_form();
  $$unsubscribe_errors();
  return $$rendered;
});
export {
  Page as default
};
