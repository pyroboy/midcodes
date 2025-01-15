import { c as create_ssr_component, s as subscribe, e as escape, v as validate_component, b as each, a as add_attribute } from "../../../../../chunks/ssr.js";
import { s as superForm } from "../../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../../chunks/formData.js";
import "../../../../../chunks/index2.js";
import { C as Card } from "../../../../../chunks/card.js";
import { c as cn } from "../../../../../chunks/utils.js";
import { S as Switch } from "../../../../../chunks/switch.js";
import { I as Input } from "../../../../../chunks/input.js";
import { L as Label } from "../../../../../chunks/label.js";
import { T as Table, a as Table_header, b as Table_row, c as Table_head, d as Table_body, e as Table_cell } from "../../../../../chunks/table-row.js";
import "qr-code-styling";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/button.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let filteredAttendees;
  let $form, $$unsubscribe_form;
  let { data } = $$props;
  const { form, enhance } = superForm(data.form);
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  let searchQuery = "";
  let showPrintedOnly = false;
  let showUnprintedOnly = true;
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    filteredAttendees = data.attendees.filter((attendee) => {
      const matchesSearch = searchQuery === "" || Object.values(attendee.basic_info).some((value) => value?.toString().toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPrintStatus = !showPrintedOnly && !showUnprintedOnly || showPrintedOnly && attendee.is_printed || showUnprintedOnly && !attendee.is_printed;
      return matchesSearch && matchesPrintStatus;
    });
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-1ncajlu_START -->${$$result.title = `<title>Name Tags - ${escape(data.event.event_name)}</title>`, ""}<!-- HEAD_svelte-1ncajlu_END -->`, ""} <div class="container mx-auto px-4 py-8"><div class="mb-8"><h1 class="text-3xl font-bold mb-2" data-svelte-h="svelte-l748tp">Name Tags</h1> <p class="text-gray-600">${escape(data.event.event_name)}</p></div>  ${validate_component(Card, "Card").$$render($$result, { class: "p-6 mb-8" }, {}, {
      default: () => {
        return `<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><h3 class="font-semibold text-lg mb-2" data-svelte-h="svelte-tkmlhg">Total Attendees</h3> <p class="text-2xl font-bold text-primary">${escape(data.attendees.length)}</p></div> <div><h3 class="font-semibold text-lg mb-2" data-svelte-h="svelte-12coxbn">Printed</h3> <p class="text-2xl font-bold text-green-600">${escape(data.attendees.filter((a) => a.is_printed).length)}</p></div> <div><h3 class="font-semibold text-lg mb-2" data-svelte-h="svelte-1rgc02i">Not Printed</h3> <p class="text-2xl font-bold text-red-600">${escape(data.attendees.filter((a) => !a.is_printed).length)}</p></div></div>`;
      }
    })}  <div class="flex flex-col md:flex-row gap-4 mb-6"><div class="flex-1">${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "search",
        placeholder: "Search attendees...",
        value: searchQuery
      },
      {
        value: ($$value) => {
          searchQuery = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div> <div class="flex items-center gap-6"><div class="flex items-center gap-2">${validate_component(Switch, "Switch").$$render(
      $$result,
      { checked: showPrintedOnly },
      {
        checked: ($$value) => {
          showPrintedOnly = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Printed Only`;
      }
    })}</div> <div class="flex items-center gap-2">${validate_component(Switch, "Switch").$$render(
      $$result,
      { checked: showUnprintedOnly },
      {
        checked: ($$value) => {
          showUnprintedOnly = $$value;
          $$settled = false;
        }
      },
      {}
    )} ${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Not Printed Only`;
      }
    })}</div></div></div>  <div class="bg-white rounded-lg shadow overflow-x-auto">${validate_component(Table, "Table").$$render($$result, {}, {}, {
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
                    return `Phone`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Ticket Type`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Print Status`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
                  default: () => {
                    return `Last Updated`;
                  }
                })} ${validate_component(Table_head, "TableHead").$$render($$result, {}, {}, {
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
                      return `${escape(attendee.basic_info.phone)}`;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${escape(attendee.ticket_info.type)}`;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `<div class="flex items-center gap-2">${validate_component(Switch, "Switch").$$render(
                        $$result,
                        {
                          checked: attendee.is_printed,
                          onCheckedChange: (checked) => {
                            $form.attendeeId = attendee.id;
                            $form.isPrinted = checked;
                          }
                        },
                        {},
                        {}
                      )} <span${add_attribute("class", cn("text-sm font-medium", attendee.is_printed ? "text-green-600" : "text-red-600"), 0)}>${escape(attendee.is_printed ? "Printed" : "Not Printed")} </span></div> `;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `<span class="text-sm text-gray-600">${escape(formatDate(attendee.updated_at))}</span> `;
                    }
                  })} ${validate_component(Table_cell, "TableCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `${validate_component(Button, "Button").$$render($$result, { variant: "outline", size: "sm" }, {}, {
                        default: () => {
                          return `Print Preview
                            `;
                        }
                      })} `;
                    }
                  })} `;
                }
              })}`;
            }) : `${validate_component(Table_row, "TableRow").$$render($$result, {}, {}, {
              default: () => {
                return `${validate_component(Table_cell, "TableCell").$$render(
                  $$result,
                  {
                    colspan: 7,
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
    })}</div></div>  ${``}`;
  } while (!$$settled);
  $$unsubscribe_form();
  return $$rendered;
});
export {
  Page as default
};
