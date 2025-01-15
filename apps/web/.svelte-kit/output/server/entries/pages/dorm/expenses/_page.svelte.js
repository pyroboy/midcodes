import { c as create_ssr_component, s as subscribe, b as each, v as validate_component, e as escape, a as add_attribute } from "../../../../chunks/ssr.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "../../../../chunks/client.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index6.js";
import "../../../../chunks/index2.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import { e as expenseTypeEnum, a as expenseStatusEnum } from "../../../../chunks/formSchema2.js";
import { B as Button } from "../../../../chunks/button.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let expenses;
  let properties;
  let $form, $$unsubscribe_form;
  let $errors, $$unsubscribe_errors;
  let { data } = $$props;
  const { form, errors, enhance } = superForm(data.form);
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  function isValidExpenseType(value) {
    return Object.values(expenseTypeEnum.enum).includes(value);
  }
  function isValidExpenseStatus(value) {
    return Object.values(expenseStatusEnum.enum).includes(value);
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    expenses = data.expenses ?? [];
    properties = data.properties ?? [];
    $$rendered = `<div class="flex"> <div class="w-1/2 pr-4"><h2 class="text-2xl font-bold mb-4" data-svelte-h="svelte-2elq33">Expenses</h2> ${!expenses.length ? `<p data-svelte-h="svelte-16isobu">No expenses found.</p>` : `<ul class="space-y-2">${each(expenses, (expense) => {
      return `<li class="bg-white shadow rounded p-3"><div class="font-bold">${escape(expense.expense_type)}</div> <div>Amount: $${escape(expense.amount.toFixed(2))}</div> <div>Date: ${escape(new Date(expense.expense_date).toLocaleDateString())}</div> <div>Status: ${escape(expense.expense_status)}</div> <div>Notes: ${escape(expense.notes || "N/A")}</div> ${expense.receipt_url ? `<div>Receipt: <a${add_attribute("href", expense.receipt_url, 0)} target="_blank" class="text-blue-500 hover:underline">View</a></div>` : ``} </li>`;
    })}</ul>`}</div>  <div class="w-1/2 pl-4"><h2 class="text-2xl font-bold mb-4" data-svelte-h="svelte-r52uvj">Add Expense</h2> <form method="POST"><div class="space-y-4"><div>${validate_component(Label, "Label").$$render($$result, { for: "amount" }, {}, {
      default: () => {
        return `Amount`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "number",
        id: "amount",
        step: "0.01",
        min: "0",
        required: true,
        value: $form.amount
      },
      {
        value: ($$value) => {
          $form.amount = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.amount ? `<span class="text-red-500">${escape($errors.amount)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "expense_type" }, {}, {
      default: () => {
        return `Type`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: $form.expense_type ?? "",
          label: $form.expense_type ?? "Select expense type"
        },
        onSelectedChange: (s) => {
          if (s?.value && isValidExpenseType(s.value)) {
            $form.expense_type = s.value;
            ({ value: s.value, label: s.value });
          }
        }
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, { class: "w-full" }, {}, {
            default: () => {
              return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select expense type" }, {}, {})}`;
            }
          })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${each(Object.values(expenseTypeEnum.enum), (type) => {
                return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: type }, {}, {
                  default: () => {
                    return `${escape(type)}`;
                  }
                })}`;
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.expense_type ? `<span class="text-red-500">${escape($errors.expense_type)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "expense_status" }, {}, {
      default: () => {
        return `Status`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: $form.expense_status ?? "",
          label: $form.expense_status ?? "Select status"
        },
        onSelectedChange: (s) => {
          if (s?.value && isValidExpenseStatus(s.value)) {
            $form.expense_status = s.value;
            ({ value: s.value, label: s.value });
          }
        }
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, { class: "w-full" }, {}, {
            default: () => {
              return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select status" }, {}, {})}`;
            }
          })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${each(Object.values(expenseStatusEnum.enum), (status) => {
                return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: status }, {}, {
                  default: () => {
                    return `${escape(status)}`;
                  }
                })}`;
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.expense_status ? `<span class="text-red-500">${escape($errors.expense_status)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "property_id" }, {}, {
      default: () => {
        return `Property`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: ($form.property_id ?? "").toString(),
          label: properties.find((p) => p.id === $form.property_id)?.name ?? "Select property"
        },
        onSelectedChange: (s) => {
          if (s) {
            $form.property_id = parseInt(s.value);
          }
        }
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, { class: "w-full" }, {}, {
            default: () => {
              return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select property" }, {}, {})}`;
            }
          })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${each(properties, (property) => {
                return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: property.id.toString() }, {}, {
                  default: () => {
                    return `${escape(property.name)}`;
                  }
                })}`;
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.property_id ? `<span class="text-red-500">${escape($errors.property_id)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "description" }, {}, {
      default: () => {
        return `Description`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "text",
        id: "description",
        required: true,
        value: $form.description
      },
      {
        value: ($$value) => {
          $form.description = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.description ? `<span class="text-red-500">${escape($errors.description)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "expense_date" }, {}, {
      default: () => {
        return `Date`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "date",
        id: "expense_date",
        required: true,
        value: $form.expense_date
      },
      {
        value: ($$value) => {
          $form.expense_date = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.expense_date ? `<span class="text-red-500">${escape($errors.expense_date)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "receipt_url" }, {}, {
      default: () => {
        return `Receipt URL`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "url",
        id: "receipt_url",
        value: $form.receipt_url
      },
      {
        value: ($$value) => {
          $form.receipt_url = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.receipt_url ? `<span class="text-red-500">${escape($errors.receipt_url)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "notes" }, {}, {
      default: () => {
        return `Notes`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "text",
        id: "notes",
        value: $form.notes
      },
      {
        value: ($$value) => {
          $form.notes = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.notes ? `<span class="text-red-500">${escape($errors.notes)}</span>` : ``}</div> ${validate_component(Button, "Button").$$render($$result, { type: "submit" }, {}, {
      default: () => {
        return `Add Expense`;
      }
    })}</div></form></div></div> ${``}`;
  } while (!$$settled);
  $$unsubscribe_form();
  $$unsubscribe_errors();
  return $$rendered;
});
export {
  Page as default
};
