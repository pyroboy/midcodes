import { c as create_ssr_component, k as compute_rest_props, l as spread, m as escape_attribute_value, o as escape_object } from "./ssr.js";
import { c as cn } from "./utils.js";
const Card = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `<div${spread(
    [
      {
        class: escape_attribute_value(cn("bg-card text-card-foreground rounded-lg border shadow-sm", className))
      },
      escape_object($$restProps)
    ],
    {}
  )}>${slots.default ? slots.default({}) : ``}</div>`;
});
export {
  Card as C
};
