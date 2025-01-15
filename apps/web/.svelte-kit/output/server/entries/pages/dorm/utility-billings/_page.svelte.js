import { c as create_ssr_component, k as compute_rest_props, l as spread, m as escape_attribute_value, o as escape_object, s as subscribe, v as validate_component, e as escape, b as each } from "../../../../chunks/ssr.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "../../../../chunks/client.js";
import { I as Input } from "../../../../chunks/input.js";
import { L as Label } from "../../../../chunks/label.js";
import "../../../../chunks/index2.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../chunks/table-row.js";
import { c as cn, b as formatCurrency } from "../../../../chunks/utils.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index7.js";
import { a as utilityBillingTypeEnum } from "../../../../chunks/utility-billings.js";
import { B as Button } from "../../../../chunks/button.js";
const Table_caption = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `<caption${spread(
    [
      {
        class: escape_attribute_value(cn("text-muted-foreground mt-4 text-sm", className))
      },
      escape_object($$restProps)
    ],
    {}
  )}>${slots.default ? slots.default({}) : ``}</caption>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let availableEndDates;
  let canCreateBillings;
  let canViewBillings;
  let $$unsubscribe_form;
  let $errors, $$unsubscribe_errors;
  let $delayed, $$unsubscribe_delayed;
  let { data } = $$props;
  const { form, errors, enhance, delayed } = superForm(data.form);
  $$unsubscribe_form = subscribe(form, (value) => value);
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  $$unsubscribe_delayed = subscribe(delayed, (value) => $delayed = value);
  let costPerUnit = 0;
  let meterBillings = [];
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    data.meters.filter((meter) => meter?.id != null);
    availableEndDates = data.availableReadingDates.filter((date) => true);
    canCreateBillings = ["super_admin", "property_admin", "accountant"].includes(data.role);
    canViewBillings = ["super_admin", "property_admin", "accountant", "manager", "frontdesk"].includes(data.role);
    $$rendered = `<div class="container mx-auto py-4"><div class="flex justify-between items-center mb-6"><h1 class="text-3xl font-bold" data-svelte-h="svelte-y5gc41">Utility Billings</h1> ${!canViewBillings ? `<p class="text-destructive" data-svelte-h="svelte-u0uip9">You don&#39;t have permission to view utility billings</p>` : ``}</div> ${canViewBillings ? `<form method="POST" class="space-y-6"><div class="grid grid-cols-2 gap-4"><div>${validate_component(Label, "Label").$$render($$result, { for: "start_date" }, {}, {
      default: () => {
        return `Start Date`;
      }
    })} ${validate_component(Root, "Select").$$render($$result, {}, {}, {
      default: () => {
        return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Select start date" }, {}, {
              default: () => {
                return `${escape("")}`;
              }
            })}`;
          }
        })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
          default: () => {
            return `${each(data.availableReadingDates, ({ reading_date }) => {
              return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: reading_date }, {}, {
                default: () => {
                  return `${escape(new Date(reading_date).toLocaleDateString())} `;
                }
              })}`;
            })}`;
          }
        })}`;
      }
    })} ${$errors.start_date ? `<span class="text-destructive text-sm">${escape($errors.start_date)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "end_date" }, {}, {
      default: () => {
        return `End Date`;
      }
    })} ${validate_component(Root, "Select").$$render($$result, {}, {}, {
      default: () => {
        return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Select end date" }, {}, {
              default: () => {
                return `${escape("")}`;
              }
            })}`;
          }
        })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
          default: () => {
            return `${each(availableEndDates, ({ reading_date }) => {
              return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: reading_date }, {}, {
                default: () => {
                  return `${escape(new Date(reading_date).toLocaleDateString())} `;
                }
              })}`;
            })}`;
          }
        })}`;
      }
    })} ${$errors.end_date ? `<span class="text-destructive text-sm">${escape($errors.end_date)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "type" }, {}, {
      default: () => {
        return `Utility Type`;
      }
    })} ${validate_component(Root, "Select").$$render($$result, {}, {}, {
      default: () => {
        return `${validate_component(Select_trigger, "SelectTrigger").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Value, "SelectValue").$$render($$result, { placeholder: "Select utility type" }, {}, {
              default: () => {
                return `${escape("")}`;
              }
            })}`;
          }
        })} ${validate_component(Select_content, "SelectContent").$$render($$result, {}, {}, {
          default: () => {
            return `${each(Object.entries(utilityBillingTypeEnum.enum), ([key, value]) => {
              return `${validate_component(Select_item, "SelectItem").$$render($$result, { value: key }, {}, {
                default: () => {
                  return `${escape(value)}`;
                }
              })}`;
            })}`;
          }
        })}`;
      }
    })} ${$errors.type ? `<span class="text-destructive text-sm">${escape($errors.type)}</span>` : ``}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "cost_per_unit" }, {}, {
      default: () => {
        return `Cost Per Unit`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "number",
        id: "cost_per_unit",
        min: "0",
        step: "0.01",
        value: costPerUnit
      },
      {
        value: ($$value) => {
          costPerUnit = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${$errors.cost_per_unit ? `<span class="text-destructive text-sm">${escape($errors.cost_per_unit)}</span>` : ``}</div></div> ${meterBillings.length > 0 ? `${validate_component(Table, "Table.Root").$$render($$result, {}, {}, {
      default: () => {
        return `${validate_component(Table_caption, "Table.Caption").$$render($$result, {}, {}, {
          default: () => {
            return `Meter Billings`;
          }
        })} ${validate_component(Table_header, "Table.Header").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
              default: () => {
                return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                  default: () => {
                    return `Meter`;
                  }
                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                  default: () => {
                    return `Start Reading`;
                  }
                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                  default: () => {
                    return `End Reading`;
                  }
                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                  default: () => {
                    return `Consumption`;
                  }
                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                  default: () => {
                    return `Total Cost`;
                  }
                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                  default: () => {
                    return `Tenant Count`;
                  }
                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                  default: () => {
                    return `Cost Per Tenant`;
                  }
                })}`;
              }
            })}`;
          }
        })} ${validate_component(Table_body, "Table.Body").$$render($$result, {}, {}, {
          default: () => {
            return `${each(meterBillings, (billing) => {
              return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(billing.meter_name)}`;
                    }
                  })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(billing.start_reading)}`;
                    }
                  })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(billing.end_reading)}`;
                    }
                  })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(billing.consumption)}`;
                    }
                  })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(formatCurrency(billing.total_cost))}`;
                    }
                  })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(billing.tenant_count)}`;
                    }
                  })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(formatCurrency(billing.per_tenant_cost))}`;
                    }
                  })} `;
                }
              })}`;
            })}`;
          }
        })}`;
      }
    })} ${canCreateBillings ? `${validate_component(Button, "Button").$$render($$result, { type: "submit", disabled: $delayed }, {}, {
      default: () => {
        return `${$delayed ? `Creating Billings...` : `Create Billings`}`;
      }
    })}` : ``}` : ``}</form>` : ``}</div> ${``}`;
  } while (!$$settled);
  $$unsubscribe_form();
  $$unsubscribe_errors();
  $$unsubscribe_delayed();
  return $$rendered;
});
export {
  Page as default
};
