import { y as setContext, B as hasContext, g as getContext, c as create_ssr_component, s as subscribe, n as noop, k as compute_rest_props, l as spread, o as escape_object, a as add_attribute, b as each, e as escape, v as validate_component } from "../../../../chunks/ssr.js";
import { g as globals } from "../../../../chunks/globals.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import "../../../../chunks/client.js";
import "../../../../chunks/index2.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../chunks/index7.js";
import { I as Input } from "../../../../chunks/input.js";
import { T as Textarea } from "../../../../chunks/textarea.js";
import { w as writable } from "../../../../chunks/index4.js";
import { nanoid } from "nanoid/non-secure";
import { b as billingSchema, a as billingTypeEnum, u as utilityTypeEnum, p as paymentStatusEnum } from "../../../../chunks/formSchema.js";
import "memoize-weak";
import { a as zodClient } from "../../../../chunks/zod.js";
import { B as Button } from "../../../../chunks/button.js";
const FORM_FIELD = Symbol("FORM_FIELD_CTX");
function setFormField(props) {
  setContext(FORM_FIELD, props);
  return props;
}
function getFormField() {
  if (!hasContext(FORM_FIELD)) {
    ctxError("Form.Field");
  }
  return getContext(FORM_FIELD);
}
const FORM_CONTROL = Symbol("FORM_CONTROL_CTX");
function setFormControl(props) {
  setContext(FORM_CONTROL, props);
  return props;
}
function getFormControl() {
  if (!hasContext(FORM_CONTROL)) {
    ctxError("<Control />");
  }
  return getContext(FORM_CONTROL);
}
function ctxError(ctx) {
  throw new Error(`Unable to find \`${ctx}\` context. Did you forget to wrap the component in a \`${ctx}\`?`);
}
function getAriaDescribedBy({ fieldErrorsId = void 0, descriptionId = void 0, errors }) {
  let describedBy = "";
  if (descriptionId) {
    describedBy += descriptionId + " ";
  }
  if (errors.length && fieldErrorsId) {
    describedBy += fieldErrorsId;
  }
  return describedBy ? describedBy.trim() : void 0;
}
function getAriaRequired(constraints) {
  if (!("required" in constraints))
    return void 0;
  return constraints.required ? "true" : void 0;
}
function getAriaInvalid(errors) {
  return errors && errors.length ? "true" : void 0;
}
function getDataFsError(errors) {
  return errors && errors.length ? "" : void 0;
}
function generateId() {
  return nanoid(5);
}
function extractErrorArray(errors) {
  if (Array.isArray(errors))
    return errors;
  if (typeof errors === "object" && "_errors" in errors) {
    if (errors._errors !== void 0)
      return errors._errors;
  }
  return [];
}
function getValueAtPath(path, obj) {
  const keys = path.split(/[[\].]/).filter(Boolean);
  let value = obj;
  for (const key of keys) {
    if (typeof value !== "object" || value === null) {
      return void 0;
    }
    value = value[key];
  }
  return value;
}
const Field = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let formErrors;
  let formConstraints;
  let formTainted;
  let formData;
  let $formTainted, $$unsubscribe_formTainted = noop, $$subscribe_formTainted = () => ($$unsubscribe_formTainted(), $$unsubscribe_formTainted = subscribe(formTainted, ($$value) => $formTainted = $$value), formTainted);
  let $formConstraints, $$unsubscribe_formConstraints = noop, $$subscribe_formConstraints = () => ($$unsubscribe_formConstraints(), $$unsubscribe_formConstraints = subscribe(formConstraints, ($$value) => $formConstraints = $$value), formConstraints);
  let $formErrors, $$unsubscribe_formErrors = noop, $$subscribe_formErrors = () => ($$unsubscribe_formErrors(), $$unsubscribe_formErrors = subscribe(formErrors, ($$value) => $formErrors = $$value), formErrors);
  let $formData, $$unsubscribe_formData = noop, $$subscribe_formData = () => ($$unsubscribe_formData(), $$unsubscribe_formData = subscribe(formData, ($$value) => $formData = $$value), formData);
  let $errors, $$unsubscribe_errors;
  let $tainted, $$unsubscribe_tainted;
  let { form } = $$props;
  let { name } = $$props;
  const field = {
    name: writable(name),
    errors: writable([]),
    constraints: writable({}),
    tainted: writable(false),
    fieldErrorsId: writable(),
    descriptionId: writable(),
    form
  };
  const { tainted, errors } = field;
  $$unsubscribe_tainted = subscribe(tainted, (value) => $tainted = value);
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  setFormField(field);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  $$subscribe_formErrors({ errors: formErrors, constraints: formConstraints, tainted: formTainted, form: formData } = form, $$subscribe_formConstraints(), $$subscribe_formTainted(), $$subscribe_formData());
  {
    field.name.set(name);
  }
  {
    field.errors.set(extractErrorArray(getValueAtPath(name, $formErrors)));
  }
  {
    field.constraints.set(getValueAtPath(name, $formConstraints) ?? {});
  }
  {
    field.tainted.set($formTainted ? getValueAtPath(name, $formTainted) === true : false);
  }
  $$unsubscribe_formTainted();
  $$unsubscribe_formConstraints();
  $$unsubscribe_formErrors();
  $$unsubscribe_formData();
  $$unsubscribe_errors();
  $$unsubscribe_tainted();
  return ` ${slots.default ? slots.default({
    value: $formData[name],
    errors: $errors,
    tainted: $tainted,
    constraints: $formConstraints[name]
  }) : ``}`;
});
const Control = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let errorAttr;
  let attrs;
  let labelAttrs;
  let $idStore, $$unsubscribe_idStore;
  let $constraints, $$unsubscribe_constraints;
  let $errors, $$unsubscribe_errors;
  let $descriptionId, $$unsubscribe_descriptionId;
  let $fieldErrorsId, $$unsubscribe_fieldErrorsId;
  let $name, $$unsubscribe_name;
  let { id = generateId() } = $$props;
  const { name, fieldErrorsId, descriptionId, errors, constraints } = getFormField();
  $$unsubscribe_name = subscribe(name, (value) => $name = value);
  $$unsubscribe_fieldErrorsId = subscribe(fieldErrorsId, (value) => $fieldErrorsId = value);
  $$unsubscribe_descriptionId = subscribe(descriptionId, (value) => $descriptionId = value);
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  $$unsubscribe_constraints = subscribe(constraints, (value) => $constraints = value);
  const controlContext = {
    id: writable(id),
    attrs: writable(),
    labelAttrs: writable()
  };
  const { id: idStore } = controlContext;
  $$unsubscribe_idStore = subscribe(idStore, (value) => $idStore = value);
  setFormControl(controlContext);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
  {
    controlContext.id.set(id);
  }
  errorAttr = getDataFsError($errors);
  attrs = {
    name: $name,
    id: $idStore,
    "data-fs-error": errorAttr,
    "aria-describedby": getAriaDescribedBy({
      fieldErrorsId: $fieldErrorsId,
      descriptionId: $descriptionId,
      errors: $errors
    }),
    "aria-invalid": getAriaInvalid($errors),
    "aria-required": getAriaRequired($constraints),
    "data-fs-control": ""
  };
  labelAttrs = {
    for: $idStore,
    "data-fs-label": "",
    "data-fs-error": errorAttr
  };
  {
    controlContext.attrs.set(attrs);
  }
  {
    controlContext.labelAttrs.set(labelAttrs);
  }
  $$unsubscribe_idStore();
  $$unsubscribe_constraints();
  $$unsubscribe_errors();
  $$unsubscribe_descriptionId();
  $$unsubscribe_fieldErrorsId();
  $$unsubscribe_name();
  return ` ${slots.default ? slots.default({ attrs }) : ``}`;
});
const Label = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let localLabelAttrs;
  let $$restProps = compute_rest_props($$props, ["asChild", "el"]);
  let $labelAttrsStore, $$unsubscribe_labelAttrsStore;
  let { asChild = false } = $$props;
  let { el = void 0 } = $$props;
  const { labelAttrs: labelAttrsStore } = getFormControl();
  $$unsubscribe_labelAttrsStore = subscribe(labelAttrsStore, (value) => $labelAttrsStore = value);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  localLabelAttrs = { ...$labelAttrsStore, ...$$restProps };
  $$unsubscribe_labelAttrsStore();
  return ` ${asChild ? `${slots.default ? slots.default({ labelAttrs: localLabelAttrs }) : ``}` : `<label${spread([escape_object(localLabelAttrs)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ labelAttrs: localLabelAttrs }) : ``}</label>`}`;
});
const Field_errors = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let errorAttr;
  let fieldErrorsAttrs;
  let errorAttrs;
  let $$restProps = compute_rest_props($$props, ["id", "asChild", "el"]);
  let $fieldErrorsId, $$unsubscribe_fieldErrorsId;
  let $errors, $$unsubscribe_errors;
  const { fieldErrorsId, errors } = getFormField();
  $$unsubscribe_fieldErrorsId = subscribe(fieldErrorsId, (value) => $fieldErrorsId = value);
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  let { id = generateId() } = $$props;
  let { asChild = false } = $$props;
  let { el = void 0 } = $$props;
  if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  errorAttr = getDataFsError($errors);
  {
    fieldErrorsId.set(id);
  }
  fieldErrorsAttrs = {
    id: $fieldErrorsId,
    "data-fs-error": errorAttr,
    "data-fs-field-errors": "",
    "aria-live": "assertive",
    ...$$restProps
  };
  errorAttrs = {
    "data-fs-field-error": "",
    "data-fs-error": errorAttr
  };
  $$unsubscribe_fieldErrorsId();
  $$unsubscribe_errors();
  return ` ${asChild ? `${slots.default ? slots.default({
    errors: $errors,
    fieldErrorsAttrs,
    errorAttrs
  }) : ``}` : `<div${spread([escape_object(fieldErrorsAttrs)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({
    errors: $errors,
    fieldErrorsAttrs,
    errorAttrs
  }) : ` ${each($errors, (error) => {
    return `<div${spread([escape_object(errorAttrs)], {})}>${escape(error)}</div>`;
  })} `}</div>`}`;
});
const { Object: Object_1 } = globals;
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let billingTypeSelected;
  let utilityTypeSelected;
  let statusSelected;
  let leaseSelected;
  let showUtilityType;
  let $formData, $$unsubscribe_formData;
  let { data } = $$props;
  const form = superForm(data.form, {
    validators: zodClient(billingSchema),
    taintedMessage: null,
    resetForm: true,
    onSubmit: ({ formData: formData2, cancel }) => {
      const formDataObj = Object.fromEntries(formData2);
      console.log("Form data being submitted:", formDataObj);
      return;
    }
  });
  let { form: formData, enhance, reset } = form;
  $$unsubscribe_formData = subscribe(formData, (value) => $formData = value);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    billingTypeSelected = $formData.type ? {
      value: $formData.type,
      label: $formData.type
    } : void 0;
    utilityTypeSelected = $formData.utilityType ? {
      value: $formData.utilityType,
      label: $formData.utilityType
    } : void 0;
    statusSelected = $formData.status ? {
      value: $formData.status,
      label: $formData.status
    } : void 0;
    leaseSelected = $formData.leaseId ? {
      value: $formData.leaseId,
      label: data.leases.find((l) => l.id === $formData.leaseId)?.leaseName ?? "Select a lease"
    } : void 0;
    ($formData.amount || 0) - ($formData.paidAmount || 0);
    showUtilityType = $formData.type === "UTILITY";
    $$rendered = `  <div class="container mx-auto p-4 flex"> <div class="w-2/3 pr-4"><h2 class="text-xl font-bold mb-2" data-svelte-h="svelte-7rudfw">Accounts List</h2> <ul class="space-y-2">${each(data.billings, (account) => {
      return `<li class="bg-gray-100 p-4 rounded shadow"><div class="flex justify-between items-start mb-2"><div><span class="font-bold">${escape(account.lease.leaseName)}</span> <span class="mx-2" data-svelte-h="svelte-1hxruir">|</span> <span class="text-blue-600">${escape(account.type)}</span> <span class="mx-2" data-svelte-h="svelte-1hxruir">|</span> <span class="text-green-600">${escape(account.category)}</span></div> <div>${validate_component(Button, "Button").$$render($$result, { class: "mr-2" }, {}, {
        default: () => {
          return `Edit`;
        }
      })} <form method="POST" action="?/delete" class="inline"><input type="hidden" name="id"${add_attribute("value", account.id, 0)}> ${validate_component(Button, "Button").$$render($$result, { type: "submit", variant: "destructive" }, {}, {
        default: () => {
          return `Delete`;
        }
      })}</form> </div></div> <div class="grid grid-cols-2 gap-2 text-sm"><div><strong data-svelte-h="svelte-9u2o5c">Amount:</strong> ${escape(account.amount)}</div> <div><strong data-svelte-h="svelte-1pxy306">Paid:</strong> ${escape(account.paidAmount || 0)}</div> <div><strong data-svelte-h="svelte-1bu72em">Balance:</strong> ${escape(account.amount - (account.paidAmount || 0))}</div> <div><strong data-svelte-h="svelte-14kvxud">Date Issued:</strong> ${escape(new Date(account.dateIssued).toLocaleDateString())}</div> <div><strong data-svelte-h="svelte-17xzdey">Due Date:</strong> ${escape(account.dueOn ? new Date(account.dueOn).toLocaleDateString() : "N/A")}</div></div> ${account.notes ? `<div class="mt-2"><strong data-svelte-h="svelte-5k9uvd">Notes:</strong> ${escape(account.notes)} </div>` : ``} </li>`;
    })}</ul></div>  <div class="w-1/3 pl-4">${`<h1 class="text-2xl font-bold mb-4">${escape("Add")} Account</h1> <form method="POST"${add_attribute("action", "?/create", 0)} class="space-y-4 mb-8">${``} ${validate_component(Field, "Field").$$render($$result, { form, name: "leaseId" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Lease`;
              }
            })} ${validate_component(Root, "Select.Root").$$render(
              $$result,
              {
                selected: leaseSelected,
                onSelectedChange: (s) => {
                  if (s) $formData.leaseId = s.value;
                }
              },
              {},
              {
                default: () => {
                  return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, Object_1.assign({}, attrs), {}, {
                    default: () => {
                      return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a lease" }, {}, {})}`;
                    }
                  })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
                    default: () => {
                      return `${each(data.leases, (lease) => {
                        return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: lease.id, label: lease.leaseName }, {}, {})}`;
                      })}`;
                    }
                  })}`;
                }
              }
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} ${validate_component(Field, "Field").$$render($$result, { form, name: "type" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Account Type`;
              }
            })} ${validate_component(Root, "Select.Root").$$render(
              $$result,
              {
                selected: billingTypeSelected,
                onSelectedChange: (s) => {
                  if (s) $formData.type = s.value;
                }
              },
              {},
              {
                default: () => {
                  return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, Object_1.assign({}, attrs), {}, {
                    default: () => {
                      return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select an account type" }, {}, {})}`;
                    }
                  })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
                    default: () => {
                      return `${each(billingTypeEnum.enumValues, (type) => {
                        return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: type, label: type }, {}, {})}`;
                      })}`;
                    }
                  })}`;
                }
              }
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} ${showUtilityType ? `${validate_component(Field, "Field").$$render($$result, { form, name: "utilityType" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Utility Type`;
              }
            })} ${validate_component(Root, "Select.Root").$$render(
              $$result,
              {
                selected: utilityTypeSelected,
                onSelectedChange: (s) => {
                  if (s) $formData.utilityType = s.value;
                }
              },
              {},
              {
                default: () => {
                  return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, Object_1.assign({}, attrs), {}, {
                    default: () => {
                      return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a utility type" }, {}, {})}`;
                    }
                  })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
                    default: () => {
                      return `${each(utilityTypeEnum.enumValues, (type) => {
                        return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: type, label: type }, {}, {})}`;
                      })}`;
                    }
                  })}`;
                }
              }
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })}` : ``} ${validate_component(Field, "Field").$$render($$result, { form, name: "amount" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Amount`;
              }
            })} ${validate_component(Input, "Input").$$render(
              $$result,
              Object_1.assign({}, { type: "number" }, attrs, { min: "0" }, { step: "0.01" }, { value: $formData.amount }),
              {
                value: ($$value) => {
                  $formData.amount = $$value;
                  $$settled = false;
                }
              },
              {}
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} ${validate_component(Field, "Field").$$render($$result, { form, name: "paidAmount" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Paid Amount`;
              }
            })} ${validate_component(Input, "Input").$$render(
              $$result,
              Object_1.assign({}, { type: "number" }, attrs, { min: "0" }, { step: "0.01" }, { value: $formData.paidAmount }),
              {
                value: ($$value) => {
                  $formData.paidAmount = $$value;
                  $$settled = false;
                }
              },
              {}
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} <div class="space-y-2">${validate_component(Label, "Label").$$render($$result, {}, {}, {
      default: () => {
        return `Balance`;
      }
    })} ${validate_component(Input, "Input").$$render(
      $$result,
      {
        type: "number",
        value: ($formData.amount || 0) - ($formData.paidAmount || 0),
        disabled: true,
        class: "bg-gray-100"
      },
      {},
      {}
    )}</div> ${validate_component(Field, "Field").$$render($$result, { form, name: "status" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Status`;
              }
            })} ${validate_component(Root, "Select.Root").$$render(
              $$result,
              {
                selected: statusSelected,
                onSelectedChange: (s) => {
                  if (s) $formData.status = s.value;
                }
              },
              {},
              {
                default: () => {
                  return `${validate_component(Select_trigger, "Select.Trigger").$$render($$result, Object_1.assign({}, attrs), {}, {
                    default: () => {
                      return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select a status" }, {}, {})}`;
                    }
                  })} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
                    default: () => {
                      return `${each(paymentStatusEnum.enumValues, (status) => {
                        return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: status, label: status }, {}, {})}`;
                      })}`;
                    }
                  })}`;
                }
              }
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} ${validate_component(Field, "Field").$$render($$result, { form, name: "billingDate" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Billing Date`;
              }
            })} ${validate_component(Input, "Input").$$render(
              $$result,
              Object_1.assign({}, { type: "date" }, attrs, { value: $formData.billingDate }),
              {
                value: ($$value) => {
                  $formData.billingDate = $$value;
                  $$settled = false;
                }
              },
              {}
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} ${validate_component(Field, "Field").$$render($$result, { form, name: "dueDate" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Due Date`;
              }
            })} ${validate_component(Input, "Input").$$render(
              $$result,
              Object_1.assign({}, { type: "date" }, attrs, { value: $formData.dueDate }),
              {
                value: ($$value) => {
                  $formData.dueDate = $$value;
                  $$settled = false;
                }
              },
              {}
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} ${validate_component(Field, "Field").$$render($$result, { form, name: "notes" }, {}, {
      default: () => {
        return `${validate_component(Control, "Control").$$render($$result, {}, {}, {
          default: ({ attrs }) => {
            return `${validate_component(Label, "Label").$$render($$result, {}, {}, {
              default: () => {
                return `Notes`;
              }
            })} ${validate_component(Textarea, "Textarea").$$render(
              $$result,
              Object_1.assign({}, attrs, { value: $formData.notes }),
              {
                value: ($$value) => {
                  $formData.notes = $$value;
                  $$settled = false;
                }
              },
              {}
            )}`;
          }
        })} ${validate_component(Field_errors, "FieldErrors").$$render($$result, { class: "text-red-500 text-sm mt-1" }, {}, {})}`;
      }
    })} ${validate_component(Button, "Button").$$render($$result, { type: "submit" }, {}, {
      default: () => {
        return `${escape("Add")} Account`;
      }
    })} ${``}</form>`}</div></div>  <div class="fixed bottom-4 right-4">${validate_component(Button, "Button").$$render(
      $$result,
      {
        class: "rounded-full w-16 h-16 flex items-center justify-center text-2xl"
      },
      {},
      {
        default: () => {
          return `${escape("×")}`;
        }
      }
    )}</div> ${``}`;
  } while (!$$settled);
  $$unsubscribe_formData();
  return $$rendered;
});
export {
  Page as default
};
