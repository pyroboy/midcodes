import { y as setContext, g as getContext, c as create_ssr_component, k as compute_rest_props, s as subscribe, l as spread, o as escape_object, m as escape_attribute_value, a as add_attribute, v as validate_component } from "./ssr.js";
import "dequal";
import { o as omit, m as makeElement, e as disabledAttr, f as executeCallbacks, b as addMeltEventListener, k as kbd, s as styleToString, c as createElHelpers } from "./create.js";
import { g as globals } from "./globals.js";
import { t as toWritableStores, o as overridable, r as removeUndefined, g as getOptionUpdater } from "./updater.js";
import { w as writable } from "./index4.js";
import { c as createBitAttrs } from "./attrs.js";
import { c as createDispatcher } from "./events.js";
import { c as cn } from "./utils.js";
const defaults = {
  defaultChecked: false,
  disabled: false,
  required: false,
  name: "",
  value: ""
};
const { name } = createElHelpers("switch");
function createSwitch(props) {
  const propsWithDefaults = { ...defaults, ...props };
  const options = toWritableStores(omit(propsWithDefaults, "checked"));
  const { disabled, required, name: nameStore, value } = options;
  const checkedWritable = propsWithDefaults.checked ?? writable(propsWithDefaults.defaultChecked);
  const checked = overridable(checkedWritable, propsWithDefaults?.onCheckedChange);
  function toggleSwitch() {
    if (disabled.get())
      return;
    checked.update((prev) => !prev);
  }
  const root = makeElement(name(), {
    stores: [checked, disabled, required],
    returned: ([$checked, $disabled, $required]) => {
      return {
        "data-disabled": disabledAttr($disabled),
        disabled: disabledAttr($disabled),
        "data-state": $checked ? "checked" : "unchecked",
        type: "button",
        role: "switch",
        "aria-checked": $checked ? "true" : "false",
        "aria-required": $required ? "true" : void 0
      };
    },
    action(node) {
      const unsub = executeCallbacks(addMeltEventListener(node, "click", () => {
        toggleSwitch();
      }), addMeltEventListener(node, "keydown", (e) => {
        if (e.key !== kbd.ENTER && e.key !== kbd.SPACE)
          return;
        e.preventDefault();
        toggleSwitch();
      }));
      return {
        destroy: unsub
      };
    }
  });
  const input = makeElement(name("input"), {
    stores: [checked, nameStore, required, disabled, value],
    returned: ([$checked, $name, $required, $disabled, $value]) => {
      return {
        type: "checkbox",
        "aria-hidden": true,
        hidden: true,
        tabindex: -1,
        name: $name,
        value: $value,
        checked: $checked,
        required: $required,
        disabled: disabledAttr($disabled),
        style: styleToString({
          position: "absolute",
          opacity: 0,
          "pointer-events": "none",
          margin: 0,
          transform: "translateX(-100%)"
        })
      };
    }
  });
  return {
    elements: {
      root,
      input
    },
    states: {
      checked
    },
    options
  };
}
function getSwitchData() {
  const NAME = "switch";
  const PARTS = ["root", "input", "thumb"];
  return {
    NAME,
    PARTS
  };
}
function setCtx(props) {
  const { NAME, PARTS } = getSwitchData();
  const getAttrs = createBitAttrs(NAME, PARTS);
  const Switch2 = { ...createSwitch(removeUndefined(props)), getAttrs };
  setContext(NAME, Switch2);
  return {
    ...Switch2,
    updateOption: getOptionUpdater(Switch2.options)
  };
}
function getCtx() {
  const { NAME } = getSwitchData();
  return getContext(NAME);
}
const Switch_input = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let inputValue;
  let $$restProps = compute_rest_props($$props, ["el"]);
  let $value, $$unsubscribe_value;
  let $input, $$unsubscribe_input;
  let $name, $$unsubscribe_name;
  let $disabled, $$unsubscribe_disabled;
  let $required, $$unsubscribe_required;
  let { el = void 0 } = $$props;
  const { elements: { input }, options: { value, name: name2, disabled, required } } = getCtx();
  $$unsubscribe_input = subscribe(input, (value2) => $input = value2);
  $$unsubscribe_value = subscribe(value, (value2) => $value = value2);
  $$unsubscribe_name = subscribe(name2, (value2) => $name = value2);
  $$unsubscribe_disabled = subscribe(disabled, (value2) => $disabled = value2);
  $$unsubscribe_required = subscribe(required, (value2) => $required = value2);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  inputValue = $value === void 0 || $value === "" ? "on" : $value;
  $$unsubscribe_value();
  $$unsubscribe_input();
  $$unsubscribe_name();
  $$unsubscribe_disabled();
  $$unsubscribe_required();
  return `<input${spread(
    [
      escape_object($input),
      { name: escape_attribute_value($name) },
      { disabled: $disabled || null },
      { required: $required || null },
      {
        value: escape_attribute_value(inputValue)
      },
      escape_object($$restProps)
    ],
    {}
  )}${add_attribute("this", el, 0)}>`;
});
const { Object: Object_1 } = globals;
const Switch$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let builder;
  let attrs;
  let $$restProps = compute_rest_props($$props, [
    "checked",
    "onCheckedChange",
    "disabled",
    "name",
    "value",
    "includeInput",
    "required",
    "asChild",
    "inputAttrs",
    "el"
  ]);
  let $root, $$unsubscribe_root;
  let { checked = void 0 } = $$props;
  let { onCheckedChange = void 0 } = $$props;
  let { disabled = void 0 } = $$props;
  let { name: name2 = void 0 } = $$props;
  let { value = void 0 } = $$props;
  let { includeInput = true } = $$props;
  let { required = void 0 } = $$props;
  let { asChild = false } = $$props;
  let { inputAttrs = void 0 } = $$props;
  let { el = void 0 } = $$props;
  const { elements: { root }, states: { checked: localChecked }, updateOption, getAttrs } = setCtx({
    disabled,
    name: name2,
    value,
    required,
    defaultChecked: checked,
    onCheckedChange: ({ next }) => {
      if (checked !== next) {
        onCheckedChange?.(next);
        checked = next;
      }
      return next;
    }
  });
  $$unsubscribe_root = subscribe(root, (value2) => $root = value2);
  createDispatcher();
  if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0) $$bindings.checked(checked);
  if ($$props.onCheckedChange === void 0 && $$bindings.onCheckedChange && onCheckedChange !== void 0) $$bindings.onCheckedChange(onCheckedChange);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.name === void 0 && $$bindings.name && name2 !== void 0) $$bindings.name(name2);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.includeInput === void 0 && $$bindings.includeInput && includeInput !== void 0) $$bindings.includeInput(includeInput);
  if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.inputAttrs === void 0 && $$bindings.inputAttrs && inputAttrs !== void 0) $$bindings.inputAttrs(inputAttrs);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  checked !== void 0 && localChecked.set(checked);
  {
    updateOption("disabled", disabled);
  }
  {
    updateOption("name", name2);
  }
  {
    updateOption("value", value);
  }
  {
    updateOption("required", required);
  }
  builder = $root;
  attrs = {
    ...getAttrs("root"),
    "data-checked": checked ? "" : void 0
  };
  {
    Object.assign(builder, attrs);
  }
  $$unsubscribe_root();
  return `${asChild ? `${slots.default ? slots.default({ builder }) : ``}` : `<button${spread([escape_object(builder), { type: "button" }, escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</button>`} ${includeInput ? `${validate_component(Switch_input, "SwitchInput").$$render($$result, Object_1.assign({}, inputAttrs), {}, {})}` : ``}`;
});
const Switch_thumb = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let attrs;
  let $$restProps = compute_rest_props($$props, ["asChild", "el"]);
  let $checked, $$unsubscribe_checked;
  let { asChild = false } = $$props;
  let { el = void 0 } = $$props;
  const { states: { checked }, getAttrs } = getCtx();
  $$unsubscribe_checked = subscribe(checked, (value) => $checked = value);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  attrs = {
    ...getAttrs("thumb"),
    "data-state": $checked ? "checked" : "unchecked",
    "data-checked": $checked ? "" : void 0
  };
  $$unsubscribe_checked();
  return `${asChild ? `${slots.default ? slots.default({ attrs, checked: $checked }) : ``}` : `<span${spread([escape_object($$restProps), escape_object(attrs)], {})}${add_attribute("this", el, 0)}></span>`}`;
});
const Switch = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class", "checked"]);
  let { class: className = void 0 } = $$props;
  let { checked = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0) $$bindings.checked(checked);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${validate_component(Switch$1, "SwitchPrimitive.Root").$$render(
      $$result,
      Object.assign(
        {},
        {
          class: cn("focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)
        },
        $$restProps,
        { checked }
      ),
      {
        checked: ($$value) => {
          checked = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${validate_component(Switch_thumb, "SwitchPrimitive.Thumb").$$render(
            $$result,
            {
              class: cn("bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0")
            },
            {},
            {}
          )}`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});
export {
  Switch as S
};
