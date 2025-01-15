import { c as create_ssr_component, s as subscribe, f as createEventDispatcher, a as add_attribute, v as validate_component, b as each, e as escape, t as set_store_value } from "../../../../chunks/ssr.js";
import { B as Button } from "../../../../chunks/button.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index7.js";
import { a as floorStatusEnum, f as floorSchema } from "../../../../chunks/formSchema3.js";
import { B as Badge } from "../../../../chunks/index9.js";
import "../../../../chunks/index2.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "memoize-weak";
import { a as zodClient } from "../../../../chunks/zod.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import { i as invalidate } from "../../../../chunks/client.js";
const css = {
  code: '[data-error="true"]{border-color:hsl(var(--destructive)) !important;--tw-ring-color:hsl(var(--destructive)) !important;outline:none !important}',
  map: `{"version":3,"file":"FloorForm.svelte","sources":["FloorForm.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Button from \\"$lib/components/ui/button/button.svelte\\";\\nimport Input from \\"$lib/components/ui/input/input.svelte\\";\\nimport Label from \\"$lib/components/ui/label/label.svelte\\";\\nimport * as Select from \\"$lib/components/ui/select\\";\\nimport { createEventDispatcher } from \\"svelte\\";\\nimport { floorStatusEnum } from \\"./formSchema\\";\\nexport let data;\\nexport let editMode = false;\\nexport let form;\\nexport let errors;\\nexport let enhance;\\nexport let constraints;\\nconst dispatch = createEventDispatcher();\\nfunction handlePropertyChange(selected) {\\n  const s = selected;\\n  if (s?.value) {\\n    const propertyId = parseInt(s.value, 10);\\n    if (!isNaN(propertyId)) {\\n      $form.property_id = propertyId;\\n    }\\n  }\\n}\\nfunction handleStatusChange(selected) {\\n  const s = selected;\\n  if (s?.value) {\\n    $form.status = s.value;\\n  }\\n}\\n<\/script>\\n\\n<form\\n  method=\\"POST\\"\\n  action={editMode ? \\"?/update\\" : \\"?/create\\"}\\n  use:enhance\\n  class=\\"space-y-4\\"\\n  novalidate\\n>\\n  {#if editMode && $form.id}\\n    <input type=\\"hidden\\" name=\\"id\\" bind:value={$form.id} />\\n  {/if}\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"property_id\\">Property</Label>\\n    <input type=\\"hidden\\" name=\\"property_id\\" bind:value={$form.property_id} />\\n    <Select.Root    \\n      selected={{ \\n        value: $form.property_id?.toString() || '', \\n        label: data.properties.find(p => p.id === $form.property_id)?.name || 'Select a property' \\n      }}\\n      onSelectedChange={handlePropertyChange}\\n    >\\n      <Select.Trigger data-error={!!$errors.property_id}>\\n        <Select.Value placeholder=\\"Select a property\\" />\\n      </Select.Trigger>\\n      <Select.Content>\\n        {#each data.properties as property}\\n          <Select.Item value={property.id.toString()}>\\n            {property.name}\\n          </Select.Item>\\n        {/each}\\n      </Select.Content>\\n    </Select.Root>\\n    {#if $errors.property_id}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.property_id}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"floor_number\\">Floor Number</Label>\\n    <Input \\n      type=\\"number\\" \\n      id=\\"floor_number\\" \\n      name=\\"floor_number\\" \\n      min=\\"1\\"\\n      bind:value={$form.floor_number}\\n      class=\\"w-full\\"\\n      data-error={!!$errors.floor_number}\\n      aria-invalid={!!$errors.floor_number}\\n      {...$constraints.floor_number}\\n    />\\n    {#if $errors.floor_number}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.floor_number}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"wing\\">Wing</Label>\\n    <Input \\n      type=\\"text\\" \\n      id=\\"wing\\" \\n      name=\\"wing\\" \\n      bind:value={$form.wing}\\n      class=\\"w-full\\"\\n      data-error={!!$errors.wing}\\n      aria-invalid={!!$errors.wing}\\n      {...$constraints.wing}\\n      placeholder=\\"Optional\\"\\n    />\\n    {#if $errors.wing}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.wing}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"status\\">Status</Label>\\n    <Select.Root    \\n      selected={{ \\n        value: $form.status || '', \\n        label: $form.status || 'Select a status' \\n      }}\\n      onSelectedChange={handleStatusChange}\\n    >\\n      <Select.Trigger \\n        data-error={!!$errors.status}\\n        {...$constraints.status}\\n      >\\n        <Select.Value placeholder=\\"Select a status\\" />\\n      </Select.Trigger>\\n      <Select.Content>\\n        {#each floorStatusEnum.options as status}\\n          <Select.Item value={status}>\\n            {status}\\n          </Select.Item>\\n        {/each}\\n      </Select.Content>\\n    </Select.Root>\\n    {#if $errors.status}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.status}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"flex justify-end space-x-2\\">\\n    <Button type=\\"submit\\">\\n      {editMode ? 'Update' : 'Add'} Floor\\n    </Button>\\n    {#if editMode}\\n      <Button type=\\"button\\" variant=\\"destructive\\" on:click={() => dispatch('cancel')}>\\n        Cancel\\n      </Button>\\n    {/if}\\n  </div>\\n</form>\\n\\n<style>\\n  :global([data-error=\\"true\\"]) {\\n    border-color: hsl(var(--destructive)) !important;\\n    --tw-ring-color: hsl(var(--destructive)) !important;\\n    outline: none !important;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAgJU,mBAAqB,CAC3B,YAAY,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAAC,UAAU,CAChD,eAAe,CAAE,wBAAwB,UAAU,CACnD,OAAO,CAAE,IAAI,CAAC,UAChB"}`
};
const FloorForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $form, $$unsubscribe_form;
  let $errors, $$unsubscribe_errors;
  let $constraints, $$unsubscribe_constraints;
  let { data } = $$props;
  let { editMode = false } = $$props;
  let { form } = $$props;
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  let { errors } = $$props;
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  let { enhance } = $$props;
  let { constraints } = $$props;
  $$unsubscribe_constraints = subscribe(constraints, (value) => $constraints = value);
  createEventDispatcher();
  function handlePropertyChange(selected) {
    const s = selected;
    if (s?.value) {
      const propertyId = parseInt(s.value, 10);
      if (!isNaN(propertyId)) {
        set_store_value(form, $form.property_id = propertyId, $form);
      }
    }
  }
  function handleStatusChange(selected) {
    const s = selected;
    if (s?.value) {
      set_store_value(form, $form.status = s.value, $form);
    }
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  if ($$props.editMode === void 0 && $$bindings.editMode && editMode !== void 0) $$bindings.editMode(editMode);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
  if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
  if ($$props.enhance === void 0 && $$bindings.enhance && enhance !== void 0) $$bindings.enhance(enhance);
  if ($$props.constraints === void 0 && $$bindings.constraints && constraints !== void 0) $$bindings.constraints(constraints);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<form method="POST"${add_attribute("action", editMode ? "?/update" : "?/create", 0)} class="space-y-4" novalidate>${editMode && $form.id ? `<input type="hidden" name="id"${add_attribute("value", $form.id, 0)}>` : ``} <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "property_id" }, {}, {
      default: () => {
        return `Property`;
      }
    })} <input type="hidden" name="property_id"${add_attribute("value", $form.property_id, 0)}> ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: $form.property_id?.toString() || "",
          label: data.properties.find((p) => p.id === $form.property_id)?.name || "Select a property"
        },
        onSelectedChange: handlePropertyChange
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, { "data-error": !!$errors.property_id }, {}, {
            default: () => {
              return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a property" }, {}, {})}`;
            }
          })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${each(data.properties, (property) => {
                return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: property.id.toString() }, {}, {
                  default: () => {
                    return `${escape(property.name)} `;
                  }
                })}`;
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.property_id ? `<p class="text-sm font-medium text-destructive">${escape($errors.property_id)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "floor_number" }, {}, {
      default: () => {
        return `Floor Number`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object.assign({}, { type: "number" }, { id: "floor_number" }, { name: "floor_number" }, { min: "1" }, { class: "w-full" }, { "data-error": !!$errors.floor_number }, { "aria-invalid": !!$errors.floor_number }, $constraints.floor_number, { value: $form.floor_number }),
      {
        value: ($$value) => {
          $form.floor_number = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.floor_number ? `<p class="text-sm font-medium text-destructive">${escape($errors.floor_number)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "wing" }, {}, {
      default: () => {
        return `Wing`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object.assign({}, { type: "text" }, { id: "wing" }, { name: "wing" }, { class: "w-full" }, { "data-error": !!$errors.wing }, { "aria-invalid": !!$errors.wing }, $constraints.wing, { placeholder: "Optional" }, { value: $form.wing }),
      {
        value: ($$value) => {
          $form.wing = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.wing ? `<p class="text-sm font-medium text-destructive">${escape($errors.wing)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "status" }, {}, {
      default: () => {
        return `Status`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: $form.status || "",
          label: $form.status || "Select a status"
        },
        onSelectedChange: handleStatusChange
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, Object.assign({}, { "data-error": !!$errors.status }, $constraints.status), {}, {
            default: () => {
              return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a status" }, {}, {})}`;
            }
          })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${each(floorStatusEnum.options, (status) => {
                return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: status }, {}, {
                  default: () => {
                    return `${escape(status)} `;
                  }
                })}`;
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.status ? `<p class="text-sm font-medium text-destructive">${escape($errors.status)}</p>` : ``}</div> <div class="flex justify-end space-x-2">${validate_component(Button, "Button").$$render($$result, { type: "submit" }, {}, {
      default: () => {
        return `${escape(editMode ? "Update" : "Add")} Floor`;
      }
    })} ${editMode ? `${validate_component(Button, "Button").$$render($$result, { type: "button", variant: "destructive" }, {}, {
      default: () => {
        return `Cancel`;
      }
    })}` : ``}</div> </form>`;
  } while (!$$settled);
  $$unsubscribe_form();
  $$unsubscribe_errors();
  $$unsubscribe_constraints();
  return $$rendered;
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
  let floors;
  let properties;
  let form;
  let user;
  let isAdminLevel;
  let isStaffLevel;
  let $$unsubscribe_formData;
  let { data } = $$props;
  const { form: formData, enhance, errors, constraints } = superForm(data.form, {
    id: "floor-form",
    validators: zodClient(floorSchema),
    validationMethod: "oninput",
    dataType: "json",
    delayMs: 10,
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error("Form submission error:", {
        error: result.error,
        status: result.status
      });
      if (result.error) {
        console.error("Server error:", result.error.message);
      }
    },
    onResult: async ({ result }) => {
      console.log("Form submission result:", result);
      if (result.type === "success") {
        selectedFloor = void 0;
        editMode = false;
        await invalidate();
      }
    }
  });
  $$unsubscribe_formData = subscribe(formData, (value) => value);
  let editMode = false;
  let selectedFloor = void 0;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  ({ floors, properties, form, user, isAdminLevel, isStaffLevel } = data);
  {
    if (floors) {
      console.log("Floors data updated:", {
        count: floors.length,
        floorIds: floors.map((f) => f.id)
      });
    }
  }
  $$unsubscribe_formData();
  return `<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4"><div class="w-full lg:w-2/3"><div class="flex justify-between items-center mb-4" data-svelte-h="svelte-s2vd95"><h1 class="text-2xl font-bold">Floors</h1></div> ${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_content, "CardContent").$$render($$result, { class: "p-0" }, {}, {
        default: () => {
          return `<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 font-medium border-b bg-muted/50" data-svelte-h="svelte-2qwwuu"><div class="flex items-center">Property</div> <div class="flex items-center">Floor</div> <div class="flex items-center">Wing</div> <div class="flex items-center">Status</div> <div class="flex items-center justify-center">Units</div> <div class="flex items-center">Actions</div></div> ${floors?.length > 0 ? `${each(floors, (floor) => {
            return `<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0"><div class="font-medium">${escape(floor.property?.name || "Unknown Property")}</div> <div>Floor ${escape(floor.floor_number)}</div> <div>${escape(floor.wing || "-")}</div> <div>${validate_component(Badge, "Badge").$$render(
              $$result,
              {
                variant: getStatusVariant(floor.status || "ACTIVE")
              },
              {},
              {
                default: () => {
                  return `${escape(floor.status || "ACTIVE")} `;
                }
              }
            )}</div> <div class="flex items-center justify-center">${escape((floor.rental_unit && Array.isArray(floor.rental_unit) ? floor.rental_unit.length : 0) || 0)}</div> <div class="flex items-center gap-2">${validate_component(Button, "Button").$$render(
              $$result,
              {
                size: "sm",
                variant: "outline",
                disabled: !data.isAdminLevel && !data.isStaffLevel
              },
              {},
              {
                default: () => {
                  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Edit
                `;
                }
              }
            )} ${validate_component(Button, "Button").$$render(
              $$result,
              {
                size: "sm",
                variant: "destructive",
                disabled: !data.isAdminLevel
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
          })}` : `<div class="p-4 text-center text-muted-foreground" data-svelte-h="svelte-1inofmg">No floors found</div>`}`;
        }
      })}`;
    }
  })}</div> <div class="w-full lg:w-1/3">${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, {}, {}, {
            default: () => {
              return `${escape(editMode ? "Edit" : "Add")} Floor`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(FloorForm, "FloorForm").$$render(
            $$result,
            {
              data,
              editMode,
              form: formData,
              errors,
              enhance,
              constraints
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
