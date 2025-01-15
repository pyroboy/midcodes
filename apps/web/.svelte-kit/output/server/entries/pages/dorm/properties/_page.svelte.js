import { c as create_ssr_component, f as createEventDispatcher, s as subscribe, a as add_attribute, v as validate_component, e as escape, b as each } from "../../../../chunks/ssr.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "../../../../chunks/index2.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index6.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import { P as PropertyType, b as PropertyStatus } from "../../../../chunks/formSchema7.js";
import { B as Button } from "../../../../chunks/button.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import { B as Badge } from "../../../../chunks/index9.js";
import "../../../../chunks/client.js";
const PropertyForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let action;
  let $errors, $$unsubscribe_errors;
  let { data } = $$props;
  let { editMode = false } = $$props;
  let { property = void 0 } = $$props;
  const dispatch = createEventDispatcher();
  const { form, errors, enhance } = superForm(data.form, {
    onResult: ({ result }) => {
      if (result.type === "success") {
        dispatch("propertyAdded");
      }
    }
  });
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  const propertyTypes = Object.entries(PropertyType).map(([value]) => ({ value, label: value.replace("_", " ") }));
  const statusOptions = Object.entries(PropertyStatus).map(([value]) => ({ value, label: value }));
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  if ($$props.editMode === void 0 && $$bindings.editMode && editMode !== void 0) $$bindings.editMode(editMode);
  if ($$props.property === void 0 && $$bindings.property && property !== void 0) $$bindings.property(property);
  action = editMode ? "?/update" : "?/create";
  $$unsubscribe_errors();
  return `<form method="POST"${add_attribute("action", action, 0)}>${editMode && property ? `<input type="hidden" name="id"${add_attribute("value", property.id, 0)}>` : ``} <div class="space-y-4"><div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "name" }, {}, {
    default: () => {
      return `Name`;
    }
  })} ${validate_component(Input, "Input").$$render(
    $$result,
    {
      id: "name",
      name: "name",
      value: property?.name ?? ""
    },
    {},
    {}
  )} ${$errors.name ? `<p class="text-sm text-red-500">${escape($errors.name[0])}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "address" }, {}, {
    default: () => {
      return `Address`;
    }
  })} ${validate_component(Input, "Input").$$render(
    $$result,
    {
      id: "address",
      name: "address",
      value: property?.address ?? ""
    },
    {},
    {}
  )} ${$errors.address ? `<p class="text-sm text-red-500">${escape($errors.address[0])}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "type" }, {}, {
    default: () => {
      return `Type`;
    }
  })} ${validate_component(Root, "Select.Root").$$render(
    $$result,
    {
      name: "type",
      items: propertyTypes,
      selected: property?.type
    },
    {},
    {
      default: () => {
        return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, { class: "w-full" }, {}, {
          default: () => {
            return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select property type" }, {}, {})}`;
          }
        })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
          default: () => {
            return `${each(propertyTypes, (type) => {
              return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: type.value }, {}, {
                default: () => {
                  return `${escape(type.label)}`;
                }
              })}`;
            })}`;
          }
        })}`;
      }
    }
  )} ${$errors.type ? `<p class="text-sm text-red-500">${escape($errors.type[0])}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "status" }, {}, {
    default: () => {
      return `Status`;
    }
  })} ${validate_component(Root, "Select.Root").$$render(
    $$result,
    {
      name: "status",
      items: statusOptions,
      selected: property?.status ?? "ACTIVE"
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
            return `${each(statusOptions, (status) => {
              return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: status.value }, {}, {
                default: () => {
                  return `${escape(status.label)}`;
                }
              })}`;
            })}`;
          }
        })}`;
      }
    }
  )} ${$errors.status ? `<p class="text-sm text-red-500">${escape($errors.status[0])}</p>` : ``}</div> <div class="flex justify-end space-x-2">${validate_component(Button, "Button").$$render($$result, { type: "submit" }, {}, {
    default: () => {
      return `${escape(editMode ? "Update" : "Create")} Property`;
    }
  })}</div></div></form>`;
});
function getStatusVariant(status) {
  switch (status) {
    case "ACTIVE":
      return "secondary";
    case "INACTIVE":
      return "destructive";
    case "MAINTENANCE":
      return "outline";
    default:
      return "default";
  }
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let properties;
  let form;
  let { data } = $$props;
  let editMode = false;
  let selectedProperty;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  ({ properties, form } = data);
  return `<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4"><div class="w-full lg:w-2/3"><div class="flex justify-between items-center mb-4" data-svelte-h="svelte-3rizwz"><h1 class="text-2xl font-bold">Properties</h1></div> ${validate_component(Card, "Card.Root").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_content, "Card.Content").$$render($$result, { class: "p-0" }, {}, {
        default: () => {
          return `<div class="grid grid-cols-[2fr_2fr_1fr_1fr_2fr] gap-4 p-4 font-medium border-b bg-muted/50" data-svelte-h="svelte-1t6qv8s"><div class="flex items-center">Name</div> <div class="flex items-center">Address</div> <div class="flex items-center">Type</div> <div class="flex items-center">Status</div> <div class="flex items-center">Actions</div></div> ${properties?.length > 0 ? `${each(properties, (property) => {
            return `<div class="grid grid-cols-[2fr_2fr_1fr_1fr_2fr] gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0"><div class="font-medium">${escape(property.name)}</div> <div>${escape(property.address)}</div> <div>${escape(property.type)}</div> <div>${validate_component(Badge, "Badge").$$render(
              $$result,
              {
                variant: getStatusVariant(property.status)
              },
              {},
              {
                default: () => {
                  return `${escape(property.status)} `;
                }
              }
            )}</div> <div class="flex items-center gap-2">${validate_component(Button, "Button").$$render($$result, { size: "sm", variant: "outline" }, {}, {
              default: () => {
                return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Edit
                `;
              }
            })} ${validate_component(Button, "Button").$$render(
              $$result,
              {
                size: "sm",
                variant: "destructive",
                disabled: false
              },
              {},
              {
                default: () => {
                  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
                  Delete
                `;
                }
              }
            )}</div> </div>`;
          })}` : `<div class="p-4 text-center text-muted-foreground" data-svelte-h="svelte-1bho1lq">No properties found</div>`}`;
        }
      })}`;
    }
  })}</div> <div class="w-full lg:w-1/3">${validate_component(Card, "Card.Root").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
            default: () => {
              return `${escape("Add")} Property`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(PropertyForm, "PropertyForm").$$render(
            $$result,
            {
              data,
              editMode,
              property: selectedProperty
            },
            {},
            {}
          )}`;
        }
      })}`;
    }
  })}</div></div>`;
});
export {
  Page as default
};
