import { c as create_ssr_component, v as validate_component, e as escape, b as each, a as add_attribute, w as missing_component } from "../../../../chunks/ssr.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import { C as Card_description } from "../../../../chunks/card-description.js";
import "clsx";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import "../../../../chunks/index2.js";
import { I as Icon } from "../../../../chunks/Icon.js";
import { C as Credit_card } from "../../../../chunks/credit-card.js";
const Calendar_days = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M8 2v4" }],
    ["path", { "d": "M16 2v4" }],
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "4",
        "rx": "2"
      }
    ],
    ["path", { "d": "M3 10h18" }],
    ["path", { "d": "M8 14h.01" }],
    ["path", { "d": "M12 14h.01" }],
    ["path", { "d": "M16 14h.01" }],
    ["path", { "d": "M8 18h.01" }],
    ["path", { "d": "M12 18h.01" }],
    ["path", { "d": "M16 18h.01" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "calendar-days" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Qr_code = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "rect",
      {
        "width": "5",
        "height": "5",
        "x": "3",
        "y": "3",
        "rx": "1"
      }
    ],
    [
      "rect",
      {
        "width": "5",
        "height": "5",
        "x": "16",
        "y": "3",
        "rx": "1"
      }
    ],
    [
      "rect",
      {
        "width": "5",
        "height": "5",
        "x": "3",
        "y": "16",
        "rx": "1"
      }
    ],
    ["path", { "d": "M21 16h-3a2 2 0 0 0-2 2v3" }],
    ["path", { "d": "M21 21v.01" }],
    ["path", { "d": "M12 7v3a2 2 0 0 1-2 2H7" }],
    ["path", { "d": "M3 12h.01" }],
    ["path", { "d": "M12 3h.01" }],
    ["path", { "d": "M12 16v.01" }],
    ["path", { "d": "M16 12h1" }],
    ["path", { "d": "M21 12v.01" }],
    ["path", { "d": "M12 21v-1" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "qr-code" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Settings = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      }
    ],
    ["circle", { "cx": "12", "cy": "12", "r": "3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "settings" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Tag = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
      }
    ],
    [
      "circle",
      {
        "cx": "7.5",
        "cy": "7.5",
        "r": ".5",
        "fill": "currentColor"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "tag" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Users = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      }
    ],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }],
    ["path", { "d": "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["path", { "d": "M16 3.13a4 4 0 0 1 0 7.75" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "users" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
function formatPercentage(value, total) {
  if (!total) return "0%";
  const percentage = value / total * 100;
  return `${percentage < 0 ? 0 : Math.round(percentage)}%`;
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  const routes = [
    {
      name: "Registration",
      href: `/events/${data.event.event_url}/register`,
      description: "Register new attendees",
      icon: Users,
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      name: "Payments",
      href: `/events/${data.event.event_url}/payments`,
      description: "Manage payments and transactions",
      icon: Credit_card,
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      name: "Name Tags",
      href: `/events/${data.event.event_url}/name-tags`,
      description: "Generate and print name tags",
      icon: Tag,
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      name: "QR Scanner",
      href: `/events/${data.event.event_url}/qr-checker`,
      description: "Scan QR codes for check-in",
      icon: Qr_code,
      color: "bg-yellow-500 hover:bg-yellow-600"
    },
    {
      name: "Settings",
      href: `/events/${data.event.event_url}/settings`,
      description: "Configure event settings",
      icon: Settings,
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ];
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
  };
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `${$$result.head += `<!-- HEAD_svelte-uhnuy1_START -->${$$result.title = `<title>${escape(data.event.event_name)} Dashboard</title>`, ""}<!-- HEAD_svelte-uhnuy1_END -->`, ""} <div class="container mx-auto px-4 py-8"> <div class="mb-8"><h1 class="text-4xl font-bold mb-2">${escape(data.event.event_name)}</h1>   <div class="flex items-center gap-2 mt-4">${validate_component(Calendar_days, "CalendarDays").$$render($$result, { class: "w-5 h-5 text-muted-foreground" }, {}, {})} <span class="text-sm text-muted-foreground">${escape(new Date(data.eventStatus.registrationStartDate).toLocaleDateString())} - 
                ${escape(new Date(data.eventStatus.registrationEndDate).toLocaleDateString())}</span> </div></div> <div class="flex gap-8"> <div class="w-1/4 space-y-4">${each(routes, (route) => {
    return `<a${add_attribute("href", route.href, 0)} class="block">${validate_component(Card, "Card").$$render(
      $$result,
      {
        class: `${route.color} text-white transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`
      },
      {},
      {
        default: () => {
          return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
            default: () => {
              return `<div class="flex items-center gap-3">${validate_component(route.icon || missing_component, "svelte:component").$$render($$result, { class: "w-6 h-6" }, {}, {})} <div>${validate_component(Card_title, "CardTitle").$$render($$result, { class: "text-lg" }, {}, {
                default: () => {
                  return `${escape(route.name)}`;
                }
              })} ${validate_component(Card_description, "CardDescription").$$render($$result, { class: "text-white/80" }, {}, {
                default: () => {
                  return `${escape(route.description)}`;
                }
              })} </div></div> `;
            }
          })} `;
        }
      }
    )} </a>`;
  })}</div>  <div class="w-3/4"> <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> ${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, { class: "text-lg" }, {}, {
            default: () => {
              return `Total Registrations`;
            }
          })} ${validate_component(Card_description, "CardDescription").$$render($$result, {}, {}, {
            default: () => {
              return `Overall registration count`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="text-3xl font-bold">${escape(data.stats.totalRegistrations)}</div> <p class="text-sm text-muted-foreground mt-1">Capacity: ${escape(formatPercentage(data.stats.totalRegistrations, data.event.other_info.capacity))}</p>`;
        }
      })}`;
    }
  })}  ${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, { class: "text-lg" }, {}, {
            default: () => {
              return `Payment Status`;
            }
          })} ${validate_component(Card_description, "CardDescription").$$render($$result, {}, {}, {
            default: () => {
              return `Registration payment overview`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="space-y-2"><div><div class="text-3xl font-bold text-green-600">${escape(data.stats.paidCount)}</div> <p class="text-sm text-muted-foreground" data-svelte-h="svelte-gg6kw4">Paid Registrations</p></div> <div><div class="text-3xl font-bold text-yellow-600">${escape(data.stats.totalRegistrations - data.stats.paidCount)}</div> <p class="text-sm text-muted-foreground" data-svelte-h="svelte-exd2oe">Pending Payments</p></div> <div class="mt-4 pt-4 border-t"><p class="text-sm text-muted-foreground" data-svelte-h="svelte-1wry7i4">Payment Rate</p> <div class="text-2xl font-bold">${escape(formatPercentage(data.stats.paidCount, data.stats.totalRegistrations))}</div></div></div>`;
        }
      })}`;
    }
  })}  ${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, { class: "text-lg" }, {}, {
            default: () => {
              return `Total Revenue`;
            }
          })} ${validate_component(Card_description, "CardDescription").$$render($$result, {}, {}, {
            default: () => {
              return `Overall earnings from registrations`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="space-y-2"><div class="text-3xl font-bold">${escape(formatCurrency(data.stats.totalRevenue))}</div> <p class="text-sm text-muted-foreground">From ${escape(data.stats.paidCount)} paid registrations</p></div>`;
        }
      })}`;
    }
  })}</div>  <div class="grid grid-cols-1 md:grid-cols-2 gap-6"> ${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, { class: "text-lg" }, {}, {
            default: () => {
              return `Ticket Distribution`;
            }
          })} ${validate_component(Card_description, "CardDescription").$$render($$result, {}, {}, {
            default: () => {
              return `Breakdown by ticket type`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="space-y-4">${each(Object.entries(data.stats.ticketTypeCounts), ([type, count]) => {
            return `<div><div class="flex justify-between items-center mb-1"><span class="text-sm font-medium">${escape(type)}</span> <span class="text-sm text-muted-foreground">${escape(count)}</span></div> <div class="h-2 bg-secondary rounded-full overflow-hidden"><div class="h-full bg-primary" style="${"width: " + escape(formatPercentage(count, data.stats.totalRegistrations), true)}"></div></div> </div>`;
          })}</div>`;
        }
      })}`;
    }
  })}  ${validate_component(Card, "Card").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(Card_header, "CardHeader").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Card_title, "CardTitle").$$render($$result, { class: "text-lg" }, {}, {
            default: () => {
              return `Recent Activity`;
            }
          })} ${validate_component(Card_description, "CardDescription").$$render($$result, {}, {}, {
            default: () => {
              return `Latest registrations and payments`;
            }
          })}`;
        }
      })} ${validate_component(Card_content, "CardContent").$$render($$result, {}, {}, {
        default: () => {
          return `<div class="space-y-4">${each(data.stats.recentActivity, (activity) => {
            return `<div class="flex items-start gap-3"><div${add_attribute(
              "class",
              `p-2 rounded-full ${activity.type === "registration" ? "bg-blue-100" : "bg-green-100"}`,
              0
            )}>${activity.type === "registration" ? `${validate_component(Users, "Users").$$render($$result, { class: "w-4 h-4 text-blue-600" }, {}, {})}` : `${validate_component(Credit_card, "CreditCard").$$render($$result, { class: "w-4 h-4 text-green-600" }, {}, {})}`}</div> <div><p class="text-sm">${escape(activity.description)}</p> <p class="text-xs text-muted-foreground">${escape(new Date(activity.timestamp).toLocaleString())} </p></div> </div>`;
          })}</div>`;
        }
      })}`;
    }
  })}</div></div></div></div>`;
});
export {
  Page as default
};
