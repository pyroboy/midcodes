import { c as create_ssr_component, k as compute_rest_props, l as spread, m as escape_attribute_value, o as escape_object } from "./ssr.js";
import { c as cn } from "./utils.js";
const Card_description = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `<p${spread(
    [
      {
        class: escape_attribute_value(cn("text-muted-foreground text-sm", className))
      },
      escape_object($$restProps)
    ],
    {}
  )}>${slots.default ? slots.default({}) : ``}</p>`;
});
export {
  Card_description as C
};
