import { c as create_ssr_component, s as subscribe, b as each, e as escape, a as add_attribute, v as validate_component } from "../../../../chunks/ssr.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "../../../../chunks/client.js";
import "../../../../chunks/index2.js";
import "dequal";
import "../../../../chunks/create.js";
import "clsx";
import { I as Input } from "../../../../chunks/input.js";
import { b as billingSchema } from "../../../../chunks/formSchema.js";
import "memoize-weak";
import { z as zodClient } from "../../../../chunks/zod.js";
import { B as Button } from "../../../../chunks/button.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $formData, $$unsubscribe_formData;
  let { data } = $$props;
  const form = superForm(data.form, {
    validators: zodClient(billingSchema),
    taintedMessage: null,
    resetForm: true,
    onSubmit: ({ formData: formData2, cancel }) => {
      const formDataObj = Object.fromEntries(formData2);
      console.log("Form data being submitted:", formDataObj);
      return;
    }
  });
  let { form: formData, enhance, reset } = form;
  $$unsubscribe_formData = subscribe(formData, (value) => $formData = value);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $formData.type ? {
    value: $formData.type,
    label: $formData.type
  } : void 0;
  $formData.utilityType ? {
    value: $formData.utilityType,
    label: $formData.utilityType
  } : void 0;
  $formData.status ? {
    value: $formData.status,
    label: $formData.status
  } : void 0;
  $formData.leaseId ? {
    value: $formData.leaseId,
    label: data.leases.find((l) => l.id === $formData.leaseId)?.leaseName ?? "Select a lease"
  } : void 0;
  ($formData.amount || 0) - ($formData.paidAmount || 0);
  $formData.type === "UTILITY";
  $$unsubscribe_formData();
  return `  <div class="container mx-auto p-4 flex"> <div class="w-2/3 pr-4"><h2 class="text-xl font-bold mb-2" data-svelte-h="svelte-7rudfw">Accounts List</h2> <ul class="space-y-2">${each(data.billings, (account) => {
    return `<li class="bg-gray-100 p-4 rounded shadow"><div class="flex justify-between items-start mb-2"><div><span class="font-bold">${escape(account.lease.leaseName)}</span> <span class="mx-2" data-svelte-h="svelte-1hxruir">|</span> <span class="text-blue-600">${escape(account.type)}</span> <span class="mx-2" data-svelte-h="svelte-1hxruir">|</span> <span class="text-green-600">${escape(account.category)}</span></div> <div>${validate_component(Button, "Button").$$render($$result, { class: "mr-2" }, {}, {
      default: () => {
        return `Edit`;
      }
    })} <form method="POST" action="?/delete" class="inline"><input type="hidden" name="id"${add_attribute("value", account.id, 0)}> ${validate_component(Button, "Button").$$render($$result, { type: "submit", variant: "destructive" }, {}, {
      default: () => {
        return `Delete`;
      }
    })}</form> </div></div> <div class="grid grid-cols-2 gap-2 text-sm"><div><strong data-svelte-h="svelte-9u2o5c">Amount:</strong> ${escape(account.amount)}</div> <div><strong data-svelte-h="svelte-1pxy306">Paid:</strong> ${escape(account.paidAmount || 0)}</div> <div><strong data-svelte-h="svelte-1bu72em">Balance:</strong> ${escape(account.amount - (account.paidAmount || 0))}</div> <div><strong data-svelte-h="svelte-14kvxud">Date Issued:</strong> ${escape(new Date(account.dateIssued).toLocaleDateString())}</div> <div><strong data-svelte-h="svelte-17xzdey">Due Date:</strong> ${escape(account.dueOn ? new Date(account.dueOn).toLocaleDateString() : "N/A")}</div></div> ${account.notes ? `<div class="mt-2"><strong data-svelte-h="svelte-5k9uvd">Notes:</strong> ${escape(account.notes)} </div>` : ``} </li>`;
  })}</ul></div>  <div class="w-1/3 pl-4">${`<h1 class="text-2xl font-bold mb-4">${escape("Add")} Account</h1> <form method="POST"${add_attribute("action", "?/create", 0)} class="space-y-4 mb-8">${``}  <div class="space-y-2"> ${validate_component(Input, "Input").$$render(
    $$result,
    {
      type: "number",
      value: ($formData.amount || 0) - ($formData.paidAmount || 0),
      disabled: true,
      class: "bg-gray-100"
    },
    {},
    {}
  )}</div>  ${validate_component(Button, "Button").$$render($$result, { type: "submit" }, {}, {
    default: () => {
      return `${escape("Add")} Account`;
    }
  })} ${``}</form>`}</div></div>  <div class="fixed bottom-4 right-4">${validate_component(Button, "Button").$$render(
    $$result,
    {
      class: "rounded-full w-16 h-16 flex items-center justify-center text-2xl"
    },
    {},
    {
      default: () => {
        return `${escape("×")}`;
      }
    }
  )}</div> ${``}`;
});
export {
  Page as default
};
