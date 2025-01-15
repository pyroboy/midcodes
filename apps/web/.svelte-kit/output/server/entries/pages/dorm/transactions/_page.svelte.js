import { c as create_ssr_component, v as validate_component, b as each, a as add_attribute, e as escape } from "../../../../chunks/ssr.js";
import { f as formatDateTime, b as formatCurrency } from "../../../../chunks/utils.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import "../../../../chunks/index2.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import { p as paymentMethodEnum } from "../../../../chunks/schema2.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let filteredTransactions;
  let { data } = $$props;
  superForm(data.form);
  let searchTerm = "";
  let startDate = "";
  let endDate = "";
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    filteredTransactions = data.transactions.filter((transaction) => {
      const searchMatch = searchTerm ? transaction.billing?.type.toLowerCase().includes(searchTerm.toLowerCase()) || transaction.billing?.lease?.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) || transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const dateMatch = (!startDate || new Date(transaction.paid_at) >= new Date(startDate)) && (!endDate || new Date(transaction.paid_at) <= new Date(endDate));
      const methodMatch = true;
      return searchMatch && dateMatch && methodMatch;
    });
    $$rendered = `<div class="container mx-auto p-4"><div class="mb-8"><h2 class="text-2xl font-bold mb-4" data-svelte-h="svelte-1yxqdqu">Transaction History</h2>  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"> <div>${validate_component(Label, "Label").$$render($$result, { for: "search" }, {}, {
      default: () => {
        return `Search`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        id: "search",
        type: "text",
        placeholder: "Search transactions...",
        value: searchTerm
      },
      {
        value: ($$value) => {
          searchTerm = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>  <div>${validate_component(Label, "Label").$$render($$result, { for: "startDate" }, {}, {
      default: () => {
        return `Start Date`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        id: "startDate",
        type: "date",
        value: startDate
      },
      {
        value: ($$value) => {
          startDate = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>  <div>${validate_component(Label, "Label").$$render($$result, { for: "endDate" }, {}, {
      default: () => {
        return `End Date`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        id: "endDate",
        type: "date",
        value: endDate
      },
      {
        value: ($$value) => {
          endDate = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>  <div>${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Payment Method`;
      }
    })} <select class="w-full p-2 border rounded"><option value="" data-svelte-h="svelte-1cxnip5">All Methods</option>${each(Object.entries(paymentMethodEnum.Values), ([key, value]) => {
      return `<option${add_attribute("value", value, 0)}>${escape(key)}</option>`;
    })}</select></div></div>  <div class="overflow-x-auto"><table class="w-full"><thead data-svelte-h="svelte-8nzvp6"><tr class="border-b"><th class="p-2 text-left">Date</th> <th class="p-2 text-left">Type</th> <th class="p-2 text-left">Paid By</th> <th class="p-2 text-left">Amount</th> <th class="p-2 text-left">Method</th> <th class="p-2 text-left">Reference</th> <th class="p-2 text-left">Status</th></tr></thead> <tbody>${each(filteredTransactions, (transaction) => {
      return `<tr class="border-b"><td class="p-2">${escape(formatDateTime(transaction.paid_at))}</td> <td class="p-2">${escape(transaction.billing?.type ?? "N/A")}</td> <td class="p-2">${escape(transaction.billing?.lease?.tenant?.name ?? "N/A")}</td> <td class="p-2">${escape(formatCurrency(transaction.amount_paid))}</td> <td class="p-2">${escape(transaction.method)}</td> <td class="p-2">${escape(transaction.reference_number ?? "N/A")}</td> <td class="p-2">${escape(transaction.status)}</td> </tr>`;
    })}</tbody></table></div></div></div>`;
  } while (!$$settled);
  return $$rendered;
});
export {
  Page as default
};
