import { c as create_ssr_component, q as onDestroy, s as subscribe, v as validate_component, e as escape, b as each, t as set_store_value } from "../../../../chunks/ssr.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "../../../../chunks/client.js";
import "../../../../chunks/schema.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index7.js";
import "../../../../chunks/index2.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import { P as Progress } from "../../../../chunks/progress.js";
import { format } from "date-fns";
import { t as toast } from "../../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
import { T as Toaster } from "../../../../chunks/Toaster.js";
import { B as Button } from "../../../../chunks/button.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let filteredMeters;
  let formErrors;
  let $form, $$unsubscribe_form;
  let $delayed, $$unsubscribe_delayed;
  let $errors, $$unsubscribe_errors;
  let { data } = $$props;
  let selectedMeterType;
  let selectedLocationType;
  let showProgressBar = false;
  let progress = 0;
  let progressInterval;
  let progressTimeout;
  onDestroy(() => {
    if (progressInterval) clearInterval(progressInterval);
    if (progressTimeout) clearTimeout(progressTimeout);
  });
  const { form, errors, enhance, delayed, submitting, message, reset } = superForm(data.form, {
    onUpdated: ({ form: form2 }) => {
      if (form2.valid) {
        toast.success("Readings saved successfully");
      }
    },
    onError: ({ result }) => {
      toast.error(result.error.message);
    }
  });
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  $$unsubscribe_delayed = subscribe(delayed, (value) => $delayed = value);
  function updateMeterType(value) {
    if (value?.value === "ELECTRICITY" || value?.value === "WATER" || value?.value === "INTERNET") {
      selectedMeterType = value.value;
      set_store_value(form, $form.meter_type = value.value, $form);
    }
  }
  function updateLocationType(value) {
    if (value?.value === "PROPERTY" || value?.value === "FLOOR" || value?.value === "RENTAL_UNIT") {
      selectedLocationType = value.value;
      set_store_value(form, $form.location_type = value.value, $form);
    }
  }
  let formReadings = {};
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    filteredMeters = (data.meters ?? []).filter((meter) => {
      return meter.is_active && meter.status === "ACTIVE" && (!selectedMeterType || meter.type === selectedMeterType) && (!selectedLocationType || meter.location_type === selectedLocationType);
    });
    {
      if ($delayed) {
        showProgressBar = true;
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(
          () => {
            progress = Math.min(progress + 1, 95);
          },
          100
        );
      } else if (showProgressBar) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = void 0;
        }
        progress = 100;
        if (progressTimeout) {
          clearTimeout(progressTimeout);
        }
        progressTimeout = setTimeout(
          () => {
            showProgressBar = false;
            progress = 0;
            progressTimeout = void 0;
          },
          500
        );
      }
    }
    {
      {
        filteredMeters.forEach((meter) => {
          if (!formReadings[meter.id]) {
            formReadings[meter.id] = { reading_value: 0 };
          }
        });
      }
    }
    formErrors = $form;
    $$rendered = `<div class="container mx-auto p-4"><div class="space-y-4"><div class="flex items-center justify-between"><h1 class="text-2xl font-bold" data-svelte-h="svelte-165u4ti">Meter Readings</h1> ${!data.canEdit ? `<div class="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800" data-svelte-h="svelte-952xuv">You do not have permission to add readings</div>` : ``}</div> ${showProgressBar ? `<div class="w-full">${validate_component(Progress, "Progress").$$render($$result, { value: progress }, {}, {})}</div>` : ``} <form method="POST" action="?/create" class="space-y-4 bg-card p-4 rounded-lg border"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "reading_date" }, {}, {
      default: () => {
        return `Reading Date`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "date",
        name: "reading_date",
        max: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
        min: data.latestOverallReadingDate,
        disabled: !data.canEdit,
        value: $form.reading_date
      },
      {
        value: ($$value) => {
          $form.reading_date = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.reading_date ? `<p class="text-sm text-red-500">${escape($errors.reading_date)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "meter_type" }, {}, {
      default: () => {
        return `Meter Type`;
      }
    })} ${validate_component(Root, "Select").$$render(
      $$result,
      {
        onSelectedChange: updateMeterType,
        disabled: !data.canEdit
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Select meter type" }, {}, {})}`;
            }
          })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: "ELECTRICITY" }, {}, {
                default: () => {
                  return `Electricity`;
                }
              })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "WATER" }, {}, {
                default: () => {
                  return `Water`;
                }
              })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "INTERNET" }, {}, {
                default: () => {
                  return `Internet`;
                }
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.meter_type ? `<p class="text-sm text-red-500">${escape($errors.meter_type)}</p>` : ``}</div> <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "location_type" }, {}, {
      default: () => {
        return `Location Type`;
      }
    })} ${validate_component(Root, "Select").$$render(
      $$result,
      {
        onSelectedChange: updateLocationType,
        disabled: !data.canEdit
      },
      {},
      {
        default: () => {
          return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Select location type" }, {}, {})}`;
            }
          })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: "PROPERTY" }, {}, {
                default: () => {
                  return `Property`;
                }
              })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "FLOOR" }, {}, {
                default: () => {
                  return `Floor`;
                }
              })} ${validate_component(Select_item, "SelectItem").$$render($$result, { value: "RENTAL_UNIT" }, {}, {
                default: () => {
                  return `Rental_unit`;
                }
              })}`;
            }
          })}`;
        }
      }
    )} ${$errors.location_type ? `<p class="text-sm text-red-500">${escape($errors.location_type)}</p>` : ``}</div></div> ${filteredMeters.length > 0 ? `<div class="space-y-4"><h2 class="text-lg font-semibold" data-svelte-h="svelte-8rygxw">Enter Readings</h2> <div class="grid gap-4">${each(filteredMeters, (meter) => {
      return `<div class="p-4 border rounded-lg space-y-2"><div class="flex items-center justify-between"><div><h3 class="font-medium">${escape(meter.name)}</h3> <p class="text-sm text-muted-foreground">${meter.rental_unit ? `Rental_unit ${escape(meter.rental_unit.number)},
                        Floor ${escape(meter.rental_unit.floor.floor_number)} ${meter.rental_unit.floor.wing ? `Wing ${escape(meter.rental_unit.floor.wing)},` : ``} ${escape(meter.rental_unit.floor.property.name)}` : `${meter.floor_id ? `Floor ${escape(meter.floor_id)}` : `Property Level`}`} </p></div> <div class="text-right"><p class="text-sm">Initial Reading: ${escape(meter.initial_reading.toFixed(2))}</p> <p class="text-sm">Rate: ₱${escape(meter.unit_rate.toFixed(2))}/unit</p> <p class="text-sm text-muted-foreground">Status: ${escape(meter.status)}</p> </div></div> <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${data.previousReadings?.[meter.id] ? `<div class="text-sm">Previous Reading: ${escape(data.previousReadings[meter.id].reading.toFixed(2))} <br>
                      Date: ${escape(format(new Date(data.previousReadings[meter.id].reading_date), "MMM d, yyyy"))} </div>` : ``} <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, { for: "reading_" + meter.id }, {}, {
        default: () => {
          return `New Reading`;
        }
      })} ${validate_component(Input, "Input").$$render(
        $$result,
        {
          type: "number",
          id: "reading_" + meter.id,
          name: `readings[${meter.id}].reading_value`,
          step: "0.01",
          min: data.previousReadings?.[meter.id]?.reading ?? meter.initial_reading,
          disabled: !data.canEdit,
          value: formReadings[meter.id].reading_value
        },
        {
          value: ($$value) => {
            formReadings[meter.id].reading_value = $$value;
            $$settled = false;
          }
        },
        {}
      )} ${formErrors?.readings?.[meter.id]?.reading?._errors ? `<p class="text-sm text-red-500">${escape(formErrors.readings[meter.id].reading._errors.join(", "))} </p>` : ``} </div></div> </div>`;
    })}</div></div> <div class="flex justify-end">${validate_component(Button, "Button").$$render(
      $$result,
      {
        type: "submit",
        disabled: !data.canEdit || $delayed
      },
      {},
      {
        default: () => {
          return `${$delayed ? `Saving...` : `Save Readings`}`;
        }
      }
    )}</div>` : `${selectedMeterType || selectedLocationType ? `<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-svelte-h="svelte-17707x3"><p class="text-yellow-800">No meters found matching the selected criteria.</p></div>` : ``}`}</form></div></div> ${validate_component(Toaster, "Toaster").$$render($$result, {}, {}, {})}`;
  } while (!$$settled);
  $$unsubscribe_form();
  $$unsubscribe_delayed();
  $$unsubscribe_errors();
  return $$rendered;
});
export {
  Page as default
};
