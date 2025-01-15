import "dequal";
import { i as isFunction, a as isHTMLElement } from "./create.js";
import { t as tick } from "./scheduler.js";
import { s as sleep } from "./helpers.js";
async function handleFocus(args) {
  const { prop, defaultEl } = args;
  await Promise.all([sleep(1), tick]);
  if (prop === void 0) {
    defaultEl?.focus();
    return;
  }
  const returned = isFunction(prop) ? prop(defaultEl) : prop;
  if (typeof returned === "string") {
    const el = document.querySelector(returned);
    if (!isHTMLElement(el))
      return;
    el.focus();
  } else if (isHTMLElement(returned)) {
    returned.focus();
  }
}
export {
  handleFocus as h
};
