import { c as create_ssr_component, v as validate_component, q as onDestroy, e as escape, b as each, a as add_attribute, w as missing_component } from "../../../../../chunks/ssr.js";
import { s as superForm } from "../../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../../chunks/formData.js";
import "../../../../../chunks/index2.js";
import { C as Card } from "../../../../../chunks/card.js";
import "clsx";
import { S as Switch } from "../../../../../chunks/switch.js";
import { I as Input } from "../../../../../chunks/input.js";
import { L as Label } from "../../../../../chunks/label.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../../chunks/table-row.js";
import { t as toast } from "../../../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
import { i as invalidate } from "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/button.js";
import { T as Trash_2 } from "../../../../../chunks/trash-2.js";
import { I as Icon } from "../../../../../chunks/Icon.js";
import { C as Check } from "../../../../../chunks/check.js";
const Clock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["polyline", { "points": "12 6 12 12 16 14" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "clock" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Triangle_alert = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "triangle-alert" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let filteredAttendees;
  let archivedCount;
  let expiredIds;
  let { data } = $$props;
  superForm(data.form, {
    onSubmit: ({ formData }) => {
      isUpdating = true;
      const formValues = Object.fromEntries(formData);
      console.log("[Client] Form data being submitted:", formValues);
      return true;
    },
    onResult: async ({ result }) => {
      console.log("[Client] Form submission result:", result);
      if (result.type === "success") {
        await Promise.all([invalidate(), invalidate()]);
        toast.success("Payment status updated");
      } else if (result.type === "error") {
        if (result.error === "PAYMENT_EXPIRED") {
          toast.error("Payment window has expired. Registration must be done again.");
        } else {
          toast.error("Failed to update payment status");
        }
      }
      setTimeout(
        () => {
          isUpdating = false;
        },
        2e3
      );
    },
    resetForm: false,
    applyAction: true,
    invalidateAll: true
  });
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
  };
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  let searchQuery = "";
  let showPaidOnly = false;
  let showUnpaidOnly = false;
  let showArchived = false;
  let isUpdating = false;
  let timers = {};
  onDestroy(() => {
    Object.values(timers).forEach((timer) => {
      clearInterval(timer.interval);
    });
  });
  const paymentsByReceiver = data.paymentSummary.totalByReceiver;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    filteredAttendees = data.attendees.filter((attendee) => (
      // Handle archived entries based on toggle
      (showArchived || attendee.attendance_status !== "archived") && // Apply search filter
      (!searchQuery || attendee.basic_info.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || attendee.basic_info.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) || attendee.basic_info.email?.toLowerCase().includes(searchQuery.toLowerCase())) && // Apply paid filter
      (!showPaidOnly || attendee.is_paid) && (!showUnpaidOnly || !attendee.is_paid)
    )).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    archivedCount = data.attendees.filter((a) => a.attendance_status === "archived").length;
    expiredIds = filteredAttendees.filter((attendee) => {
      const timer = timers[attendee.id];
      return timer?.timeLeft && Number(timer.timeLeft) <= 0 || timer?.isExpired || attendee.attendance_status === "expired";
    }).map((attendee) => attendee.id);
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-pq86yb_START -->${$$result.title = `<title>Payment Management - ${escape(data.event.event_name)}</title>`, ""}<!-- HEAD_svelte-pq86yb_END -->`, ""} <div class="container mx-auto px-4 py-8"><div class="mb-8"><h1 class="text-3xl font-bold mb-2" data-svelte-h="svelte-16eyabe">Payment Management</h1> <p class="text-gray-600">${escape(data.event.event_name)}</p></div>  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">${validate_component(Card, "Card").$$render($$result, { class: "p-6" }, {}, {
      default: () => {
        return `<h3 class="font-semibold text-lg mb-2" data-svelte-h="svelte-tkmlhg">Total Attendees</h3> <p class="text-2xl font-bold text-primary">${escape(data.attendees.length)}</p>`;
      }
    })} ${validate_component(Card, "Card").$$render($$result, { class: "p-6" }, {}, {
      default: () => {
        return `<h3 class="font-semibold text-lg mb-2" data-svelte-h="svelte-1sinnb5">Grand Total</h3> <p class="text-2xl font-bold text-primary">${escape(formatCurrency(data.paymentSummary.grandTotal))}</p>`;
      }
    })} ${validate_component(Card, "Card").$$render($$result, { class: "p-6" }, {}, {
      default: () => {
        return `<h3 class="font-semibold text-lg mb-2" data-svelte-h="svelte-1vrx0yf">Total Paid</h3> <p class="text-2xl font-bold text-green-600">${escape(formatCurrency(data.paymentSummary.totalPaid))}</p>`;
      }
    })} ${validate_component(Card, "Card").$$render($$result, { class: "p-6" }, {}, {
      default: () => {
        return `<h3 class="font-semibold text-lg mb-2" data-svelte-h="svelte-r4woyy">Total Unpaid</h3> <p class="text-2xl font-bold text-red-600">${escape(formatCurrency(data.paymentSummary.totalUnpaid))}</p>`;
      }
    })}</div>  ${Object.keys(paymentsByReceiver).length > 0 ? `<div class="container mx-auto px-4 pb-8">${validate_component(Card, "Card").$$render($$result, { class: "p-6" }, {}, {
      default: () => {
        return `<h3 class="font-semibold text-lg mb-4" data-svelte-h="svelte-rnrzh6">Payments by Receiver</h3> <div class="grid grid-cols-1 md:grid-cols-3 gap-4">${each(Object.entries(paymentsByReceiver), ([receiver, amount]) => {
          return `<div class="${"bg-gray-50 p-4 rounded-lg relative " + escape(isUpdating ? "opacity-50" : "", true)}">${isUpdating ? `<div class="absolute inset-0 flex items-center justify-center bg-gray-50/50" data-svelte-h="svelte-1v8p48n"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div> </div>` : ``} <p class="text-sm text-gray-600 mb-1" data-svelte-h="svelte-1w7xd6d">Receiver</p> <p class="font-medium mb-2">${escape(receiver)}</p> <p class="text-sm text-gray-600 mb-1" data-svelte-h="svelte-1mpahxy">Total Amount</p> <p class="text-lg font-bold text-primary">${escape(formatCurrency(amount))}</p> </div>`;
        })}</div>`;
      }
    })}</div>` : ``}  <div class="flex items-center justify-between mb-4"><div class="flex items-center gap-4">${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "search",
        placeholder: "Search attendees...",
        class: "w-[300px]",
        value: searchQuery
      },
      {
        value: ($$value) => {
          searchQuery = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${expiredIds.length > 0 ? `${validate_component(Button, "Button").$$render(
      $$result,
      {
        variant: "destructive",
        size: "sm",
        class: "flex items-center gap-2"
      },
      {},
      {
        default: () => {
          return `${validate_component(Trash_2, "Trash2").$$render($$result, { class: "w-4 h-4" }, {}, {})}
                    Clear ${escape(expiredIds.length)} Expired ${escape(expiredIds.length === 1 ? "Entry" : "Entries")}`;
        }
      }
    )}` : ``}</div> <div class="flex items-center gap-2"><div class="flex items-center gap-2">${validate_component(Switch, "Switch").$$render(
      $$result,
      { checked: showPaidOnly },
      {
        checked: ($$value) => {
          showPaidOnly = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Paid Only`;
      }
    })}</div> <div class="flex items-center gap-2">${validate_component(Switch, "Switch").$$render(
      $$result,
      { checked: showUnpaidOnly },
      {
        checked: ($$value) => {
          showUnpaidOnly = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Unpaid Only`;
      }
    })}</div> <div class="flex items-center gap-2">${validate_component(Switch, "Switch").$$render(
      $$result,
      { checked: showArchived },
      {
        checked: ($$value) => {
          showArchived = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Show Archived (${escape(archivedCount)})`;
      }
    })} ${showArchived && archivedCount > 0 ? `<form action="?/deleteAllArchived" method="POST"><input type="hidden" name="eventUrl"${add_attribute("value", data.event.url, 0)}> ${validate_component(Button, "Button").$$render(
      $$result,
      {
        variant: "destructive",
        size: "sm",
        class: "flex items-center gap-2"
      },
      {},
      {
        default: () => {
          return `${validate_component(Trash_2, "Trash2").$$render($$result, { class: "w-3 h-3" }, {}, {})}
                            Delete All Archives`;
        }
      }
    )}</form>` : ``}</div></div></div>  <div class="bg-white rounded-lg shadow overflow-x-auto">${validate_component(Table, "Table").$$render($$result, {}, {}, {
      default: () => {
        return `${validate_component(Table_header, "TableHeader").$$render($$result, {}, {}, {
          default: () => {
            return `${validate_component(Table_row, "TableRow").$$render($$result, {}, {}, {
              default: () => {
                return `${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Name`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Email`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Ticket Type`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Amount`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Reference`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Registered`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Payment Status`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, { class: "text-right" }, {}, {
                  default: () => {
                    return `Actions`;
                  }
                })}`;
              }
            })}`;
          }
        })} ${validate_component(Table_body, "TableBody").$$render($$result, {}, {}, {
          default: () => {
            return `${filteredAttendees.length ? each(filteredAttendees, (attendee) => {
              return `${validate_component(Table_row, "TableRow").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(attendee.basic_info.firstName)} ${escape(attendee.basic_info.lastName)} `;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(attendee.basic_info.email)}`;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(attendee.ticket_info.type)}`;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(formatCurrency(attendee.ticket_info.price || 0))}`;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${attendee.reference_code_url ? `<a href="${"/events/" + escape(data.event.event_url, true) + "/" + escape(attendee.reference_code_url, true)}" class="text-blue-600 hover:text-blue-800 hover:underline">${escape(attendee.reference_code_url)} </a>` : `-`} `;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(formatDate(attendee.created_at))} `;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${attendee.attendance_status === "expired" || timers[attendee.id]?.isExpired ? `<div class="flex items-center gap-2">${validate_component(Triangle_alert, "AlertTriangle").$$render($$result, { class: "w-4 h-4 text-red-500" }, {}, {})} <span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800" data-svelte-h="svelte-1mknjlc">Expired</span> </div>` : `${attendee.attendance_status === "archived" ? `<div class="flex items-center gap-2">${validate_component(Triangle_alert, "AlertTriangle").$$render($$result, { class: "w-4 h-4 text-gray-500" }, {}, {})} <span class="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800" data-svelte-h="svelte-hsr27f">Archived</span> </div>` : `<div class="flex items-center gap-2">${validate_component((attendee.is_paid ? Check : Clock) || missing_component, "svelte:component").$$render(
                        $$result,
                        {
                          class: "w-4 h-4 " + (attendee.is_paid ? "text-green-500" : "text-yellow-500")
                        },
                        {},
                        {}
                      )} <span class="${"px-2 py-1 rounded-full text-xs font-semibold " + escape(
                        attendee.is_paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
                        true
                      )}">${escape(attendee.is_paid ? "Paid" : "Pending")}</span> ${!attendee.is_paid && timers[attendee.id] && !timers[attendee.id].isExpired ? `<span class="${"text-sm " + escape(
                        timers[attendee.id].timeLeft === "00:00:00" ? "text-red-600 font-semibold" : "text-gray-600",
                        true
                      )}">(${escape(timers[attendee.id].timeLeft)})
                                        </span>` : ``} </div>`}`} `;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, { class: "text-right" }, {}, {
                    default: () => {
                      return `${!attendee.is_paid && attendee.attendance_status !== "expired" && attendee.attendance_status !== "archived" ? `<form method="POST" action="?/updatePayment" class="flex items-center justify-end"><input type="hidden" name="attendeeId"${add_attribute("value", attendee.id, 0)}> <input type="hidden" name="receivedBy"${add_attribute("value", data.session?.user?.id, 0)}> ${validate_component(Button, "Button").$$render(
                        $$result,
                        {
                          type: "submit",
                          variant: "outline",
                          size: "sm",
                          disabled: !data.session?.user?.id,
                          class: "relative"
                        },
                        {},
                        {
                          default: () => {
                            return `<div class="flex items-center">${validate_component(Check, "Check").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
                                            Confirm Payment</div> `;
                          }
                        }
                      )} </form>` : ``} `;
                    }
                  })} `;
                }
              })}`;
            }) : `${validate_component(Table_row, "TableRow").$$render($$result, {}, {}, {
              default: () => {
                return `${validate_component(Table_cell, "TableCell").$$render(
                  $$result,
                  {
                    colspan: 10,
                    class: "text-center py-8 text-gray-500"
                  },
                  {},
                  {
                    default: () => {
                      return `No attendees found
                        `;
                    }
                  }
                )} `;
              }
            })}`}`;
          }
        })}`;
      }
    })}</div></div>`;
  } while (!$$settled);
  return $$rendered;
});
export {
  Page as default
};
