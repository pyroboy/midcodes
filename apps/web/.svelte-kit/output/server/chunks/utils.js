import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const flyAndScale = (node, params = { y: -8, x: 0, start: 0.95, duration: 150 }) => {
  const style = getComputedStyle(node);
  const transform = style.transform === "none" ? "" : style.transform;
  const scaleConversion = (valueA, scaleA, scaleB) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;
    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;
    return valueB;
  };
  const styleToString = (style2) => {
    return Object.keys(style2).reduce((str, key) => {
      if (style2[key] === void 0) return str;
      return str + key + ":" + style2[key] + ";";
    }, "");
  };
  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);
      return styleToString({
        transform: transform + "translate3d(" + x + "px, " + y + "px, 0) scale(" + scale + ")",
        opacity: t
      });
    },
    easing: cubicOut
  };
};
function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount);
}
export {
  cubicOut as a,
  formatCurrency as b,
  cn as c,
  flyAndScale as d,
  formatDateTime as f
};
