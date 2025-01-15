import { c as create_ssr_component, k as compute_rest_props, l as spread, m as escape_attribute_value, o as escape_object } from "./ssr.js";
import { i as is_void } from "./names.js";
import { c as cn } from "./utils.js";
import { tv } from "tailwind-variants";
import "clsx";
const Badge = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class", "href", "variant"]);
  let { class: className = void 0 } = $$props;
  let { href = void 0 } = $$props;
  let { variant = "default" } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  if ($$props.href === void 0 && $$bindings.href && href !== void 0) $$bindings.href(href);
  if ($$props.variant === void 0 && $$bindings.variant && variant !== void 0) $$bindings.variant(variant);
  return `${((tag) => {
    return tag ? `<${href ? "a" : "span"}${spread(
      [
        { href: escape_attribute_value(href) },
        {
          class: escape_attribute_value(cn(badgeVariants({ variant, className })))
        },
        escape_object($$restProps)
      ],
      {}
    )}>${is_void(tag) ? "" : `${slots.default ? slots.default({}) : ``}`}${is_void(tag) ? "" : `</${tag}>`}` : "";
  })(href ? "a" : "span")}`;
});
const badgeVariants = tv({
  base: "focus:ring-ring inline-flex select-none items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/80 border-transparent",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
      outline: "text-foreground"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});
export {
  Badge as B
};
