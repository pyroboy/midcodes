import { c as create_ssr_component, s as subscribe, f as createEventDispatcher, a as add_attribute, v as validate_component, b as each, e as escape, t as set_store_value } from "../../../../chunks/ssr.js";
import { B as Button } from "../../../../chunks/button.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index7.js";
import { l as locationStatusEnum, r as rental_unitSchema } from "../../../../chunks/formSchema8.js";
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
const css = {
  code: '.select-error{border-color:hsl(var(--destructive)) !important;--tw-ring-color:hsl(var(--destructive)) !important}[data-error="true"]{border-color:hsl(var(--destructive)) !important;--tw-ring-color:hsl(var(--destructive)) !important;outline:none !important}.input-error{border-color:hsl(var(--destructive));--tw-ring-color:hsl(var(--destructive))}',
  map: `{"version":3,"file":"Rental_UnitForm.svelte","sources":["Rental_UnitForm.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Button from \\"$lib/components/ui/button/button.svelte\\";\\nimport Input from \\"$lib/components/ui/input/input.svelte\\";\\nimport Label from \\"$lib/components/ui/label/label.svelte\\";\\nimport * as Select from \\"$lib/components/ui/select\\";\\nimport { createEventDispatcher } from \\"svelte\\";\\nimport { locationStatusEnum } from \\"./formSchema\\";\\nexport let data;\\nexport let editMode = false;\\nexport let form;\\nexport let errors;\\nexport let enhance;\\nexport let constraints;\\nconst dispatch = createEventDispatcher();\\nconst rental_unitTypes = [\\"SINGLE\\", \\"DOUBLE\\", \\"TRIPLE\\", \\"QUAD\\", \\"SUITE\\"];\\nfunction handleFormSubmit(event) {\\n  event.preventDefault();\\n  console.log(\\"[DEBUG] Form submitted with data:\\", $form);\\n  dispatch(\\"submit\\", $form);\\n}\\nfunction handlePropertyChange(selected) {\\n  const s = selected;\\n  if (s?.value) {\\n    const propertyId = parseInt(s.value, 10);\\n    if (!isNaN(propertyId)) {\\n      const selectedProperty = data.properties.find((p) => p.id === propertyId);\\n      $form = {\\n        ...$form,\\n        property_id: propertyId,\\n        floor_id: 0,\\n        property: {\\n          id: selectedProperty?.id || 0,\\n          name: selectedProperty?.name || \\"\\"\\n        }\\n      };\\n      console.log(\\"[DEBUG] Property selected:\\", selectedProperty);\\n    }\\n  }\\n}\\nfunction handleFloorChange(selected) {\\n  const s = selected;\\n  if (s?.value) {\\n    const floorId = parseInt(s.value, 10);\\n    if (!isNaN(floorId)) {\\n      $form = {\\n        ...$form,\\n        floor_id: floorId\\n      };\\n    }\\n  }\\n}\\nfunction handleTypeChange(selected) {\\n  const s = selected;\\n  if (s?.value) {\\n    $form = {\\n      ...$form,\\n      type: s.value\\n    };\\n  }\\n}\\nfunction handleStatusChange(selected) {\\n  const s = selected;\\n  if (s?.value) {\\n    $form = {\\n      ...$form,\\n      rental_unit_status: s.value\\n    };\\n  }\\n}\\n$: availableFloors = data.floors;\\n$: if ($form.property_id) {\\n  availableFloors = data.floors.filter((f) => f.property_id === Number($form.property_id));\\n  if (availableFloors.length === 0) {\\n    console.warn(\\"No floors found for property:\\", $form.property_id);\\n  }\\n}\\n$: console.log(\\"Available floors:\\", availableFloors);\\nfunction getFloorLabel(floorId) {\\n  const floor = data.floors.find((f) => f.id === floorId);\\n  return floor ? \`Floor \${floor.floor_number}\${floor.wing ? \` Wing \${floor.wing}\` : \\"\\"}\` : \\"\\";\\n}\\nfunction handleCancel() {\\n  dispatch(\\"cancel\\");\\n}\\nlet amenityInput = \\"\\";\\nfunction addAmenity() {\\n  if (amenityInput.trim()) {\\n    $form = {\\n      ...$form,\\n      amenities: [...$form.amenities || [], amenityInput.trim()]\\n    };\\n    amenityInput = \\"\\";\\n  }\\n}\\nfunction removeAmenity(index) {\\n  if ($form.amenities) {\\n    $form = {\\n      ...$form,\\n      amenities: $form.amenities.filter((_, i) => i !== index)\\n    };\\n  }\\n}\\n<\/script>\\n\\n<form\\n  method=\\"POST\\"\\n  action={editMode ? \\"?/update\\" : \\"?/create\\"}\\n  use:enhance\\n  class=\\"space-y-4\\"\\n  novalidate\\n>\\n  {#if editMode && $form.id}\\n    <input type=\\"hidden\\" name=\\"id\\" bind:value={$form.id} />\\n  {/if}\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"property_id\\">Property</Label>\\n    <Select.Root    \\n      selected={{ \\n        value: $form.property_id?.toString() || '', \\n        label: data.properties.find(p => p.id === $form.property_id)?.name || 'Select a property' \\n      }}\\n      onSelectedChange={handlePropertyChange}\\n    >\\n      <Select.Trigger data-error={$errors.property_id && $form.property_id !== undefined}>\\n        <Select.Value placeholder=\\"Select a property\\" />\\n      </Select.Trigger>\\n      <Select.Content>\\n        {#each data.properties as property}\\n          <Select.Item value={property.id.toString()}>\\n            {property.name}\\n          </Select.Item>\\n        {/each}\\n      </Select.Content>\\n    </Select.Root>\\n    {#if $errors.property_id && $form.property_id !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.property_id}</p>\\n    {/if}\\n  </div>\\n\\n  \\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"floor_id\\">Floor</Label>\\n    <Select.Root\\n      selected={{\\n        value: $form.floor_id?.toString() || '',\\n        label: getFloorLabel($form.floor_id) || 'Select a floor'\\n      }}\\n      onSelectedChange={handleFloorChange}\\n    >\\n      <Select.Trigger\\n        data-error={$errors.floor_id && $form.floor_id !== undefined}\\n        {...$constraints.floor_id}\\n        disabled={!$form.property_id}\\n      >\\n        <Select.Value placeholder={$form.property_id ? 'Select a floor' : 'Select a property first'} />\\n      </Select.Trigger>\\n      <Select.Content>\\n        {#if $form.property_id}\\n          {#each availableFloors as floor}\\n            <Select.Item value={floor.id.toString()}>\\n              Floor {floor.floor_number}\\n              {#if floor.wing}\\n                Wing {floor.wing}\\n              {/if}\\n            </Select.Item>\\n          {/each}\\n        {:else}\\n          <Select.Item value=\\"\\" disabled>\\n            Please select a property first\\n          </Select.Item>\\n        {/if}\\n      </Select.Content>\\n    </Select.Root>\\n    {#if $errors.floor_id && $form.floor_id !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.floor_id}</p>\\n    {/if}\\n  </div>\\n\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"name\\">Name</Label>\\n    <Input \\n      id=\\"name\\" \\n      name=\\"name\\" \\n      bind:value={$form.name}\\n      class=\\"w-full\\"\\n      data-error={$errors.name && $form.name !== undefined}\\n      aria-invalid={$errors.name ? 'true' : undefined}\\n      {...$constraints.name}\\n    />\\n    {#if $errors.name && $form.name !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.name}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"number\\">Number</Label>\\n    <Input \\n      type=\\"number\\" \\n      id=\\"number\\" \\n      name=\\"number\\" \\n      min=\\"1\\"\\n      bind:value={$form.number}\\n      class=\\"w-full\\"\\n      data-error={$errors.number && $form.number !== undefined}\\n      aria-invalid={$errors.number ? 'true' : undefined}\\n      {...$constraints.number}\\n    />\\n    {#if $errors.number && $form.number !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.number}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"type\\">Type</Label>\\n    <Select.Root    \\n      selected={{ \\n        value: $form.type || '', \\n        label: $form.type || 'Select a type' \\n      }}\\n      onSelectedChange={handleTypeChange}\\n    >\\n      <Select.Trigger \\n        data-error={$errors.type && $form.type !== undefined}\\n        {...$constraints.type}\\n      >\\n        <Select.Value placeholder=\\"Select a type\\" />\\n      </Select.Trigger>\\n      <Select.Content>\\n        {#each rental_unitTypes as type}\\n          <Select.Item value={type}>\\n            {type}\\n          </Select.Item>\\n        {/each}\\n      </Select.Content>\\n    </Select.Root>\\n    {#if $errors.type && $form.type !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.type}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"capacity\\">Capacity</Label>\\n    <Input \\n      type=\\"number\\" \\n      id=\\"capacity\\" \\n      name=\\"capacity\\" \\n      min=\\"1\\"\\n      bind:value={$form.capacity}\\n      class=\\"w-full\\"\\n      data-error={$errors.capacity && $form.capacity !== undefined}\\n      aria-invalid={$errors.capacity ? 'true' : undefined}\\n      {...$constraints.capacity}\\n    />\\n    {#if $errors.capacity && $form.capacity !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.capacity}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"base_rate\\">Base Rate</Label>\\n    <Input \\n      type=\\"number\\" \\n      id=\\"base_rate\\" \\n      name=\\"base_rate\\" \\n      min=\\"0\\"\\n      bind:value={$form.base_rate}\\n      class=\\"w-full\\"\\n      data-error={$errors.base_rate && $form.base_rate !== undefined}\\n      aria-invalid={$errors.base_rate ? 'true' : undefined}\\n      {...$constraints.base_rate}\\n    />\\n    {#if $errors.base_rate && $form.base_rate !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.base_rate}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label for=\\"rental_unit_status\\">Status</Label>\\n    <Select.Root    \\n      selected={{ \\n        value: $form.rental_unit_status || '', \\n        label: $form.rental_unit_status || 'Select a status' \\n      }}\\n      onSelectedChange={handleStatusChange}\\n    >\\n      <Select.Trigger \\n        data-error={$errors.rental_unit_status && $form.rental_unit_status !== undefined}\\n        {...$constraints.rental_unit_status}\\n      >\\n        <Select.Value placeholder=\\"Select a status\\" />\\n      </Select.Trigger>\\n      <Select.Content>\\n        {#each locationStatusEnum.options as status}\\n          <Select.Item value={status}>\\n            {status}\\n          </Select.Item>\\n        {/each}\\n      </Select.Content>\\n    </Select.Root>\\n    {#if $errors.rental_unit_status && $form.rental_unit_status !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.rental_unit_status}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"space-y-2\\">\\n    <Label>Amenities</Label>\\n    <div class=\\"flex gap-2\\">\\n      <Input\\n        type=\\"text\\"\\n        bind:value={amenityInput}\\n        placeholder=\\"Add amenity\\"\\n        on:keydown={(e) => {\\n          if (e.key === 'Enter') {\\n            e.preventDefault();\\n            addAmenity();\\n          }\\n        }}\\n      />\\n      <Button type=\\"button\\" variant=\\"secondary\\" on:click={addAmenity}>Add</Button>\\n    </div>\\n    {#if $form.amenities?.length}\\n      <div class=\\"flex flex-wrap gap-2 mt-2\\">\\n        {#each $form.amenities as amenity, i}\\n          <div class=\\"flex items-center gap-1 bg-secondary/50 p-1 rounded\\">\\n            <span>{amenity}</span>\\n            <button \\n              type=\\"button\\"\\n              class=\\"text-sm hover:text-destructive\\"\\n              on:click={() => removeAmenity(i)}\\n            >\\n              ×\\n            </button>\\n          </div>\\n        {/each}\\n      </div>\\n    {/if}\\n    {#if $errors.amenities && $form.amenities !== undefined}\\n      <p class=\\"text-sm font-medium text-destructive\\">{$errors.amenities}</p>\\n    {/if}\\n  </div>\\n\\n  <div class=\\"flex justify-end space-x-2\\">\\n    <Button type=\\"submit\\">\\n      {editMode ? 'Update' : 'Add'} Rental_unit\\n    </Button>\\n    {#if editMode}\\n      <Button type=\\"button\\" variant=\\"destructive\\" on:click={handleCancel}>\\n        Cancel\\n      </Button>\\n    {/if}\\n  </div>\\n</form>\\n\\n<style>\\n  :global(.select-error) {\\n    border-color: hsl(var(--destructive)) !important;\\n    --tw-ring-color: hsl(var(--destructive)) !important;\\n  }\\n\\n  :global([data-error=\\"true\\"]) {\\n    border-color: hsl(var(--destructive)) !important;\\n    --tw-ring-color: hsl(var(--destructive)) !important;\\n    outline: none !important;\\n  }\\n  \\n  :global(.input-error) {\\n    border-color: hsl(var(--destructive));\\n    --tw-ring-color: hsl(var(--destructive));\\n  }\\n</style>\\n"],"names":[],"mappings":"AAmWU,aAAe,CACrB,YAAY,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAAC,UAAU,CAChD,eAAe,CAAE,wBAAwB,UAC3C,CAEQ,mBAAqB,CAC3B,YAAY,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAAC,UAAU,CAChD,eAAe,CAAE,wBAAwB,UAAU,CACnD,OAAO,CAAE,IAAI,CAAC,UAChB,CAEQ,YAAc,CACpB,YAAY,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CACrC,eAAe,CAAE,uBACnB"}`
};
const Rental_UnitForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let availableFloors;
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
  const rental_unitTypes = ["SINGLE", "DOUBLE", "TRIPLE", "QUAD", "SUITE"];
  function handlePropertyChange(selected) {
    const s = selected;
    if (s?.value) {
      const propertyId = parseInt(s.value, 10);
      if (!isNaN(propertyId)) {
        const selectedProperty = data.properties.find((p) => p.id === propertyId);
        set_store_value(
          form,
          $form = {
            ...$form,
            property_id: propertyId,
            floor_id: 0,
            property: {
              id: selectedProperty?.id || 0,
              name: selectedProperty?.name || ""
            }
          },
          $form
        );
        console.log("[DEBUG] Property selected:", selectedProperty);
      }
    }
  }
  function handleFloorChange(selected) {
    const s = selected;
    if (s?.value) {
      const floorId = parseInt(s.value, 10);
      if (!isNaN(floorId)) {
        set_store_value(form, $form = { ...$form, floor_id: floorId }, $form);
      }
    }
  }
  function handleTypeChange(selected) {
    const s = selected;
    if (s?.value) {
      set_store_value(form, $form = { ...$form, type: s.value }, $form);
    }
  }
  function handleStatusChange(selected) {
    const s = selected;
    if (s?.value) {
      set_store_value(form, $form = { ...$form, rental_unit_status: s.value }, $form);
    }
  }
  function getFloorLabel(floorId) {
    const floor = data.floors.find((f) => f.id === floorId);
    return floor ? `Floor ${floor.floor_number}${floor.wing ? ` Wing ${floor.wing}` : ""}` : "";
  }
  let amenityInput = "";
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
    availableFloors = data.floors;
    {
      if ($form.property_id) {
        availableFloors = data.floors.filter((f) => f.property_id === Number($form.property_id));
        if (availableFloors.length === 0) {
          console.warn("No floors found for property:", $form.property_id);
        }
      }
    }
    {
      console.log("Available floors:", availableFloors);
    }
    $$rendered = `<form method="POST"${add_attribute("action", editMode ? "?/update" : "?/create", 0)} class="space-y-4" novalidate>${editMode && $form.id ? `<input type="hidden" name="id"${add_attribute("value", $form.id, 0)}>` : ``} <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "property_id" }, {}, {
      default: () => {
        return `Property`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
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
          return `${validate_component(Select_trigger, "Select.Trigger").$$render(
            $$result,
            {
              "data-error": $errors.property_id && $form.property_id !== void 0
            },
            {},
            {
              default: () => {
                return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a property" }, {}, {})}`;
              }
            }
          )} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
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
    )} ${$errors.property_id && $form.property_id !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.property_id)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "floor_id" }, {}, {
      default: () => {
        return `Floor`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: $form.floor_id?.toString() || "",
          label: getFloorLabel($form.floor_id) || "Select a floor"
        },
        onSelectedChange: handleFloorChange
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render(
            $$result,
            Object.assign(
              {},
              {
                "data-error": $errors.floor_id && $form.floor_id !== void 0
              },
              $constraints.floor_id,
              { disabled: !$form.property_id }
            ),
            {},
            {
              default: () => {
                return `${validate_component(Value, "Select.Value").$$render(
                  $$result,
                  {
                    placeholder: $form.property_id ? "Select a floor" : "Select a property first"
                  },
                  {},
                  {}
                )}`;
              }
            }
          )} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${$form.property_id ? `${each(availableFloors, (floor) => {
                return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: floor.id.toString() }, {}, {
                  default: () => {
                    return `Floor ${escape(floor.floor_number)} ${floor.wing ? `Wing ${escape(floor.wing)}` : ``} `;
                  }
                })}`;
              })}` : `${validate_component(Select_item, "Select.Item").$$render($$result, { value: "", disabled: true }, {}, {
                default: () => {
                  return `Please select a property first`;
                }
              })}`}`;
            }
          })}`;
        }
      }
    )} ${$errors.floor_id && $form.floor_id !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.floor_id)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "name" }, {}, {
      default: () => {
        return `Name`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object.assign(
        {},
        { id: "name" },
        { name: "name" },
        { class: "w-full" },
        {
          "data-error": $errors.name && $form.name !== void 0
        },
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
    )} ${$errors.name && $form.name !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.name)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "number" }, {}, {
      default: () => {
        return `Number`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object.assign(
        {},
        { type: "number" },
        { id: "number" },
        { name: "number" },
        { min: "1" },
        { class: "w-full" },
        {
          "data-error": $errors.number && $form.number !== void 0
        },
        {
          "aria-invalid": $errors.number ? "true" : void 0
        },
        $constraints.number,
        { value: $form.number }
      ),
      {
        value: ($$value) => {
          $form.number = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.number && $form.number !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.number)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "type" }, {}, {
      default: () => {
        return `Type`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: $form.type || "",
          label: $form.type || "Select a type"
        },
        onSelectedChange: handleTypeChange
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render(
            $$result,
            Object.assign(
              {},
              {
                "data-error": $errors.type && $form.type !== void 0
              },
              $constraints.type
            ),
            {},
            {
              default: () => {
                return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a type" }, {}, {})}`;
              }
            }
          )} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${each(rental_unitTypes, (type) => {
                return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: type }, {}, {
                  default: () => {
                    return `${escape(type)} `;
                  }
                })}`;
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.type && $form.type !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.type)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "capacity" }, {}, {
      default: () => {
        return `Capacity`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object.assign(
        {},
        { type: "number" },
        { id: "capacity" },
        { name: "capacity" },
        { min: "1" },
        { class: "w-full" },
        {
          "data-error": $errors.capacity && $form.capacity !== void 0
        },
        {
          "aria-invalid": $errors.capacity ? "true" : void 0
        },
        $constraints.capacity,
        { value: $form.capacity }
      ),
      {
        value: ($$value) => {
          $form.capacity = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.capacity && $form.capacity !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.capacity)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "base_rate" }, {}, {
      default: () => {
        return `Base Rate`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      Object.assign(
        {},
        { type: "number" },
        { id: "base_rate" },
        { name: "base_rate" },
        { min: "0" },
        { class: "w-full" },
        {
          "data-error": $errors.base_rate && $form.base_rate !== void 0
        },
        {
          "aria-invalid": $errors.base_rate ? "true" : void 0
        },
        $constraints.base_rate,
        { value: $form.base_rate }
      ),
      {
        value: ($$value) => {
          $form.base_rate = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.base_rate && $form.base_rate !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.base_rate)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "rental_unit_status" }, {}, {
      default: () => {
        return `Status`;
      }
    })} ${validate_component(Root, "Select.Root").$$render(
      $$result,
      {
        selected: {
          value: $form.rental_unit_status || "",
          label: $form.rental_unit_status || "Select a status"
        },
        onSelectedChange: handleStatusChange
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "Select.Trigger").$$render(
            $$result,
            Object.assign(
              {},
              {
                "data-error": $errors.rental_unit_status && $form.rental_unit_status !== void 0
              },
              $constraints.rental_unit_status
            ),
            {},
            {
              default: () => {
                return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a status" }, {}, {})}`;
              }
            }
          )} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${each(locationStatusEnum.options, (status) => {
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
    )} ${$errors.rental_unit_status && $form.rental_unit_status !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.rental_unit_status)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Amenities`;
      }
    })} <div class="flex gap-2">${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "text",
        placeholder: "Add amenity",
        value: amenityInput
      },
      {
        value: ($$value) => {
          amenityInput = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${validate_component(Button, "Button").$$render($$result, { type: "button", variant: "secondary" }, {}, {
      default: () => {
        return `Add`;
      }
    })}</div> ${$form.amenities?.length ? `<div class="flex flex-wrap gap-2 mt-2">${each($form.amenities, (amenity, i) => {
      return `<div class="flex items-center gap-1 bg-secondary/50 p-1 rounded"><span>${escape(amenity)}</span> <button type="button" class="text-sm hover:text-destructive" data-svelte-h="svelte-1pdk68k">×</button> </div>`;
    })}</div>` : ``} ${$errors.amenities && $form.amenities !== void 0 ? `<p class="text-sm font-medium text-destructive">${escape($errors.amenities)}</p>` : ``}</div> <div class="flex justify-end space-x-2">${validate_component(Button, "Button").$$render($$result, { type: "submit" }, {}, {
      default: () => {
        return `${escape(editMode ? "Update" : "Add")} Rental_unit`;
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
    case "VACANT":
      return "secondary";
    case "OCCUPIED":
      return "default";
    case "RESERVED":
      return "outline";
    default:
      return "default";
  }
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_form;
  let { data } = $$props;
  const { form, enhance, errors, constraints, message } = superForm(data.form, {
    id: "rental_unit-form",
    validators: zodClient(rental_unitSchema),
    validationMethod: "oninput",
    dataType: "json",
    delayMs: 10,
    taintedMessage: null,
    onError: ({ result }) => {
      console.error("Form submission error:", result.error);
      if (result.error) {
        console.error("Server error:", result.error.message);
      }
    },
    onResult: ({ result }) => {
      if (result.type === "success") {
        selectedRental_Unit = void 0;
        editMode = false;
      } else if (result.type === "failure") {
        console.error("Form submission failed:", result);
      }
    }
  });
  $$unsubscribe_form = subscribe(form, (value) => value);
  let editMode = false;
  let selectedRental_Unit = void 0;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$unsubscribe_form();
  return `<div class="container mx-auto p-4 flex"><div class="w-2/3"><div class="flex justify-between items-center mb-4"><h1 class="text-2xl font-bold" data-svelte-h="svelte-irohhm">Rental_Units</h1> ${data.user?.role === "staff" ? `${validate_component(Button, "Button").$$render($$result, {}, {}, {
    default: () => {
      return `Add Rental_unit`;
    }
  })}` : ``}</div> ${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_content, "CardContent").$$render($$result, { class: "p-0" }, {}, {
        default: () => {
          return `<div class="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50" data-svelte-h="svelte-184m5g2"><div>Rental_unit</div> <div>Type</div> <div>Status</div> <div>Rate</div> <div>Capacity</div> <div>Amenities</div> <div>Actions</div></div> ${data.rental_unit && data.rental_unit.length > 0 ? `${each(data.rental_unit, (rental_unit) => {
            return `<div class="grid grid-cols-7 gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0 items-center"><div><div class="font-medium">${escape(rental_unit.name)}</div> <div class="text-sm text-muted-foreground">${escape(rental_unit.property.name)} - Floor ${escape(rental_unit.floor.floor_number)} ${rental_unit.floor.wing ? `Wing ${escape(rental_unit.floor.wing)}` : ``} </div></div> <div class="flex items-center"><span class="capitalize">${escape(rental_unit.type.toLowerCase())}</span></div> <div>${validate_component(Badge, "Badge").$$render(
              $$result,
              {
                variant: getStatusVariant(rental_unit.rental_unit_status)
              },
              {},
              {
                default: () => {
                  return `${escape(rental_unit.rental_unit_status)} `;
                }
              }
            )}</div> <div>₱${escape(rental_unit.base_rate.toLocaleString())}/mo</div> <div>${escape(rental_unit.capacity)} pax</div> <div class="flex flex-wrap gap-1">${each(rental_unit.amenities, (amenity) => {
              return `${validate_component(Badge, "Badge").$$render($$result, { variant: "outline" }, {}, {
                default: () => {
                  return `${escape(amenity)}`;
                }
              })}`;
            })}</div> <div class="flex items-center gap-2">${validate_component(Button, "Button").$$render($$result, { size: "sm", variant: "outline" }, {}, {
              default: () => {
                return `Edit
                  `;
              }
            })} ${validate_component(Button, "Button").$$render($$result, { size: "sm", variant: "destructive" }, {}, {
              default: () => {
                return `Delete
                  `;
              }
            })}</div> </div>`;
          })}` : `<div class="p-4 text-center text-muted-foreground" data-svelte-h="svelte-qoe0cm">No rental_unit found</div>`}`;
        }
      })}`;
    }
  })}</div> <div class="w-1/3 pl-4">${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, {}, {}, {
            default: () => {
              return `${escape(editMode ? "Edit" : "Add")} Rental_unit`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Rental_UnitForm, "Rental_UnitForm").$$render(
            $$result,
            {
              data,
              editMode,
              form,
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
