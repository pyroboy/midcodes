import { c as create_ssr_component, k as compute_rest_props, l as spread, m as escape_attribute_value, o as escape_object, e as escape, f as createEventDispatcher, a as add_attribute, v as validate_component, b as each, s as subscribe, t as set_store_value } from "../../../../chunks/ssr.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "memoize-weak";
import { z as zodClient } from "../../../../chunks/zod.js";
import { T as TenantStatusEnum, t as tenantFormSchema } from "../../../../chunks/formSchema9.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import { B as Button } from "../../../../chunks/button.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../chunks/table-row.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index6.js";
import { B as Badge } from "../../../../chunks/index9.js";
import { g as globals } from "../../../../chunks/globals.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import "../../../../chunks/index2.js";
import { c as cn } from "../../../../chunks/utils.js";
import { R as Root$1, D as Dialog_content, a as Dialog_header, b as Dialog_title, c as Dialog_description } from "../../../../chunks/index10.js";
const Textarea = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class", "value", "readonly"]);
  let { class: className = void 0 } = $$props;
  let { value = void 0 } = $$props;
  let { readonly = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.readonly === void 0 && $$bindings.readonly && readonly !== void 0) $$bindings.readonly(readonly);
  return `<textarea${spread(
    [
      {
        class: escape_attribute_value(cn("border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className))
      },
      { readonly: readonly || null },
      escape_object($$restProps)
    ],
    {}
  )}>${escape(value || "")}</textarea>`;
});
const Dialog_footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `<div${spread(
    [
      {
        class: escape_attribute_value(cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className))
      },
      escape_object($$restProps)
    ],
    {}
  )}>${slots.default ? slots.default({}) : ``}</div>`;
});
const TenantList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let filteredTenants;
  let sortedTenants;
  let { data } = $$props;
  createEventDispatcher();
  let selectedProperty;
  let selectedStatus;
  let searchQuery = "";
  function updatePropertyFilter(value) {
    selectedProperty = value?.value;
  }
  function updateStatusFilter(value) {
    selectedStatus = value?.value;
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  filteredTenants = data.tenants.filter((tenant) => {
    const matchesProperty = !selectedProperty || tenant.lease?.location?.property?.id?.toString() === selectedProperty;
    const matchesStatus = !selectedStatus || tenant.tenant_status === selectedStatus;
    const matchesSearch = true;
    return matchesProperty && matchesStatus && matchesSearch;
  });
  sortedTenants = filteredTenants.sort((a, b) => {
    if (a.tenant_status === "ACTIVE" && b.tenant_status !== "ACTIVE") return -1;
    if (a.tenant_status !== "ACTIVE" && b.tenant_status === "ACTIVE") return 1;
    if (a.outstanding_balance !== b.outstanding_balance) {
      return b.outstanding_balance - a.outstanding_balance;
    }
    return a.name.localeCompare(b.name);
  });
  return `<div class="w-2/3"><div class="bg-white shadow rounded-lg"><div class="p-4 border-b"><div class="flex justify-between items-center mb-4" data-svelte-h="svelte-14zu2nt"><h2 class="text-xl font-semibold">Tenants</h2></div> <div class="flex gap-4 mb-4"><div class="flex-1"><input type="text" placeholder="Search tenants..." class="w-full px-3 py-2 border rounded-lg"${add_attribute("value", searchQuery, 0)}></div> <div class="w-48">${validate_component(Root, "Select").$$render($$result, { onSelectedChange: updatePropertyFilter }, {}, {
    default: () => {
      return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Filter by property" }, {}, {})}`;
        }
      })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: "" }, {}, {
            default: () => {
              return `All Properties`;
            }
          })} ${each(data.properties, (property) => {
            return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: property.id.toString() }, {}, {
              default: () => {
                return `${escape(property.name)}`;
              }
            })}`;
          })}`;
        }
      })}`;
    }
  })}</div> <div class="w-48">${validate_component(Root, "Select").$$render($$result, { onSelectedChange: updateStatusFilter }, {}, {
    default: () => {
      return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Filter by status" }, {}, {})}`;
        }
      })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: "" }, {}, {
            default: () => {
              return `All Statuses`;
            }
          })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "ACTIVE" }, {}, {
            default: () => {
              return `Active`;
            }
          })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "PENDING" }, {}, {
            default: () => {
              return `Pending`;
            }
          })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "INACTIVE" }, {}, {
            default: () => {
              return `Inactive`;
            }
          })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "BLACKLISTED" }, {}, {
            default: () => {
              return `Blacklisted`;
            }
          })}`;
        }
      })}`;
    }
  })}</div></div></div> ${validate_component(Table, "Table.Root").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Table_header, "Table.Header").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                default: () => {
                  return `Name`;
                }
              })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                default: () => {
                  return `Email`;
                }
              })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                default: () => {
                  return `Contact Number`;
                }
              })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                default: () => {
                  return `Property`;
                }
              })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                default: () => {
                  return `Rental_unit`;
                }
              })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                default: () => {
                  return `Status`;
                }
              })} ${validate_component(Table_head, "Table.Head").$$render($$result, { class: "text-right" }, {}, {
                default: () => {
                  return `Actions`;
                }
              })}`;
            }
          })}`;
        }
      })} ${validate_component(Table_body, "Table.Body").$$render($$result, {}, {}, {
        default: () => {
          return `${each(sortedTenants, (tenant) => {
            return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
              default: () => {
                return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                  default: () => {
                    return `${escape(tenant.name)}`;
                  }
                })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                  default: () => {
                    return `${escape(tenant.email || "N/A")}`;
                  }
                })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                  default: () => {
                    return `${escape(tenant.contact_number || "N/A")}`;
                  }
                })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                  default: () => {
                    return `${tenant.lease?.location?.property?.name ? `${escape(tenant.lease.location.property.name)}` : `Not Assigned`} `;
                  }
                })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                  default: () => {
                    return `${tenant.lease?.location?.number ? `${escape(tenant.lease.location.number)}` : `Not Assigned`} `;
                  }
                })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Badge, "Badge").$$render(
                      $$result,
                      {
                        variant: tenant.tenant_status === "ACTIVE" ? "secondary" : tenant.tenant_status === "PENDING" ? "outline" : "destructive"
                      },
                      {},
                      {
                        default: () => {
                          return `${escape(tenant.tenant_status)} `;
                        }
                      }
                    )} `;
                  }
                })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, { class: "text-right" }, {}, {
                  default: () => {
                    return `<div class="flex justify-end gap-2">${validate_component(Button, "Button").$$render($$result, { size: "sm", variant: "outline" }, {}, {
                      default: () => {
                        return `Edit
                  `;
                      }
                    })} ${data.isAdminLevel ? `${validate_component(Button, "Button").$$render($$result, { size: "sm", variant: "destructive" }, {}, {
                      default: () => {
                        return `Delete
                    `;
                      }
                    })}` : ``}</div> `;
                  }
                })} `;
              }
            })}`;
          })}`;
        }
      })}`;
    }
  })}</div></div>`;
});
const defaultEmergencyContact = {
  name: "",
  relationship: "",
  phone: "",
  email: "",
  address: ""
};
const { Object: Object_1 } = globals;
const css = {
  code: '[data-error="true"]{border-color:hsl(var(--destructive)) !important;--tw-ring-color:hsl(var(--destructive)) !important;outline:none !important}.error-class.svelte-1flfrwe{border-color:hsl(var(--destructive)) !important;--tw-ring-color:hsl(var(--destructive)) !important;outline:none !important}',
  map: `{"version":3,"file":"TenantForm.svelte","sources":["TenantForm.svelte"],"sourcesContent":["<script lang=\\"ts\\">import {\\n  Select,\\n  SelectContent,\\n  SelectItem,\\n  SelectTrigger,\\n  SelectValue\\n} from \\"$lib/components/ui/select\\";\\nimport { Input } from \\"$lib/components/ui/input\\";\\nimport { Label } from \\"$lib/components/ui/label\\";\\nimport { Button } from \\"$lib/components/ui/button\\";\\nimport { Badge } from \\"$lib/components/ui/badge\\";\\nimport { createEventDispatcher } from \\"svelte\\";\\nimport { TenantStatusEnum, tenantFormSchema } from \\"./formSchema\\";\\nimport Textarea from \\"$lib/components/ui/textarea/textarea.svelte\\";\\nimport { defaultEmergencyContact } from \\"./constants\\";\\nimport * as Card from \\"$lib/components/ui/card\\";\\nimport * as Dialog from \\"$lib/components/ui/dialog\\";\\nexport let data;\\nexport let form;\\nexport let errors;\\nexport let enhance;\\nexport let constraints;\\nexport let submitting;\\nexport let editMode = false;\\nexport let tenant = void 0;\\nconst dispatch = createEventDispatcher();\\nlet showStatusDialog = false;\\nlet statusChangeReason = \\"\\";\\n$: canEdit = data.isAdminLevel || data.isStaffLevel && !editMode;\\n$: canDelete = data.isAdminLevel;\\n$: if (tenant && editMode) {\\n  $form = { ...$form, ...tenant };\\n}\\n$: tenantStatusOptions = Object.values(TenantStatusEnum.Values);\\nfunction updateTenantStatus(event) {\\n  if (event.detail) {\\n    showStatusDialog = true;\\n    $form = { ...$form, tenant_status: event.detail };\\n  }\\n}\\n$: emergencyContact = {\\n  ...defaultEmergencyContact,\\n  ...$form.emergency_contact || {},\\n  email: $form.emergency_contact?.email || \\"\\"\\n};\\nfunction getStatusColor(status) {\\n  switch (status) {\\n    case \\"ACTIVE\\":\\n      return \\"bg-green-100 text-green-800\\";\\n    case \\"PENDING\\":\\n      return \\"bg-yellow-100 text-yellow-800\\";\\n    case \\"INACTIVE\\":\\n      return \\"bg-gray-100 text-gray-800\\";\\n    case \\"BLACKLISTED\\":\\n      return \\"bg-red-100 text-red-800\\";\\n    case \\"EXPIRED\\":\\n      return \\"bg-orange-100 text-orange-800\\";\\n    case \\"TERMINATED\\":\\n      return \\"bg-red-100 text-red-800\\";\\n    default:\\n      return \\"bg-gray-100 text-gray-800\\";\\n  }\\n}\\n<\/script>\\n\\n\\n\\n<form\\n  method=\\"POST\\"\\n  action={editMode ? \\"?/update\\" : \\"?/create\\"}\\n  use:enhance\\n  class=\\"space-y-4\\"\\n  novalidate\\n>\\n  <input type=\\"hidden\\" name=\\"id\\" bind:value={$form.id} />\\n\\n  <div class=\\"grid grid-cols-1 md:grid-cols-2 gap-4\\">\\n    <div class=\\"space-y-2\\">\\n      <Label for=\\"name\\">Name</Label>\\n      <Input\\n        type=\\"text\\"\\n        name=\\"name\\"\\n      bind:value={$form.name}\\n      class=\\"w-full\\"\\n      disabled={!canEdit}\\n      data-error={$errors.name}\\n      aria-invalid={$errors.name ? 'true' : undefined}\\n      {...$constraints.name}\\n      />\\n      {#if $errors.name}\\n        <p class=\\"text-sm font-medium text-destructive\\">{$errors.name}</p>\\n      {/if}\\n    </div>\\n\\n    <div class=\\"space-y-2\\">\\n      <Label for=\\"email\\">Email</Label>\\n      <Input\\n        type=\\"email\\"\\n        name=\\"email\\"\\n      bind:value={$form.email}\\n      class=\\"w-full\\"\\n      disabled={!canEdit}\\n      data-error={$errors.email && $form.email !== undefined}\\n      aria-invalid={$errors.email ? 'true' : undefined}\\n      {...$constraints.email}\\n      />\\n      {#if $errors.email && $form.email !== undefined}\\n        <p class=\\"text-sm font-medium text-destructive\\">{$errors.email}</p>\\n      {/if}\\n    </div>\\n\\n    <div class=\\"space-y-2\\">\\n      <Label for=\\"contact_number\\">Contact Number</Label>\\n      <Input\\n        type=\\"tel\\"\\n        name=\\"contact_number\\"\\n      bind:value={$form.contact_number}\\n      class=\\"w-full\\"\\n      disabled={!canEdit}\\n      data-error={$errors.contact_number && $form.contact_number !== undefined}\\n      aria-invalid={$errors.contact_number ? 'true' : undefined}\\n      {...$constraints.contact_number}\\n      />\\n      {#if $errors.contact_number && $form.contact_number !== undefined}\\n        <p class=\\"text-sm font-medium text-destructive\\">{$errors.contact_number}</p>\\n      {/if}\\n    </div>\\n\\n    <div class=\\"space-y-2\\">\\n      <Label for=\\"tenant_status\\">Tenant Status</Label>\\n      <div class:error-class={$errors.tenant_status}>\\n        <Select \\n          on:change={updateTenantStatus} \\n          disabled={!canEdit}\\n          {...$constraints.tenant_status}\\n        >\\n          <SelectTrigger>\\n            <SelectValue>\\n              {#if $form.tenant_status}\\n                <Badge variant=\\"outline\\" class={getStatusColor($form.tenant_status)}>\\n                  {$form.tenant_status}\\n                </Badge>\\n              {:else}\\n                Select status\\n              {/if}\\n            </SelectValue>\\n          </SelectTrigger>\\n          <SelectContent>\\n            {#each tenantStatusOptions as status}\\n              <SelectItem value={status}>\\n                <Badge variant=\\"outline\\" class={getStatusColor(status)}>\\n                  {status}\\n                </Badge>\\n              </SelectItem>\\n            {/each}\\n          </SelectContent>\\n        </Select>\\n      </div>\\n      {#if $errors.tenant_status && $form.tenant_status !== undefined}\\n        <p class=\\"text-sm font-medium text-destructive\\">{$errors.tenant_status}</p>\\n      {/if}\\n    </div>\\n  </div>\\n\\n  <div class=\\"mt-6\\">\\n    <Label>Emergency Contact</Label>\\n    <Card.Root class=\\"mt-2\\">\\n      <Card.Content class=\\"grid grid-cols-1 md:grid-cols-2 gap-4 pt-6\\">\\n        <div class=\\"space-y-2\\">\\n          <Label for=\\"emergency_contact.name\\">Name</Label>\\n          <Input\\n            type=\\"text\\"\\n            name=\\"emergency_contact.name\\"\\n      bind:value={emergencyContact.name}\\n      class=\\"w-full\\"\\n            disabled={!canEdit}\\n            data-error={$errors.emergency_contact?.name && emergencyContact.name !== undefined}\\n            aria-invalid={$errors.emergency_contact?.name ? 'true' : undefined}\\n            {...$constraints.emergency_contact?.name}\\n          />\\n          {#if $errors.emergency_contact?.name && emergencyContact.name !== undefined}\\n            <p class=\\"text-sm font-medium text-destructive\\">{$errors.emergency_contact.name}</p>\\n          {/if}\\n        </div>\\n\\n        <div class=\\"space-y-2\\">\\n          <Label for=\\"emergency_contact.relationship\\">Relationship</Label>\\n          <Input\\n            type=\\"text\\"\\n            name=\\"emergency_contact.relationship\\"\\n      bind:value={emergencyContact.relationship}\\n      class=\\"w-full\\"\\n            disabled={!canEdit}\\n            data-error={$errors.emergency_contact?.relationship && emergencyContact.relationship !== undefined}\\n            aria-invalid={$errors.emergency_contact?.relationship ? 'true' : undefined}\\n            {...$constraints.emergency_contact?.relationship}\\n          />\\n          {#if $errors.emergency_contact?.relationship && emergencyContact.relationship !== undefined}\\n            <p class=\\"text-sm font-medium text-destructive\\">{$errors.emergency_contact.relationship}</p>\\n          {/if}\\n        </div>\\n\\n        <div class=\\"space-y-2\\">\\n          <Label for=\\"emergency_contact.phone\\">Phone</Label>\\n          <Input\\n            type=\\"tel\\"\\n            name=\\"emergency_contact.phone\\"\\n      bind:value={emergencyContact.phone}\\n      class=\\"w-full\\"\\n            disabled={!canEdit}\\n            data-error={$errors.emergency_contact?.phone && emergencyContact.phone !== undefined}\\n            aria-invalid={$errors.emergency_contact?.phone ? 'true' : undefined}\\n            {...$constraints.emergency_contact?.phone}\\n          />\\n          {#if $errors.emergency_contact?.phone && emergencyContact.phone !== undefined}\\n            <p class=\\"text-sm font-medium text-destructive\\">{$errors.emergency_contact.phone}</p>\\n          {/if}\\n        </div>\\n\\n        <div class=\\"space-y-2\\">\\n          <Label for=\\"emergency_contact.email\\">Email</Label>\\n          <Input\\n            type=\\"email\\"\\n            name=\\"emergency_contact.email\\"\\n      bind:value={emergencyContact.email}\\n      class=\\"w-full\\"\\n            disabled={!canEdit}\\n            data-error={$errors.emergency_contact?.email && emergencyContact.email !== undefined}\\n            aria-invalid={$errors.emergency_contact?.email ? 'true' : undefined}\\n            {...$constraints.emergency_contact?.email}\\n          />\\n          {#if $errors.emergency_contact?.email && emergencyContact.email !== undefined}\\n            <p class=\\"text-sm font-medium text-destructive\\">{$errors.emergency_contact.email}</p>\\n          {/if}\\n        </div>\\n\\n        <div class=\\"col-span-2 space-y-2\\">\\n          <Label for=\\"emergency_contact.address\\">Address</Label>\\n          <Textarea\\n            name=\\"emergency_contact.address\\"\\n      bind:value={emergencyContact.address}\\n      class=\\"w-full\\"\\n            disabled={!canEdit}\\n            data-error={$errors.emergency_contact?.address && emergencyContact.address !== undefined}\\n            aria-invalid={$errors.emergency_contact?.address ? 'true' : undefined}\\n            {...$constraints.emergency_contact?.address}\\n          />\\n          {#if $errors.emergency_contact?.address && emergencyContact.address !== undefined}\\n            <p class=\\"text-sm font-medium text-destructive\\">{$errors.emergency_contact.address}</p>\\n          {/if}\\n        </div>\\n      </Card.Content>\\n    </Card.Root>\\n  </div>\\n\\n  <div class=\\"flex justify-end space-x-2 pt-4\\">\\n    <Button type=\\"button\\" variant=\\"outline\\" on:click={() => dispatch('cancel')}>\\n      Cancel\\n    </Button>\\n    <Button type=\\"submit\\" disabled={!canEdit || $submitting}>\\n      {#if $submitting}\\n        Saving...\\n      {:else}\\n        {editMode ? 'Update' : 'Create'} Tenant\\n      {/if}\\n    </Button>\\n  </div>\\n</form>\\n\\n<Dialog.Root bind:open={showStatusDialog}>\\n  <Dialog.Content>\\n    <Dialog.Header>\\n      <Dialog.Title>Change Status</Dialog.Title>\\n      <Dialog.Description>\\n        Please provide a reason for changing the tenant's status.\\n      </Dialog.Description>\\n    </Dialog.Header>\\n\\n    <div class=\\"py-4\\">\\n      <Label for=\\"status_reason\\">Reason</Label>\\n      <Textarea\\n        id=\\"status_reason\\"\\n        bind:value={statusChangeReason}\\n        placeholder=\\"Enter the reason for status change\\"\\n      />\\n    </div>\\n\\n    <Dialog.Footer>\\n      <Button type=\\"button\\" variant=\\"outline\\" on:click={() => showStatusDialog = false}>\\n        Cancel\\n      </Button>\\n      <Button type=\\"button\\" on:click={() => {\\n        $form = {\\n          ...$form,\\n          status_change_reason: statusChangeReason\\n        };\\n        showStatusDialog = false;\\n        statusChangeReason = '';\\n      }} disabled={!statusChangeReason}>\\n        Confirm Change\\n      </Button>\\n    </Dialog.Footer>\\n  </Dialog.Content>\\n</Dialog.Root>\\n\\n<style>\\n  :global([data-error=\\"true\\"]) {\\n    border-color: hsl(var(--destructive)) !important;\\n    --tw-ring-color: hsl(var(--destructive)) !important;\\n    outline: none !important;\\n  }\\n  .error-class {\\n    border-color: hsl(var(--destructive)) !important;\\n    --tw-ring-color: hsl(var(--destructive)) !important;\\n    outline: none !important;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAkTU,mBAAqB,CAC3B,YAAY,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAAC,UAAU,CAChD,eAAe,CAAE,wBAAwB,UAAU,CACnD,OAAO,CAAE,IAAI,CAAC,UAChB,CACA,2BAAa,CACX,YAAY,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAAC,UAAU,CAChD,eAAe,CAAE,wBAAwB,UAAU,CACnD,OAAO,CAAE,IAAI,CAAC,UAChB"}`
};
function getStatusColor(status) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800";
    case "BLACKLISTED":
      return "bg-red-100 text-red-800";
    case "EXPIRED":
      return "bg-orange-100 text-orange-800";
    case "TERMINATED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
const TenantForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let canEdit;
  let tenantStatusOptions;
  let emergencyContact;
  let $form, $$unsubscribe_form;
  let $errors, $$unsubscribe_errors;
  let $constraints, $$unsubscribe_constraints;
  let $submitting, $$unsubscribe_submitting;
  let { data } = $$props;
  let { form } = $$props;
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  let { errors } = $$props;
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  let { enhance } = $$props;
  let { constraints } = $$props;
  $$unsubscribe_constraints = subscribe(constraints, (value) => $constraints = value);
  let { submitting } = $$props;
  $$unsubscribe_submitting = subscribe(submitting, (value) => $submitting = value);
  let { editMode = false } = $$props;
  let { tenant = void 0 } = $$props;
  createEventDispatcher();
  let showStatusDialog = false;
  let statusChangeReason = "";
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
  if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
  if ($$props.enhance === void 0 && $$bindings.enhance && enhance !== void 0) $$bindings.enhance(enhance);
  if ($$props.constraints === void 0 && $$bindings.constraints && constraints !== void 0) $$bindings.constraints(constraints);
  if ($$props.submitting === void 0 && $$bindings.submitting && submitting !== void 0) $$bindings.submitting(submitting);
  if ($$props.editMode === void 0 && $$bindings.editMode && editMode !== void 0) $$bindings.editMode(editMode);
  if ($$props.tenant === void 0 && $$bindings.tenant && tenant !== void 0) $$bindings.tenant(tenant);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    canEdit = data.isAdminLevel || data.isStaffLevel && !editMode;
    data.isAdminLevel;
    {
      if (tenant && editMode) {
        set_store_value(form, $form = { ...$form, ...tenant }, $form);
      }
    }
    tenantStatusOptions = Object.values(TenantStatusEnum.Values);
    emergencyContact = {
      ...defaultEmergencyContact,
      ...$form.emergency_contact || {},
      email: $form.emergency_contact?.email || ""
    };
    $$rendered = `<form method="POST"${add_attribute("action", editMode ? "?/update" : "?/create", 0)} class="space-y-4" novalidate><input type="hidden" name="id"${add_attribute("value", $form.id, 0)}> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "name" }, {}, {
      default: () => {
        return `Name`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object_1.assign(
        {},
        { type: "text" },
        { name: "name" },
        { class: "w-full" },
        { disabled: !canEdit },
        { "data-error": $errors.name },
        {
          "aria-invalid": $errors.name ? "true" : void 0
        },
        $constraints.name,
        { value: $form.name }
      ),
      {
        value: ($$value) => {
          $form.name = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.name ? `<p class="text-sm font-medium text-destructive">${escape($errors.name)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "email" }, {}, {
      default: () => {
        return `Email`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object_1.assign(
        {},
        { type: "email" },
        { name: "email" },
        { class: "w-full" },
        { disabled: !canEdit },
        {
          "data-error": $errors.email && $form.email !== void 0
        },
        {
          "aria-invalid": $errors.email ? "true" : void 0
        },
        $constraints.email,
        { value: $form.email }
      ),
      {
        value: ($$value) => {
          $form.email = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.email && $form.email !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.email)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "contact_number" }, {}, {
      default: () => {
        return `Contact Number`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object_1.assign(
        {},
        { type: "tel" },
        { name: "contact_number" },
        { class: "w-full" },
        { disabled: !canEdit },
        {
          "data-error": $errors.contact_number && $form.contact_number !== void 0
        },
        {
          "aria-invalid": $errors.contact_number ? "true" : void 0
        },
        $constraints.contact_number,
        { value: $form.contact_number }
      ),
      {
        value: ($$value) => {
          $form.contact_number = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.contact_number && $form.contact_number !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.contact_number)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "tenant_status" }, {}, {
      default: () => {
        return `Tenant Status`;
      }
    })} <div class="${["svelte-1flfrwe", $errors.tenant_status ? "error-class" : ""].join(" ").trim()}">${validate_component(Root, "Select").$$render($$result, Object_1.assign({}, { disabled: !canEdit }, $constraints.tenant_status), {}, {
      default: () => {
        return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Value, "SelectValue").$$render($$result, {}, {}, {
              default: () => {
                return `${$form.tenant_status ? `${validate_component(Badge, "Badge").$$render(
                  $$result,
                  {
                    variant: "outline",
                    class: getStatusColor($form.tenant_status)
                  },
                  {},
                  {
                    default: () => {
                      return `${escape($form.tenant_status)}`;
                    }
                  }
                )}` : `Select status`}`;
              }
            })}`;
          }
        })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
          default: () => {
            return `${each(tenantStatusOptions, (status) => {
              return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: status }, {}, {
                default: () => {
                  return `${validate_component(Badge, "Badge").$$render(
                    $$result,
                    {
                      variant: "outline",
                      class: getStatusColor(status)
                    },
                    {},
                    {
                      default: () => {
                        return `${escape(status)} `;
                      }
                    }
                  )} `;
                }
              })}`;
            })}`;
          }
        })}`;
      }
    })}</div> ${$errors.tenant_status && $form.tenant_status !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.tenant_status)}</p>` : ``}</div></div> <div class="mt-6">${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Emergency Contact`;
      }
    })} ${validate_component(Card, "Card.Root").$$render($$result, { class: "mt-2" }, {}, {
      default: () => {
        return `${validate_component(Card_content, "Card.Content").$$render(
          $$result,
          {
            class: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-6"
          },
          {},
          {
            default: () => {
              return `<div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "emergency_contact.name" }, {}, {
                default: () => {
                  return `Name`;
                }
              })} ${validate_component(Input, "Input").$$render(
                $$result,
                Object_1.assign(
                  {},
                  { type: "text" },
                  { name: "emergency_contact.name" },
                  { class: "w-full" },
                  { disabled: !canEdit },
                  {
                    "data-error": $errors.emergency_contact?.name && emergencyContact.name !== void 0
                  },
                  {
                    "aria-invalid": $errors.emergency_contact?.name ? "true" : void 0
                  },
                  $constraints.emergency_contact?.name,
                  { value: emergencyContact.name }
                ),
                {
                  value: ($$value) => {
                    emergencyContact.name = $$value;
                    $$settled = false;
                  }
                },
                {}
              )} ${$errors.emergency_contact?.name && emergencyContact.name !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.emergency_contact.name)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "emergency_contact.relationship" }, {}, {
                default: () => {
                  return `Relationship`;
                }
              })} ${validate_component(Input, "Input").$$render(
                $$result,
                Object_1.assign(
                  {},
                  { type: "text" },
                  { name: "emergency_contact.relationship" },
                  { class: "w-full" },
                  { disabled: !canEdit },
                  {
                    "data-error": $errors.emergency_contact?.relationship && emergencyContact.relationship !== void 0
                  },
                  {
                    "aria-invalid": $errors.emergency_contact?.relationship ? "true" : void 0
                  },
                  $constraints.emergency_contact?.relationship,
                  { value: emergencyContact.relationship }
                ),
                {
                  value: ($$value) => {
                    emergencyContact.relationship = $$value;
                    $$settled = false;
                  }
                },
                {}
              )} ${$errors.emergency_contact?.relationship && emergencyContact.relationship !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.emergency_contact.relationship)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "emergency_contact.phone" }, {}, {
                default: () => {
                  return `Phone`;
                }
              })} ${validate_component(Input, "Input").$$render(
                $$result,
                Object_1.assign(
                  {},
                  { type: "tel" },
                  { name: "emergency_contact.phone" },
                  { class: "w-full" },
                  { disabled: !canEdit },
                  {
                    "data-error": $errors.emergency_contact?.phone && emergencyContact.phone !== void 0
                  },
                  {
                    "aria-invalid": $errors.emergency_contact?.phone ? "true" : void 0
                  },
                  $constraints.emergency_contact?.phone,
                  { value: emergencyContact.phone }
                ),
                {
                  value: ($$value) => {
                    emergencyContact.phone = $$value;
                    $$settled = false;
                  }
                },
                {}
              )} ${$errors.emergency_contact?.phone && emergencyContact.phone !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.emergency_contact.phone)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "emergency_contact.email" }, {}, {
                default: () => {
                  return `Email`;
                }
              })} ${validate_component(Input, "Input").$$render(
                $$result,
                Object_1.assign(
                  {},
                  { type: "email" },
                  { name: "emergency_contact.email" },
                  { class: "w-full" },
                  { disabled: !canEdit },
                  {
                    "data-error": $errors.emergency_contact?.email && emergencyContact.email !== void 0
                  },
                  {
                    "aria-invalid": $errors.emergency_contact?.email ? "true" : void 0
                  },
                  $constraints.emergency_contact?.email,
                  { value: emergencyContact.email }
                ),
                {
                  value: ($$value) => {
                    emergencyContact.email = $$value;
                    $$settled = false;
                  }
                },
                {}
              )} ${$errors.emergency_contact?.email && emergencyContact.email !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.emergency_contact.email)}</p>` : ``}</div> <div class="col-span-2 space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "emergency_contact.address" }, {}, {
                default: () => {
                  return `Address`;
                }
              })} ${validate_component(Textarea, "Textarea").$$render(
                $$result,
                Object_1.assign(
                  {},
                  { name: "emergency_contact.address" },
                  { class: "w-full" },
                  { disabled: !canEdit },
                  {
                    "data-error": $errors.emergency_contact?.address && emergencyContact.address !== void 0
                  },
                  {
                    "aria-invalid": $errors.emergency_contact?.address ? "true" : void 0
                  },
                  $constraints.emergency_contact?.address,
                  { value: emergencyContact.address }
                ),
                {
                  value: ($$value) => {
                    emergencyContact.address = $$value;
                    $$settled = false;
                  }
                },
                {}
              )} ${$errors.emergency_contact?.address && emergencyContact.address !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.emergency_contact.address)}</p>` : ``}</div>`;
            }
          }
        )}`;
      }
    })}</div> <div class="flex justify-end space-x-2 pt-4">${validate_component(Button, "Button").$$render($$result, { type: "button", variant: "outline" }, {}, {
      default: () => {
        return `Cancel`;
      }
    })} ${validate_component(Button, "Button").$$render(
      $$result,
      {
        type: "submit",
        disabled: !canEdit || $submitting
      },
      {},
      {
        default: () => {
          return `${$submitting ? `Saving...` : `${escape(editMode ? "Update" : "Create")} Tenant`}`;
        }
      }
    )}</div></form> ${validate_component(Root$1, "Dialog.Root").$$render(
      $$result,
      { open: showStatusDialog },
      {
        open: ($$value) => {
          showStatusDialog = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${validate_component(Dialog_content, "Dialog.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Dialog_header, "Dialog.Header").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Dialog_title, "Dialog.Title").$$render($$result, {}, {}, {
                    default: () => {
                      return `Change Status`;
                    }
                  })} ${validate_component(Dialog_description, "Dialog.Description").$$render($$result, {}, {}, {
                    default: () => {
                      return `Please provide a reason for changing the tenant&#39;s status.`;
                    }
                  })}`;
                }
              })} <div class="py-4">${validate_component(Label, "Label").$$render($$result, { for: "status_reason" }, {}, {
                default: () => {
                  return `Reason`;
                }
              })} ${validate_component(Textarea, "Textarea").$$render(
                $$result,
                {
                  id: "status_reason",
                  placeholder: "Enter the reason for status change",
                  value: statusChangeReason
                },
                {
                  value: ($$value) => {
                    statusChangeReason = $$value;
                    $$settled = false;
                  }
                },
                {}
              )}</div> ${validate_component(Dialog_footer, "Dialog.Footer").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Button, "Button").$$render($$result, { type: "button", variant: "outline" }, {}, {
                    default: () => {
                      return `Cancel`;
                    }
                  })} ${validate_component(Button, "Button").$$render(
                    $$result,
                    {
                      type: "button",
                      disabled: !statusChangeReason
                    },
                    {},
                    {
                      default: () => {
                        return `Confirm Change`;
                      }
                    }
                  )}`;
                }
              })}`;
            }
          })}`;
        }
      }
    )}`;
  } while (!$$settled);
  $$unsubscribe_form();
  $$unsubscribe_errors();
  $$unsubscribe_constraints();
  $$unsubscribe_submitting();
  return $$rendered;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $form, $$unsubscribe_form;
  let { data } = $$props;
  const defaultEmergencyContact2 = {
    name: "",
    relationship: "",
    phone: "",
    email: null,
    address: ""
  };
  let editMode = false;
  let selectedTenant;
  const { form, enhance, errors, constraints, submitting } = superForm(data.form, {
    id: "tenant-form",
    validators: zodClient(tenantFormSchema),
    validationMethod: "onblur",
    dataType: "json",
    delayMs: 10,
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error("Form validation errors:", result.error);
    },
    onResult: ({ result }) => {
      if (result.type === "success") {
        selectedTenant = void 0;
        editMode = false;
        handleCreate();
      }
    }
  });
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  function handleCreate() {
    selectedTenant = void 0;
    editMode = false;
    set_store_value(
      form,
      $form = {
        id: 0,
        name: "",
        contact_number: null,
        email: null,
        auth_id: null,
        tenant_status: "PENDING",
        created_by: data.profile?.id ?? null,
        emergency_contact: defaultEmergencyContact2
      },
      $form
    );
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$unsubscribe_form();
  return `<div class="container mx-auto p-4 flex">${validate_component(TenantList, "TenantList").$$render($$result, { data }, {}, {})} <div class="w-1/3 pl-4">${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, {}, {}, {
            default: () => {
              return `${escape(editMode ? "Edit" : "Add")} Tenant`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(TenantForm, "TenantForm").$$render(
            $$result,
            {
              data,
              editMode,
              form,
              errors,
              enhance,
              constraints,
              submitting,
              tenant: selectedTenant
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
