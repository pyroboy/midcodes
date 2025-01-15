import { c as create_ssr_component, v as validate_component, b as each, e as escape } from "../../../../chunks/ssr.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import "../../../../chunks/index8.js";
import { B as Badge } from "../../../../chunks/index9.js";
import "../../../../chunks/index2.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import "../../../../chunks/client.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index6.js";
import { u as utilityTypeEnum, m as meterStatusEnum } from "../../../../chunks/formSchema5.js";
import "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "memoize-weak";
import "zod-to-json-schema";
import { B as Button } from "../../../../chunks/button.js";
function getTypeVariant(type) {
  switch (type) {
    case "ELECTRICITY":
      return "default";
    case "WATER":
      return "secondary";
    case "INTERNET":
      return "outline";
    default:
      return "default";
  }
}
function getStatusColor(status) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800";
    case "MAINTENANCE":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
function formatReading(value) {
  return value.toLocaleString(void 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let form;
  let meters;
  let properties;
  let floors;
  let rental_unit;
  let isAdminLevel;
  let isUtility;
  let isMaintenance;
  let filteredMeters;
  let { data } = $$props;
  let selectedType = void 0;
  let selectedStatus = void 0;
  let searchQuery = "";
  let sortBy = "name";
  ({
    id: crypto.randomUUID(),
    valid: true,
    posted: false,
    errors: {},
    data: {
      name: "",
      type: "ELECTRICITY",
      status: "ACTIVE",
      location_type: "PROPERTY",
      property_id: null,
      floor_id: null,
      rental_unit_id: null,
      unit_rate: 0,
      initial_reading: 0,
      is_active: true,
      notes: null
    }
  });
  function handleTypeSelect(value) {
    selectedType = value?.value;
  }
  function handleStatusSelect(value) {
    selectedStatus = value?.value;
  }
  function getLocationDetails(meter) {
    switch (meter.location_type) {
      case "PROPERTY":
        const property = properties?.find((p) => p.id === meter.property_id);
        return property ? `Property: ${property.name}` : "Unknown Property";
      case "FLOOR":
        const floor = floors?.find((f) => f.id === meter.floor_id);
        return floor ? `Floor ${floor.floor_number}${floor.property ? ` - ${floor.property.name}` : ""}` : "Unknown Floor";
      case "RENTAL_UNIT":
        const unit = rental_unit?.find((r) => r.id === meter.rental_unit_id);
        return unit ? `Rental_unit ${unit.number}${unit.floor?.property ? ` - ${unit.floor.property.name}` : ""}` : "Unknown Rental_unit";
      default:
        return "Unknown Location";
    }
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  ({ form, meters = [], properties = [], floors = [], rental_unit = [], isAdminLevel, isUtility, isMaintenance } = data);
  filteredMeters = (meters ?? []).filter((meter) => {
    if (!meter) return false;
    const matchesType = !selectedType || meter.type === selectedType;
    const matchesStatus = !selectedStatus || meter.status === selectedStatus;
    const matchesSearch = true;
    return matchesType && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const order = 1;
    switch (sortBy) {
      case "name":
        return order * a.name.localeCompare(b.name);
      case "type":
        return order * a.type.localeCompare(b.type);
      case "status":
        return order * a.status.localeCompare(b.status);
      case "reading":
        const aReading = a.latest_reading?.value || 0;
        const bReading = b.latest_reading?.value || 0;
        return order * (aReading - bReading);
      default:
        return 0;
    }
  }) || [];
  return `<div class="space-y-6">${``} ${`<div class="space-y-4"><div class="flex justify-between items-center"><h1 class="text-2xl font-bold" data-svelte-h="svelte-1f6de1u">Meters</h1> ${isAdminLevel || isUtility ? `${validate_component(Button, "Button").$$render($$result, {}, {}, {
    default: () => {
      return `Add Meter`;
    }
  })}` : ``}</div>  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6"><div>${validate_component(Input, "Input").$$render(
    $$result,
    {
      type: "text",
      placeholder: "Search meters...",
      value: searchQuery
    },
    {},
    {}
  )}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "type" }, {}, {
    default: () => {
      return `Type`;
    }
  })} ${validate_component(Root, "Select").$$render($$result, { onSelectedChange: handleTypeSelect }, {}, {
    default: () => {
      return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Select type" }, {}, {})}`;
        }
      })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: "" }, {}, {
            default: () => {
              return `All Types`;
            }
          })} ${each(Object.values(utilityTypeEnum.Values), (type) => {
            return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: type }, {}, {
              default: () => {
                return `${escape(type)}`;
              }
            })}`;
          })}`;
        }
      })}`;
    }
  })}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "status" }, {}, {
    default: () => {
      return `Status`;
    }
  })} ${validate_component(Root, "Select").$$render($$result, { onSelectedChange: handleStatusSelect }, {}, {
    default: () => {
      return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Select status" }, {}, {})}`;
        }
      })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: "" }, {}, {
            default: () => {
              return `All Statuses`;
            }
          })} ${each(Object.values(meterStatusEnum.Values), (status) => {
            return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: status }, {}, {
              default: () => {
                return `${escape(status)}`;
              }
            })}`;
          })}`;
        }
      })}`;
    }
  })}</div></div>  <div class="grid gap-4">${`${filteredMeters.length === 0 ? `<div class="text-center py-8 text-gray-500" data-svelte-h="svelte-1qkfnwd">No meters found matching your criteria</div>` : `${each(filteredMeters, (meter) => {
    return `${validate_component(Card, "Card.Root").$$render(
      $$result,
      {
        class: "cursor-pointer " + (isAdminLevel || isUtility ? "hover:bg-gray-50" : "")
      },
      {},
      {
        default: () => {
          return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Card_title, "Card.Title").$$render(
                $$result,
                {
                  class: "flex justify-between items-center"
                },
                {},
                {
                  default: () => {
                    return `<div class="flex items-center space-x-2"><span>${escape(meter.name)}</span> ${validate_component(Badge, "Badge").$$render($$result, { variant: getTypeVariant(meter.type) }, {}, {
                      default: () => {
                        return `${escape(meter.type)} `;
                      }
                    })} ${validate_component(Badge, "Badge").$$render($$result, { class: getStatusColor(meter.status) }, {}, {
                      default: () => {
                        return `${escape(meter.status)} `;
                      }
                    })}</div> ${meter.latest_reading ? `<div class="text-sm text-gray-500">Latest Reading: ${escape(formatReading(meter.latest_reading.value))} <span class="text-xs">(${escape(new Date(meter.latest_reading.date).toLocaleDateString())})</span> </div>` : ``} `;
                  }
                }
              )} `;
            }
          })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
            default: () => {
              return `<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p class="text-sm font-medium text-gray-500" data-svelte-h="svelte-a2mrii">Location</p> <p>${escape(getLocationDetails(meter))}</p></div> <div><p class="text-sm font-medium text-gray-500" data-svelte-h="svelte-128smd3">Unit Rate</p> <p>${escape(formatReading(meter.unit_rate))} per unit</p> </div></div> ${meter.notes ? `<p class="mt-2 text-sm text-gray-500">${escape(meter.notes)}</p>` : ``} `;
            }
          })} `;
        }
      }
    )}`;
  })}`}`}</div></div>`}</div> ${!isAdminLevel && !isUtility && !isMaintenance ? `<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-svelte-h="svelte-1g060nc"><p class="text-yellow-800">You do not have permission to manage meters. Please contact your administrator.</p></div>` : ``}`;
});
export {
  Page as default
};
