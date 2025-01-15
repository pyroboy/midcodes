import { c as create_ssr_component, k as compute_rest_props, s as subscribe, l as spread, o as escape_object, a as add_attribute, v as validate_component, e as escape, b as each } from "../../../../../chunks/ssr.js";
import { C as Card } from "../../../../../chunks/card.js";
import { C as Card_content } from "../../../../../chunks/card-content.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../../chunks/card-title.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../../chunks/table-row.js";
import { B as Badge } from "../../../../../chunks/index9.js";
import { g as getCtx, R as Root, T as Tabs_content } from "../../../../../chunks/index3.js";
import "dequal";
import "../../../../../chunks/create.js";
import { c as cn } from "../../../../../chunks/utils.js";
import { c as createDispatcher } from "../../../../../chunks/events.js";
const Tabs_list$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let builder;
  let $$restProps = compute_rest_props($$props, ["asChild", "el"]);
  let $list, $$unsubscribe_list;
  let { asChild = false } = $$props;
  let { el = void 0 } = $$props;
  const { elements: { list }, getAttrs } = getCtx();
  $$unsubscribe_list = subscribe(list, (value) => $list = value);
  const attrs = getAttrs("list");
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  builder = $list;
  {
    Object.assign(builder, attrs);
  }
  $$unsubscribe_list();
  return `${asChild ? `${slots.default ? slots.default({ builder }) : ``}` : `<div${spread([escape_object(builder), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</div>`}`;
});
const Tabs_trigger$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let builder;
  let $$restProps = compute_rest_props($$props, ["value", "disabled", "asChild", "el"]);
  let $trigger, $$unsubscribe_trigger;
  let { value } = $$props;
  let { disabled = void 0 } = $$props;
  let { asChild = false } = $$props;
  let { el = void 0 } = $$props;
  const { elements: { trigger }, getAttrs } = getCtx();
  $$unsubscribe_trigger = subscribe(trigger, (value2) => $trigger = value2);
  createDispatcher();
  const attrs = getAttrs("trigger");
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  builder = $trigger({ value, disabled });
  {
    Object.assign(builder, attrs);
  }
  $$unsubscribe_trigger();
  return `${asChild ? `${slots.default ? slots.default({ builder }) : ``}` : `<button${spread([escape_object(builder), { type: "button" }, escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</button>`}`;
});
const Tabs_list = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `${validate_component(Tabs_list$1, "TabsPrimitive.List").$$render(
    $$result,
    Object.assign(
      {},
      {
        class: cn("bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1", className)
      },
      $$restProps
    ),
    {},
    {
      default: () => {
        return `${slots.default ? slots.default({}) : ``}`;
      }
    }
  )}`;
});
const Tabs_trigger = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class", "value"]);
  let { class: className = void 0 } = $$props;
  let { value } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  return `${validate_component(Tabs_trigger$1, "TabsPrimitive.Trigger").$$render(
    $$result,
    Object.assign(
      {},
      {
        class: cn("ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm", className)
      },
      { value },
      $$restProps
    ),
    {},
    {
      default: () => {
        return `${slots.default ? slots.default({}) : ``}`;
      }
    }
  )}`;
});
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
};
function convertToRental_Unit(serverRental_Unit) {
  return {
    ...serverRental_Unit,
    capacity: serverRental_Unit.capacity || 0,
    base_rate: serverRental_Unit.base_rate || 0,
    floor_id: serverRental_Unit.floor_id || 0,
    type: serverRental_Unit.type || "",
    amenities: serverRental_Unit.amenities || {},
    floors: serverRental_Unit.floors || {
      floor_number: 0,
      wing: null,
      status: "ACTIVE"
    },
    leases: (serverRental_Unit.leases || []).map((lease) => ({
      ...lease,
      name: lease.name || "",
      status: lease.status || lease.lease_status || "ACTIVE",
      type: lease.type || "",
      start_date: lease.start_date || lease.lease_start_date,
      end_date: lease.end_date || lease.lease_end_date,
      rent_amount: lease.rent_amount || lease.lease_rent_rate || 0,
      security_deposit: lease.security_deposit || 0,
      balance: lease.balance || 0,
      notes: lease.notes || null,
      lease_tenants: (lease.lease_tenants || []).map((lt) => ({
        tenant: {
          id: lt.tenant.id,
          name: lt.tenant.name || `${lt.tenant.first_name} ${lt.tenant.last_name}`,
          email: lt.tenant.email,
          contact_number: lt.tenant.contact_number || null
        }
      })),
      billings: (lease.billings || []).map((bill) => ({
        id: bill.id,
        type: bill.type || "RENT",
        utility_type: bill.utility_type || null,
        amount: bill.amount || 0,
        paid_amount: bill.paid_amount || 0,
        balance: bill.balance || 0,
        status: bill.status || "",
        due_date: bill.due_date || "",
        billing_date: bill.billing_date || "",
        penalty_amount: bill.penalty_amount || 0,
        notes: bill.notes || null
      })),
      payment_schedules: (lease.payment_schedules || []).map((ps) => ({
        id: ps.id,
        due_date: ps.due_date,
        expected_amount: ps.expected_amount,
        type: ps.type || "RENT",
        frequency: ps.frequency || "MONTHLY",
        status: ps.status || "PENDING",
        notes: ps.notes || null
      }))
    })),
    meters: (serverRental_Unit.meters || []).map((meter) => ({
      id: meter.id,
      name: meter.name || "",
      location_type: meter.location_type || "PROPERTY",
      type: meter.type || "ELECTRIC",
      is_active: meter.is_active || true,
      status: meter.status || "ACTIVE",
      initial_reading: meter.initial_reading || 0,
      unit_rate: meter.unit_rate || 0,
      notes: meter.notes || null,
      readings: (meter.readings || []).map((reading) => ({
        reading: reading.reading || 0,
        reading_date: reading.reading_date || ""
      }))
    })),
    maintenance: (serverRental_Unit.maintenance || []).map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status || "PENDING",
      completed_at: issue.completed_at,
      notes: issue.notes || null
    }))
  };
}
function calculateBudgetCompliance(expenses) {
  const allocated = 1e5;
  const spent = expenses.reduce((total, exp) => total + exp.amount, 0);
  const remaining = allocated - spent;
  return {
    allocated,
    spent,
    remaining,
    status: remaining >= 0 ? "WITHIN_BUDGET" : "OVER_BUDGET"
  };
}
function getStatusVariant(status) {
  switch (status) {
    case "OCCUPIED":
    case "COMPLETED":
    case "PAID":
      return "default";
    case "VACANT":
    case "OVERDUE":
      return "destructive";
    case "RESERVED":
      return "secondary";
    case "PENDING":
    case "IN_PROGRESS":
    default:
      return "outline";
  }
}
function getPaymentStatusVariant(status) {
  switch (status) {
    case "PAID":
      return "default";
    case "OVERDUE":
      return "destructive";
    case "PENDING":
    default:
      return "outline";
  }
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let rental_unitByFloor;
  let balancesByTenant;
  let rental_unitStats;
  let financialStats;
  let expenseStats;
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  rental_unitByFloor = data.rental_unit.map(convertToRental_Unit).reduce(
    (acc, rental_unit) => {
      const floor = rental_unit.floors.floor_number;
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(rental_unit);
      return acc;
    },
    {}
  );
  balancesByTenant = data.balances.reduce(
    (acc, balance) => {
      if (!acc[balance.tenant_id]) acc[balance.tenant_id] = {};
      acc[balance.tenant_id][balance.month] = balance.balance;
      return acc;
    },
    {}
  );
  rental_unitStats = {
    total: data.rental_unit.length,
    occupied: data.rental_unit.filter((r) => r.rental_unit_status === "OCCUPIED").length,
    vacant: data.rental_unit.filter((r) => r.rental_unit_status === "VACANT").length,
    reserved: data.rental_unit.filter((r) => r.rental_unit_status === "RESERVED").length
  };
  financialStats = data.rental_unit.map(convertToRental_Unit).reduce(
    (acc, rental_unit) => {
      rental_unit.leases.forEach((lease) => {
        acc.totalRent += lease.rent_amount;
        acc.totalDeposits += lease.security_deposit;
        acc.totalBalance += lease.balance;
        lease.billings.forEach((bill) => {
          if (bill.type === "UTILITY") acc.totalUtilities += bill.balance;
          if (bill.type === "PENALTY") acc.totalPenalties += bill.amount;
        });
      });
      return acc;
    },
    {
      totalRent: 0,
      totalDeposits: 0,
      totalBalance: 0,
      totalUtilities: 0,
      totalPenalties: 0
    }
  );
  expenseStats = {
    total: data.lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    pending: data.lastMonthExpenses.filter((exp) => exp.status === "PENDING").reduce((sum, exp) => sum + exp.amount, 0)
  };
  return `<div class="container mx-auto p-4 space-y-8"><div class="flex justify-between items-center"><h1 class="text-2xl font-bold" data-svelte-h="svelte-iopvac">Monthly Overview</h1> ${data.isAdminLevel || data.isStaffLevel ? `<div class="flex gap-2" data-svelte-h="svelte-1quig3z"><button class="btn variant-filled">Export Report</button> <button class="btn variant-filled">Print View</button></div>` : ``}</div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">${validate_component(Card, "Card.Root").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
            default: () => {
              return `Rental_unit Statistics`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="grid grid-cols-2 gap-4"><div><p class="text-sm" data-svelte-h="svelte-16vjmqv">Total Rental_Units</p> <p class="text-2xl font-bold">${escape(rental_unitStats.total)}</p></div> <div><p class="text-sm" data-svelte-h="svelte-11gspf">Occupied</p> <p class="text-2xl font-bold">${escape(rental_unitStats.occupied)}</p></div> <div><p class="text-sm" data-svelte-h="svelte-1u42x4q">Vacant</p> <p class="text-2xl font-bold">${escape(rental_unitStats.vacant)}</p></div> <div><p class="text-sm" data-svelte-h="svelte-4ugktv">Reserved</p> <p class="text-2xl font-bold">${escape(rental_unitStats.reserved)}</p></div></div>`;
        }
      })}`;
    }
  })} ${validate_component(Card, "Card.Root").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
            default: () => {
              return `Financial Overview`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="space-y-2"><div><p class="text-sm" data-svelte-h="svelte-8sgoxp">Total Monthly Rent</p> <p class="text-2xl font-bold">${escape(formatCurrency(financialStats.totalRent))}</p></div> <div><p class="text-sm" data-svelte-h="svelte-86ght7">Outstanding Balance</p> <p class="text-2xl font-bold">${escape(formatCurrency(financialStats.totalBalance))}</p></div></div>`;
        }
      })}`;
    }
  })} ${validate_component(Card, "Card.Root").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
            default: () => {
              return `Utility Overview`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="space-y-2"><div><p class="text-sm" data-svelte-h="svelte-14dif1f">Outstanding Utilities</p> <p class="text-2xl font-bold">${escape(formatCurrency(financialStats.totalUtilities))}</p></div> <div><p class="text-sm" data-svelte-h="svelte-1v5i7wk">Total Penalties</p> <p class="text-2xl font-bold">${escape(formatCurrency(financialStats.totalPenalties))}</p></div></div>`;
        }
      })}`;
    }
  })} ${validate_component(Card, "Card.Root").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
            default: () => {
              return `Expenses Overview`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="space-y-2"><div><p class="text-sm" data-svelte-h="svelte-3rcdal">Monthly Expenses</p> <p class="text-2xl font-bold">${escape(formatCurrency(expenseStats.total))}</p></div> <div><p class="text-sm" data-svelte-h="svelte-m6saav">Pending Expenses</p> <p class="text-2xl font-bold">${escape(formatCurrency(expenseStats.pending))}</p></div></div>`;
        }
      })}`;
    }
  })}</div> ${data.lastMonthExpenses.length > 0 ? `${data.isAdminLevel || data.isStaffLevel ? (() => {
    let budgetStatus = calculateBudgetCompliance(data.lastMonthExpenses);
    return ` ${validate_component(Card, "Card.Root").$$render($$result, {}, {}, {
      default: () => {
        return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
              default: () => {
                return `Budget Status`;
              }
            })}`;
          }
        })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
          default: () => {
            return `<div class="grid gap-4"><div class="flex items-center justify-between"><span data-svelte-h="svelte-a2h97m">Allocated Budget:</span> <span class="font-medium">₱${escape(budgetStatus.allocated.toLocaleString())}</span></div> <div class="flex items-center justify-between"><span data-svelte-h="svelte-5hujve">Total Spent:</span> <span class="font-medium">₱${escape(budgetStatus.spent.toLocaleString())}</span></div> <div class="flex items-center justify-between"><span data-svelte-h="svelte-1pg0uy8">Remaining:</span> <span class="font-medium">₱${escape(budgetStatus.remaining.toLocaleString())}</span></div> <div class="flex items-center justify-between"><span data-svelte-h="svelte-k2z92">Status:</span> ${validate_component(Badge, "Badge").$$render(
              $$result,
              {
                variant: budgetStatus.status === "WITHIN_BUDGET" ? "secondary" : "destructive"
              },
              {},
              {
                default: () => {
                  return `${escape(budgetStatus.status)}`;
                }
              }
            )}</div></div>`;
          }
        })}`;
      }
    })}`;
  })() : ``}` : ``} ${validate_component(Root, "Tabs").$$render($$result, { value: "overview", class: "w-full" }, {}, {
    default: () => {
      return `${validate_component(Tabs_list, "TabsList").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Tabs_trigger, "TabsTrigger").$$render($$result, { value: "overview" }, {}, {
            default: () => {
              return `Overview`;
            }
          })} ${validate_component(Tabs_trigger, "TabsTrigger").$$render($$result, { value: "financial" }, {}, {
            default: () => {
              return `Financial`;
            }
          })} ${validate_component(Tabs_trigger, "TabsTrigger").$$render($$result, { value: "utilities" }, {}, {
            default: () => {
              return `Utilities`;
            }
          })} ${validate_component(Tabs_trigger, "TabsTrigger").$$render($$result, { value: "maintenance" }, {}, {
            default: () => {
              return `Maintenance`;
            }
          })}`;
        }
      })} ${validate_component(Tabs_content, "TabsContent").$$render($$result, { value: "overview" }, {}, {
        default: () => {
          return `${each(Object.entries(rental_unitByFloor), ([floor, rental_unit]) => {
            return `${validate_component(Card, "Card.Root").$$render($$result, { class: "mb-4" }, {}, {
              default: () => {
                return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
                      default: () => {
                        return `Floor ${escape(floor)}`;
                      }
                    })} `;
                  }
                })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Table, "Table.Root").$$render($$result, {}, {}, {
                      default: () => {
                        return `${validate_component(Table_header, "Table.Header").$$render($$result, {}, {}, {
                          default: () => {
                            return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                              default: () => {
                                return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Rental_unit`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Type`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Status`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Tenant`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Base Rate`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Balance`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Lease End`;
                                  }
                                })} `;
                              }
                            })} `;
                          }
                        })} ${validate_component(Table_body, "Table.Body").$$render($$result, {}, {}, {
                          default: () => {
                            return `${each(rental_unit, (rental_unit2) => {
                              return `${each(rental_unit2.leases, (lease) => {
                                return `${each(lease.lease_tenants, ({ tenant }) => {
                                  return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                                    default: () => {
                                      return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(rental_unit2.number)}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(rental_unit2.type)}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${validate_component(Badge, "Badge").$$render(
                                            $$result,
                                            {
                                              variant: getStatusVariant(rental_unit2.rental_unit_status)
                                            },
                                            {},
                                            {
                                              default: () => {
                                                return `${escape(rental_unit2.rental_unit_status)} `;
                                              }
                                            }
                                          )} `;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `<div><p>${escape(tenant.name)}</p> ${tenant.contact_number ? `<p class="text-sm text-muted-foreground">${escape(tenant.contact_number)}</p>` : ``}</div> `;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(formatCurrency(rental_unit2.base_rate))}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${validate_component(Badge, "Badge").$$render(
                                            $$result,
                                            {
                                              variant: lease.balance > 0 ? "destructive" : "default"
                                            },
                                            {},
                                            {
                                              default: () => {
                                                return `${escape(formatCurrency(lease.balance))} `;
                                              }
                                            }
                                          )} `;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(new Date(lease.end_date).toLocaleDateString())}`;
                                        }
                                      })} `;
                                    }
                                  })}`;
                                })}`;
                              })}`;
                            })} `;
                          }
                        })} `;
                      }
                    })} `;
                  }
                })} `;
              }
            })}`;
          })}`;
        }
      })} ${validate_component(Tabs_content, "TabsContent").$$render($$result, { value: "maintenance" }, {}, {
        default: () => {
          return `${each(Object.entries(rental_unitByFloor), ([floor, rental_unit]) => {
            return `${validate_component(Card, "Card.Root").$$render($$result, { class: "mb-4" }, {}, {
              default: () => {
                return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
                      default: () => {
                        return `Floor ${escape(floor)} - Maintenance Status`;
                      }
                    })} `;
                  }
                })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Table, "Table.Root").$$render($$result, {}, {}, {
                      default: () => {
                        return `${validate_component(Table_header, "Table.Header").$$render($$result, {}, {}, {
                          default: () => {
                            return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                              default: () => {
                                return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Rental_unit`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Issue`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Description`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Status`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Completed`;
                                  }
                                })} `;
                              }
                            })} `;
                          }
                        })} ${validate_component(Table_body, "Table.Body").$$render($$result, {}, {}, {
                          default: () => {
                            return `${each(rental_unit, (rental_unit2) => {
                              return `${each(rental_unit2.maintenance, (issue) => {
                                return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${escape(rental_unit2.number)}`;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${escape(issue.title)}`;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${escape(issue.description)}`;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${validate_component(Badge, "Badge").$$render(
                                          $$result,
                                          {
                                            variant: issue.status === "COMPLETED" ? "default" : "outline"
                                          },
                                          {},
                                          {
                                            default: () => {
                                              return `${escape(issue.status)} `;
                                            }
                                          }
                                        )} `;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${issue.completed_at ? `${escape(new Date(issue.completed_at).toLocaleDateString())}` : `-`} `;
                                      }
                                    })} `;
                                  }
                                })}`;
                              })}`;
                            })} `;
                          }
                        })} `;
                      }
                    })} `;
                  }
                })} `;
              }
            })}`;
          })}`;
        }
      })} ${validate_component(Tabs_content, "TabsContent").$$render($$result, { value: "financial" }, {}, {
        default: () => {
          return `${each(Object.entries(rental_unitByFloor), ([floor, rental_unit]) => {
            return `${validate_component(Card, "Card.Root").$$render($$result, { class: "mb-4" }, {}, {
              default: () => {
                return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
                      default: () => {
                        return `Floor ${escape(floor)} - Financial Details`;
                      }
                    })} `;
                  }
                })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
                  default: () => {
                    return `<div class="space-y-4">${validate_component(Table, "Table.Root").$$render($$result, {}, {}, {
                      default: () => {
                        return `${validate_component(Table_header, "Table.Header").$$render($$result, {}, {}, {
                          default: () => {
                            return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                              default: () => {
                                return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Rental_unit`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Tenant`;
                                  }
                                })} ${each(data.months, (month) => {
                                  return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                    default: () => {
                                      return `${escape(month)}`;
                                    }
                                  })}`;
                                })} `;
                              }
                            })} `;
                          }
                        })} ${validate_component(Table_body, "Table.Body").$$render($$result, {}, {}, {
                          default: () => {
                            return `${each(rental_unit, (rental_unit2) => {
                              return `${each(rental_unit2.leases, (lease) => {
                                return `${each(lease.lease_tenants, ({ tenant }) => {
                                  return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                                    default: () => {
                                      return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(rental_unit2.number)}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(tenant.name)}`;
                                        }
                                      })} ${each(data.months, (month) => {
                                        return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                          default: () => {
                                            return `${escape(formatCurrency(balancesByTenant[tenant.id]?.[month] ?? 0))} `;
                                          }
                                        })}`;
                                      })} `;
                                    }
                                  })}`;
                                })}`;
                              })}`;
                            })} `;
                          }
                        })} `;
                      }
                    })} <div class="mt-4"><h4 class="text-lg font-semibold mb-2" data-svelte-h="svelte-1egl01u">Upcoming Payments</h4> ${validate_component(Table, "Table.Root").$$render($$result, {}, {}, {
                      default: () => {
                        return `${validate_component(Table_header, "Table.Header").$$render($$result, {}, {}, {
                          default: () => {
                            return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                              default: () => {
                                return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Rental_unit`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Due Date`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Amount`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Type`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Status`;
                                  }
                                })} `;
                              }
                            })} `;
                          }
                        })} ${validate_component(Table_body, "Table.Body").$$render($$result, {}, {}, {
                          default: () => {
                            return `${each(rental_unit, (rental_unit2) => {
                              return `${each(rental_unit2.leases, (lease) => {
                                return `${each(lease.payment_schedules.filter((ps) => new Date(ps.due_date) >= /* @__PURE__ */ new Date()), (schedule) => {
                                  return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                                    default: () => {
                                      return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(rental_unit2.number)}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(new Date(schedule.due_date).toLocaleDateString())}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(formatCurrency(schedule.expected_amount))}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${escape(schedule.type)}`;
                                        }
                                      })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${validate_component(Badge, "Badge").$$render(
                                            $$result,
                                            {
                                              variant: getPaymentStatusVariant(schedule.status)
                                            },
                                            {},
                                            {
                                              default: () => {
                                                return `${escape(schedule.status)} `;
                                              }
                                            }
                                          )} `;
                                        }
                                      })} `;
                                    }
                                  })}`;
                                })}`;
                              })}`;
                            })} `;
                          }
                        })} `;
                      }
                    })} </div></div> `;
                  }
                })} `;
              }
            })}`;
          })}`;
        }
      })} ${validate_component(Tabs_content, "TabsContent").$$render($$result, { value: "utilities" }, {}, {
        default: () => {
          return `${each(Object.entries(rental_unitByFloor), ([floor, rental_unit]) => {
            return `${validate_component(Card, "Card.Root").$$render($$result, { class: "mb-4" }, {}, {
              default: () => {
                return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Card_title, "Card.Title").$$render($$result, {}, {}, {
                      default: () => {
                        return `Floor ${escape(floor)} - Utility Details`;
                      }
                    })} `;
                  }
                })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
                  default: () => {
                    return `${validate_component(Table, "Table.Root").$$render($$result, {}, {}, {
                      default: () => {
                        return `${validate_component(Table_header, "Table.Header").$$render($$result, {}, {}, {
                          default: () => {
                            return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                              default: () => {
                                return `${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Rental_unit`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Meter`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Type`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Latest Reading`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Rate`;
                                  }
                                })} ${validate_component(Table_head, "Table.Head").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Status`;
                                  }
                                })} `;
                              }
                            })} `;
                          }
                        })} ${validate_component(Table_body, "Table.Body").$$render($$result, {}, {}, {
                          default: () => {
                            return `${each(rental_unit, (rental_unit2) => {
                              return `${each(rental_unit2.meters, (meter) => {
                                return `${validate_component(Table_row, "Table.Row").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${escape(rental_unit2.number)}`;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${escape(meter.name)}`;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${escape(meter.type)}`;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${meter.readings.length > 0 ? `${escape(meter.readings[meter.readings.length - 1].reading)}` : `${escape(meter.initial_reading)}`} `;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${escape(formatCurrency(meter.unit_rate))}`;
                                      }
                                    })} ${validate_component(Table_cell, "Table.Cell").$$render($$result, {}, {}, {
                                      default: () => {
                                        return `${validate_component(Badge, "Badge").$$render($$result, { variant: getStatusVariant(meter.status) }, {}, {
                                          default: () => {
                                            return `${escape(meter.status)} `;
                                          }
                                        })} `;
                                      }
                                    })} `;
                                  }
                                })}`;
                              })}`;
                            })} `;
                          }
                        })} `;
                      }
                    })} `;
                  }
                })} `;
              }
            })}`;
          })}`;
        }
      })}`;
    }
  })}</div>`;
});
export {
  Page as default
};
