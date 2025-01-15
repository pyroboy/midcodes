import { y as setContext, g as getContext, c as create_ssr_component, s as subscribe, k as compute_rest_props, l as spread, o as escape_object, a as add_attribute, v as validate_component, e as escape, C as add_classes, x as get_store_value, D as is_promise, n as noop$1, m as escape_attribute_value, q as onDestroy, t as set_store_value, f as createEventDispatcher, b as each } from "../../../../chunks/ssr.js";
import { s as superForm } from "../../../../chunks/superForm.js";
import "ts-deepmerge";
import "../../../../chunks/formData.js";
import { p as page } from "../../../../chunks/stores.js";
import { w as writable, d as derived, a as readable } from "../../../../chunks/index4.js";
import "memoize-weak";
import { a as zod } from "../../../../chunks/zod.js";
import "../../../../chunks/index2.js";
import { R as Root$1, D as Dialog_content, a as Dialog_header, b as Dialog_title, c as Dialog_description } from "../../../../chunks/index10.js";
import { t as toast } from "../../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
import { l as leaseSchema } from "../../../../chunks/formSchema4.js";
import { L as Label } from "../../../../chunks/label.js";
import { a as alertVariants } from "../../../../chunks/index8.js";
import { t as tick } from "../../../../chunks/scheduler.js";
import { nanoid } from "nanoid/non-secure";
import "dequal";
import { o as omit$1, w as withGet, z as safeOnMount, m as makeElement, b as isBrowser$1, s as styleToString$1, B as portalAttr, x as effect$1, h as isElement, f as executeCallbacks$1, d as addMeltEventListener, k as kbd$1, u as useEscapeKeydown, a as isHTMLElement$1, c as createElHelpers, n as noop } from "../../../../chunks/create.js";
import { c as cn, d as flyAndScale } from "../../../../chunks/utils.js";
import { I as Icon } from "../../../../chunks/Icon.js";
import { t as toWritableStores$1, o as overridable, r as removeUndefined$1, g as getOptionUpdater } from "../../../../chunks/updater.js";
import { g as generateIds, d as derivedVisible, u as usePopper, a as getPortalDestination, h as usePortal, r as removeScroll, c as getPositioningUpdater } from "../../../../chunks/helpers.js";
import { h as handleFocus } from "../../../../chunks/focus.js";
import { c as createBitAttrs } from "../../../../chunks/attrs.js";
import { c as createDispatcher } from "../../../../chunks/events.js";
import "clsx";
import { B as Button } from "../../../../chunks/button.js";
import { C as Check } from "../../../../chunks/check.js";
import { C as Card } from "../../../../chunks/card.js";
import { C as Card_content } from "../../../../chunks/card-content.js";
import { C as Card_description } from "../../../../chunks/card-description.js";
import { C as Card_header, a as Card_title } from "../../../../chunks/card-title.js";
import { B as Badge } from "../../../../chunks/index9.js";
const defaults$1 = {
  positioning: {
    placement: "bottom"
  },
  arrowSize: 8,
  defaultOpen: false,
  disableFocusTrap: false,
  closeOnEscape: true,
  preventScroll: false,
  onOpenChange: void 0,
  closeOnOutsideClick: true,
  portal: void 0,
  forceVisible: false,
  openFocus: void 0,
  closeFocus: void 0,
  onOutsideClick: void 0
};
const { name } = createElHelpers("popover");
const popoverIdParts = ["trigger", "content"];
function createPopover(args) {
  const withDefaults = { ...defaults$1, ...args };
  const options = toWritableStores$1(omit$1(withDefaults, "open", "ids"));
  const { positioning, arrowSize, disableFocusTrap, preventScroll, closeOnEscape, closeOnOutsideClick, portal, forceVisible, openFocus, closeFocus, onOutsideClick } = options;
  const openWritable = withDefaults.open ?? writable(withDefaults.defaultOpen);
  const open = overridable(openWritable, withDefaults?.onOpenChange);
  const activeTrigger = withGet.writable(null);
  const ids = toWritableStores$1({ ...generateIds(popoverIdParts), ...withDefaults.ids });
  safeOnMount(() => {
    activeTrigger.set(document.getElementById(ids.trigger.get()));
  });
  function handleClose() {
    open.set(false);
    const triggerEl = document.getElementById(ids.trigger.get());
    handleFocus({ prop: closeFocus.get(), defaultEl: triggerEl });
  }
  const isVisible = derivedVisible({ open, activeTrigger, forceVisible });
  const content = makeElement(name("content"), {
    stores: [isVisible, portal, ids.content],
    returned: ([$isVisible, $portal, $contentId]) => {
      return {
        hidden: $isVisible && isBrowser$1 ? void 0 : true,
        tabindex: -1,
        style: styleToString$1({
          display: $isVisible ? void 0 : "none"
        }),
        id: $contentId,
        "data-state": $isVisible ? "open" : "closed",
        "data-portal": portalAttr($portal)
      };
    },
    action: (node) => {
      let unsubPopper = noop;
      const unsubDerived = effect$1([
        isVisible,
        activeTrigger,
        positioning,
        disableFocusTrap,
        closeOnEscape,
        closeOnOutsideClick,
        portal
      ], ([$isVisible, $activeTrigger, $positioning, $disableFocusTrap, $closeOnEscape, $closeOnOutsideClick, $portal]) => {
        unsubPopper();
        if (!$isVisible || !$activeTrigger)
          return;
        tick().then(() => {
          unsubPopper();
          unsubPopper = usePopper(node, {
            anchorElement: $activeTrigger,
            open,
            options: {
              floating: $positioning,
              focusTrap: $disableFocusTrap ? null : {
                returnFocusOnDeactivate: false,
                clickOutsideDeactivates: $closeOnOutsideClick,
                allowOutsideClick: true,
                escapeDeactivates: $closeOnEscape
              },
              modal: {
                shouldCloseOnInteractOutside,
                onClose: handleClose,
                open: $isVisible,
                closeOnInteractOutside: $closeOnOutsideClick
              },
              escapeKeydown: $closeOnEscape ? {
                handler: () => {
                  handleClose();
                }
              } : null,
              portal: getPortalDestination(node, $portal)
            }
          }).destroy;
        });
      });
      return {
        destroy() {
          unsubDerived();
          unsubPopper();
        }
      };
    }
  });
  function toggleOpen(triggerEl) {
    open.update((prev) => {
      return !prev;
    });
    if (triggerEl && triggerEl !== activeTrigger.get()) {
      activeTrigger.set(triggerEl);
    }
  }
  function shouldCloseOnInteractOutside(e) {
    onOutsideClick.get()?.(e);
    if (e.defaultPrevented)
      return false;
    const target = e.target;
    const triggerEl = document.getElementById(ids.trigger.get());
    if (triggerEl && isElement(target)) {
      if (target === triggerEl || triggerEl.contains(target))
        return false;
    }
    return true;
  }
  const trigger = makeElement(name("trigger"), {
    stores: [isVisible, ids.content, ids.trigger],
    returned: ([$isVisible, $contentId, $triggerId]) => {
      return {
        role: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": $isVisible ? "true" : "false",
        "data-state": stateAttr($isVisible),
        "aria-controls": $contentId,
        id: $triggerId
      };
    },
    action: (node) => {
      const unsub = executeCallbacks$1(addMeltEventListener(node, "click", () => {
        toggleOpen(node);
      }), addMeltEventListener(node, "keydown", (e) => {
        if (e.key !== kbd$1.ENTER && e.key !== kbd$1.SPACE)
          return;
        e.preventDefault();
        toggleOpen(node);
      }));
      return {
        destroy: unsub
      };
    }
  });
  const overlay = makeElement(name("overlay"), {
    stores: [isVisible],
    returned: ([$isVisible]) => {
      return {
        hidden: $isVisible ? void 0 : true,
        tabindex: -1,
        style: styleToString$1({
          display: $isVisible ? void 0 : "none"
        }),
        "aria-hidden": "true",
        "data-state": stateAttr($isVisible)
      };
    },
    action: (node) => {
      let unsubEscapeKeydown = noop;
      let unsubDerived = noop;
      let unsubPortal = noop;
      if (closeOnEscape.get()) {
        const escapeKeydown = useEscapeKeydown(node, {
          handler: () => {
            handleClose();
          }
        });
        {
          unsubEscapeKeydown = escapeKeydown.destroy;
        }
      }
      unsubDerived = effect$1([portal], ([$portal]) => {
        unsubPortal();
        if ($portal === null)
          return;
        const portalDestination = getPortalDestination(node, $portal);
        if (portalDestination === null)
          return;
        unsubPortal = usePortal(node, portalDestination).destroy;
      });
      return {
        destroy() {
          unsubEscapeKeydown();
          unsubDerived();
          unsubPortal();
        }
      };
    }
  });
  const arrow = makeElement(name("arrow"), {
    stores: arrowSize,
    returned: ($arrowSize) => ({
      "data-arrow": true,
      style: styleToString$1({
        position: "absolute",
        width: `var(--arrow-size, ${$arrowSize}px)`,
        height: `var(--arrow-size, ${$arrowSize}px)`
      })
    })
  });
  const close = makeElement(name("close"), {
    returned: () => ({
      type: "button"
    }),
    action: (node) => {
      const unsub = executeCallbacks$1(addMeltEventListener(node, "click", (e) => {
        if (e.defaultPrevented)
          return;
        handleClose();
      }), addMeltEventListener(node, "keydown", (e) => {
        if (e.defaultPrevented)
          return;
        if (e.key !== kbd$1.ENTER && e.key !== kbd$1.SPACE)
          return;
        e.preventDefault();
        toggleOpen();
      }));
      return {
        destroy: unsub
      };
    }
  });
  effect$1([open, activeTrigger, preventScroll], ([$open, $activeTrigger, $preventScroll]) => {
    if (!isBrowser$1)
      return;
    const unsubs = [];
    if ($open) {
      if (!$activeTrigger) {
        tick().then(() => {
          const triggerEl2 = document.getElementById(ids.trigger.get());
          if (!isHTMLElement$1(triggerEl2))
            return;
          activeTrigger.set(triggerEl2);
        });
      }
      if ($preventScroll) {
        unsubs.push(removeScroll());
      }
      const triggerEl = $activeTrigger ?? document.getElementById(ids.trigger.get());
      handleFocus({ prop: openFocus.get(), defaultEl: triggerEl });
    }
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  });
  return {
    ids,
    elements: {
      trigger,
      content,
      arrow,
      close,
      overlay
    },
    states: {
      open
    },
    options
  };
}
function stateAttr(open) {
  return open ? "open" : "closed";
}
function getPopoverData() {
  const NAME2 = "popover";
  const PARTS = ["arrow", "close", "content", "trigger"];
  return {
    NAME: NAME2,
    PARTS
  };
}
function setCtx(props) {
  const { NAME: NAME2, PARTS } = getPopoverData();
  const getAttrs = createBitAttrs(NAME2, PARTS);
  const popover = {
    ...createPopover({
      positioning: {
        placement: "bottom",
        gutter: 0
      },
      ...removeUndefined$1(props),
      forceVisible: true
    }),
    getAttrs
  };
  setContext(NAME2, popover);
  return {
    ...popover,
    updateOption: getOptionUpdater(popover.options)
  };
}
function getCtx$1() {
  const { NAME: NAME2 } = getPopoverData();
  return getContext(NAME2);
}
function updatePositioning(props) {
  const defaultPlacement = {
    side: "bottom",
    align: "center"
  };
  const withDefaults = { ...defaultPlacement, ...props };
  const { options: { positioning } } = getCtx$1();
  const updater = getPositioningUpdater(positioning);
  updater(withDefaults);
}
const Popover = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $idValues, $$unsubscribe_idValues;
  let { disableFocusTrap = void 0 } = $$props;
  let { closeOnEscape = void 0 } = $$props;
  let { closeOnOutsideClick = void 0 } = $$props;
  let { preventScroll = void 0 } = $$props;
  let { portal = void 0 } = $$props;
  let { open = void 0 } = $$props;
  let { onOpenChange = void 0 } = $$props;
  let { openFocus = void 0 } = $$props;
  let { closeFocus = void 0 } = $$props;
  let { onOutsideClick = void 0 } = $$props;
  const { updateOption, states: { open: localOpen }, ids } = setCtx({
    disableFocusTrap,
    closeOnEscape,
    closeOnOutsideClick,
    preventScroll,
    portal,
    defaultOpen: open,
    openFocus,
    closeFocus,
    onOutsideClick,
    onOpenChange: ({ next }) => {
      if (open !== next) {
        onOpenChange?.(next);
        open = next;
      }
      return next;
    },
    positioning: { gutter: 0, offset: { mainAxis: 1 } }
  });
  const idValues = derived([ids.content, ids.trigger], ([$contentId, $triggerId]) => ({ content: $contentId, trigger: $triggerId }));
  $$unsubscribe_idValues = subscribe(idValues, (value) => $idValues = value);
  if ($$props.disableFocusTrap === void 0 && $$bindings.disableFocusTrap && disableFocusTrap !== void 0) $$bindings.disableFocusTrap(disableFocusTrap);
  if ($$props.closeOnEscape === void 0 && $$bindings.closeOnEscape && closeOnEscape !== void 0) $$bindings.closeOnEscape(closeOnEscape);
  if ($$props.closeOnOutsideClick === void 0 && $$bindings.closeOnOutsideClick && closeOnOutsideClick !== void 0) $$bindings.closeOnOutsideClick(closeOnOutsideClick);
  if ($$props.preventScroll === void 0 && $$bindings.preventScroll && preventScroll !== void 0) $$bindings.preventScroll(preventScroll);
  if ($$props.portal === void 0 && $$bindings.portal && portal !== void 0) $$bindings.portal(portal);
  if ($$props.open === void 0 && $$bindings.open && open !== void 0) $$bindings.open(open);
  if ($$props.onOpenChange === void 0 && $$bindings.onOpenChange && onOpenChange !== void 0) $$bindings.onOpenChange(onOpenChange);
  if ($$props.openFocus === void 0 && $$bindings.openFocus && openFocus !== void 0) $$bindings.openFocus(openFocus);
  if ($$props.closeFocus === void 0 && $$bindings.closeFocus && closeFocus !== void 0) $$bindings.closeFocus(closeFocus);
  if ($$props.onOutsideClick === void 0 && $$bindings.onOutsideClick && onOutsideClick !== void 0) $$bindings.onOutsideClick(onOutsideClick);
  open !== void 0 && localOpen.set(open);
  {
    updateOption("disableFocusTrap", disableFocusTrap);
  }
  {
    updateOption("closeOnEscape", closeOnEscape);
  }
  {
    updateOption("closeOnOutsideClick", closeOnOutsideClick);
  }
  {
    updateOption("preventScroll", preventScroll);
  }
  {
    updateOption("portal", portal);
  }
  {
    updateOption("openFocus", openFocus);
  }
  {
    updateOption("closeFocus", closeFocus);
  }
  {
    updateOption("onOutsideClick", onOutsideClick);
  }
  $$unsubscribe_idValues();
  return `${slots.default ? slots.default({ ids: $idValues }) : ``}`;
});
const Popover_content$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let builder;
  let $$restProps = compute_rest_props($$props, [
    "transition",
    "transitionConfig",
    "inTransition",
    "inTransitionConfig",
    "outTransition",
    "outTransitionConfig",
    "asChild",
    "id",
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "collisionPadding",
    "avoidCollisions",
    "collisionBoundary",
    "sameWidth",
    "fitViewport",
    "strategy",
    "overlap",
    "el"
  ]);
  let $open, $$unsubscribe_open;
  let $content, $$unsubscribe_content;
  let { transition = void 0 } = $$props;
  let { transitionConfig = void 0 } = $$props;
  let { inTransition = void 0 } = $$props;
  let { inTransitionConfig = void 0 } = $$props;
  let { outTransition = void 0 } = $$props;
  let { outTransitionConfig = void 0 } = $$props;
  let { asChild = false } = $$props;
  let { id = void 0 } = $$props;
  let { side = "bottom" } = $$props;
  let { align = "center" } = $$props;
  let { sideOffset = 0 } = $$props;
  let { alignOffset = 0 } = $$props;
  let { collisionPadding = 8 } = $$props;
  let { avoidCollisions = true } = $$props;
  let { collisionBoundary = void 0 } = $$props;
  let { sameWidth = false } = $$props;
  let { fitViewport = false } = $$props;
  let { strategy = "absolute" } = $$props;
  let { overlap = false } = $$props;
  let { el = void 0 } = $$props;
  const { elements: { content }, states: { open }, ids, getAttrs } = getCtx$1();
  $$unsubscribe_content = subscribe(content, (value) => $content = value);
  $$unsubscribe_open = subscribe(open, (value) => $open = value);
  const attrs = getAttrs("content");
  if ($$props.transition === void 0 && $$bindings.transition && transition !== void 0) $$bindings.transition(transition);
  if ($$props.transitionConfig === void 0 && $$bindings.transitionConfig && transitionConfig !== void 0) $$bindings.transitionConfig(transitionConfig);
  if ($$props.inTransition === void 0 && $$bindings.inTransition && inTransition !== void 0) $$bindings.inTransition(inTransition);
  if ($$props.inTransitionConfig === void 0 && $$bindings.inTransitionConfig && inTransitionConfig !== void 0) $$bindings.inTransitionConfig(inTransitionConfig);
  if ($$props.outTransition === void 0 && $$bindings.outTransition && outTransition !== void 0) $$bindings.outTransition(outTransition);
  if ($$props.outTransitionConfig === void 0 && $$bindings.outTransitionConfig && outTransitionConfig !== void 0) $$bindings.outTransitionConfig(outTransitionConfig);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
  if ($$props.side === void 0 && $$bindings.side && side !== void 0) $$bindings.side(side);
  if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
  if ($$props.sideOffset === void 0 && $$bindings.sideOffset && sideOffset !== void 0) $$bindings.sideOffset(sideOffset);
  if ($$props.alignOffset === void 0 && $$bindings.alignOffset && alignOffset !== void 0) $$bindings.alignOffset(alignOffset);
  if ($$props.collisionPadding === void 0 && $$bindings.collisionPadding && collisionPadding !== void 0) $$bindings.collisionPadding(collisionPadding);
  if ($$props.avoidCollisions === void 0 && $$bindings.avoidCollisions && avoidCollisions !== void 0) $$bindings.avoidCollisions(avoidCollisions);
  if ($$props.collisionBoundary === void 0 && $$bindings.collisionBoundary && collisionBoundary !== void 0) $$bindings.collisionBoundary(collisionBoundary);
  if ($$props.sameWidth === void 0 && $$bindings.sameWidth && sameWidth !== void 0) $$bindings.sameWidth(sameWidth);
  if ($$props.fitViewport === void 0 && $$bindings.fitViewport && fitViewport !== void 0) $$bindings.fitViewport(fitViewport);
  if ($$props.strategy === void 0 && $$bindings.strategy && strategy !== void 0) $$bindings.strategy(strategy);
  if ($$props.overlap === void 0 && $$bindings.overlap && overlap !== void 0) $$bindings.overlap(overlap);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  {
    if (id) {
      ids.content.set(id);
    }
  }
  builder = $content;
  {
    Object.assign(builder, attrs);
  }
  {
    if ($open) {
      updatePositioning({
        side,
        align,
        sideOffset,
        alignOffset,
        collisionPadding,
        avoidCollisions,
        collisionBoundary,
        sameWidth,
        fitViewport,
        strategy,
        overlap
      });
    }
  }
  $$unsubscribe_open();
  $$unsubscribe_content();
  return `${asChild && $open ? `${slots.default ? slots.default({ builder }) : ``}` : `${transition && $open ? `<div${spread([escape_object(builder), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</div>` : `${inTransition && outTransition && $open ? `<div${spread([escape_object(builder), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</div>` : `${inTransition && $open ? `<div${spread([escape_object(builder), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</div>` : `${outTransition && $open ? `<div${spread([escape_object(builder), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</div>` : `${$open ? `<div${spread([escape_object(builder), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</div>` : ``}`}`}`}`}`}`;
});
const Popover_trigger = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let attrs;
  let builder;
  let $$restProps = compute_rest_props($$props, ["asChild", "id", "el"]);
  let $trigger, $$unsubscribe_trigger;
  let $open, $$unsubscribe_open;
  let { asChild = false } = $$props;
  let { id = void 0 } = $$props;
  let { el = void 0 } = $$props;
  const { elements: { trigger }, states: { open }, ids, getAttrs } = getCtx$1();
  $$unsubscribe_trigger = subscribe(trigger, (value) => $trigger = value);
  $$unsubscribe_open = subscribe(open, (value) => $open = value);
  createDispatcher();
  const bitsAttrs = getAttrs("trigger");
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  {
    if (id) {
      ids.trigger.set(id);
    }
  }
  attrs = {
    ...bitsAttrs,
    "aria-controls": $open ? ids.content : void 0
  };
  builder = $trigger;
  {
    Object.assign(builder, attrs);
  }
  $$unsubscribe_trigger();
  $$unsubscribe_open();
  return `${asChild ? `${slots.default ? slots.default({ builder }) : ``}` : `<button${spread([escape_object(builder), { type: "button" }, escape_object($$restProps)], {})}${add_attribute("this", el, 0)}>${slots.default ? slots.default({ builder }) : ``}</button>`}`;
});
const Chevrons_up_down = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [["path", { "d": "m7 15 5 5 5-5" }], ["path", { "d": "m7 9 5-5 5 5" }]];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "chevrons-up-down" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Search = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "11", "cy": "11", "r": "8" }],
    ["path", { "d": "m21 21-4.3-4.3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "search" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
let styleInit = false;
function assertPromise(data, raw, promise) {
  if (raw) {
    return false;
  }
  return promise || typeof data === "object" && data !== null && "then" in data && typeof data["then"] === "function";
}
function assertStore(data, raw) {
  if (raw) {
    return false;
  }
  return typeof data === "object" && data !== null && "subscribe" in data && typeof data["subscribe"] === "function";
}
const SuperDebug = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let themeStyle;
  let debugData;
  let $page, $$unsubscribe_page;
  let $debugData, $$unsubscribe_debugData = noop$1, $$subscribe_debugData = () => ($$unsubscribe_debugData(), $$unsubscribe_debugData = subscribe(debugData, ($$value) => $debugData = $$value), debugData);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { data } = $$props;
  let { display = true } = $$props;
  let { status = true } = $$props;
  let { label = "" } = $$props;
  let { stringTruncate = 120 } = $$props;
  let { ref = void 0 } = $$props;
  let { promise = false } = $$props;
  let { raw = false } = $$props;
  let { functions = false } = $$props;
  let { theme = "default" } = $$props;
  let { collapsible = false } = $$props;
  let { collapsed = false } = $$props;
  function syntaxHighlight(json) {
    switch (typeof json) {
      case "function": {
        return `<span class="function">[function ${json.name ?? "unnamed"}]</span>`;
      }
      case "symbol": {
        return `<span class="symbol">${json.toString()}</span>`;
      }
    }
    const encodedString = JSON.stringify(
      json,
      function(key, value) {
        if (value === void 0) {
          return "#}#undefined";
        }
        if (typeof this === "object" && this[key] instanceof Date) {
          return "#}D#" + (isNaN(this[key]) ? "Invalid Date" : value);
        }
        if (typeof value === "number") {
          if (value == Number.POSITIVE_INFINITY) return "#}#Inf";
          if (value == Number.NEGATIVE_INFINITY) return "#}#-Inf";
          if (isNaN(value)) return "#}#NaN";
        }
        if (typeof value === "bigint") {
          return "#}BI#" + value;
        }
        if (typeof value === "function" && functions) {
          return `#}F#[function ${value.name}]`;
        }
        if (value instanceof Error) {
          return `#}E#${value.name}: ${value.message || value.cause || "(No error message)"}`;
        }
        if (value instanceof Set) {
          return Array.from(value);
        }
        if (value instanceof Map) {
          return Array.from(value.entries());
        }
        if (typeof this === "object" && typeof this[key] == "object" && this[key] && "toExponential" in this[key]) {
          return "#}DE#" + this[key].toString();
        }
        return value;
      },
      2
    ).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return encodedString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function(match) {
      let cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
          match = match.slice(1, -2) + ":";
        } else {
          cls = "string";
          match = stringTruncate > 0 && match.length > stringTruncate ? match.slice(0, stringTruncate / 2) + `[..${match.length - stringTruncate}/${match.length}..]` + match.slice(-stringTruncate / 2) : match;
          if (match == '"#}#undefined"') {
            cls = "undefined";
            match = "undefined";
          } else if (match.startsWith('"#}D#')) {
            cls = "date";
            match = match.slice(5, -1);
          } else if (match == '"#}#NaN"') {
            cls = "nan";
            match = "NaN";
          } else if (match == '"#}#Inf"') {
            cls = "nan";
            match = "Infinity";
          } else if (match == '"#}#-Inf"') {
            cls = "nan";
            match = "-Infinity";
          } else if (match.startsWith('"#}BI#')) {
            cls = "bigint";
            match = match.slice(6, -1) + "n";
          } else if (match.startsWith('"#}F#')) {
            cls = "function";
            match = match.slice(5, -1);
          } else if (match.startsWith('"#}E#')) {
            cls = "error";
            match = match.slice(5, -1);
          } else if (match.startsWith('"#}DE#')) {
            cls = "number";
            match = match.slice(6, -1);
          }
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    });
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  if ($$props.display === void 0 && $$bindings.display && display !== void 0) $$bindings.display(display);
  if ($$props.status === void 0 && $$bindings.status && status !== void 0) $$bindings.status(status);
  if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
  if ($$props.stringTruncate === void 0 && $$bindings.stringTruncate && stringTruncate !== void 0) $$bindings.stringTruncate(stringTruncate);
  if ($$props.ref === void 0 && $$bindings.ref && ref !== void 0) $$bindings.ref(ref);
  if ($$props.promise === void 0 && $$bindings.promise && promise !== void 0) $$bindings.promise(promise);
  if ($$props.raw === void 0 && $$bindings.raw && raw !== void 0) $$bindings.raw(raw);
  if ($$props.functions === void 0 && $$bindings.functions && functions !== void 0) $$bindings.functions(functions);
  if ($$props.theme === void 0 && $$bindings.theme && theme !== void 0) $$bindings.theme(theme);
  if ($$props.collapsible === void 0 && $$bindings.collapsible && collapsible !== void 0) $$bindings.collapsible(collapsible);
  if ($$props.collapsed === void 0 && $$bindings.collapsed && collapsed !== void 0) $$bindings.collapsed(collapsed);
  themeStyle = theme === "vscode" ? `
      --sd-vscode-bg-color: #1f1f1f;
      --sd-vscode-label-color: #cccccc;
      --sd-vscode-code-default: #8c8a89;
      --sd-vscode-code-key: #9cdcfe;
      --sd-vscode-code-string: #ce9171;
      --sd-vscode-code-number: #b5c180;
      --sd-vscode-code-boolean: #4a9cd6;
      --sd-vscode-code-null: #4a9cd6;
      --sd-vscode-code-undefined: #4a9cd6;
      --sd-vscode-code-nan: #4a9cd6;
      --sd-vscode-code-symbol: #4de0c5;
      --sd-vscode-sb-thumb-color: #35373a;
      --sd-vscode-sb-thumb-color-focus: #4b4d50;
    ` : void 0;
  $$subscribe_debugData(debugData = assertStore(data, raw) ? data : readable(data));
  $$unsubscribe_page();
  $$unsubscribe_debugData();
  return `${!styleInit ? (() => {
    styleInit = true;
    return `<style data-svelte-h="svelte-iwb968">.super-debug--absolute {
			position: absolute;
		}

		.super-debug--top-0 {
			top: 0;
		}

		.super-debug--inset-x-0 {
			left: 0px;
			right: 0px;
		}

		.super-debug--hidden {
			height: 0;
			overflow: hidden;
		}

		.super-debug--hidden:not(.super-debug--with-label) {
			height: 1.5em;
		}

		.super-debug--rotated {
			transform: rotate(180deg);
		}

		.super-debug {
			--_sd-bg-color: var(--sd-bg-color, var(--sd-vscode-bg-color, rgb(30, 41, 59)));
			position: relative;
			background-color: var(--_sd-bg-color);
			border-radius: 0.5rem;
			overflow: hidden;
		}

		.super-debug--pre {
			overflow-x: auto;
		}

		.super-debug--collapse {
			display: block;
			width: 100%;
			color: rgba(255, 255, 255, 0.25);
			background-color: rgba(255, 255, 255, 0.15);
			padding: 5px 0;
			display: flex;
			justify-content: center;
			border-color: transparent;
			margin: 0;
			padding: 3px 0;
		}

		.super-debug--collapse:focus {
			color: #fafafa;
			background-color: rgba(255, 255, 255, 0.25);
		}

		.super-debug--collapse:is(:hover) {
			color: rgba(255, 255, 255, 0.35);
			background-color: rgba(255, 255, 255, 0.25);
		}

		.super-debug--status {
			display: flex;
			padding: 1em;
			padding-bottom: 0;
			justify-content: space-between;
			font-family: Inconsolata, Monaco, Consolas, 'Lucida Console', 'Courier New', Courier,
				monospace;
		}

		.super-debug--right-status {
			display: flex;
			gap: 0.55em;
		}

		.super-debug--copy {
			margin: 0;
			padding: 0;
			padding-top: 2px;
			background-color: transparent;
			border: 0;
			color: #666;
			cursor: pointer;
		}

		.super-debug--copy:hover {
			background-color: transparent;
			color: #666;
		}

		.super-debug--copy:focus {
			background-color: transparent;
			color: #666;
		}

		.super-debug--label {
			color: var(--sd-label-color, var(--sd-vscode-label-color, white));
		}

		.super-debug--promise-loading {
			color: var(--sd-promise-loading-color, var(--sd-vscode-promise-loading-color, #999));
		}

		.super-debug--promise-rejected {
			color: var(--sd-promise-rejected-color, var(--sd-vscode-promise-rejected-color, #ff475d));
		}

		.super-debug pre {
			color: var(--sd-code-default, var(--sd-vscode-code-default, #999));
			background-color: var(--_sd-bg-color);
			font-size: 1em;
			margin-bottom: 0;
			padding: 1em 0 1em 1em;
		}

		.super-debug--info {
			color: var(--sd-info, var(--sd-vscode-info, rgb(85, 85, 255)));
		}

		.super-debug--success {
			color: var(--sd-success, var(--sd-vscode-success, #2cd212));
		}

		.super-debug--redirect {
			color: var(--sd-redirect, var(--sd-vscode-redirect, #03cae5));
		}

		.super-debug--error {
			color: var(--sd-error, var(--sd-vscode-error, #ff475d));
		}

		.super-debug--code .key {
			color: var(--sd-code-key, var(--sd-vscode-code-key, #eab308));
		}

		.super-debug--code .string {
			color: var(--sd-code-string, var(--sd-vscode-code-string, #6ec687));
		}

		.super-debug--code .date {
			color: var(--sd-code-date, var(--sd-vscode-code-date, #f06962));
		}

		.super-debug--code .boolean {
			color: var(--sd-code-boolean, var(--sd-vscode-code-boolean, #79b8ff));
		}

		.super-debug--code .number {
			color: var(--sd-code-number, var(--sd-vscode-code-number, #af77e9));
		}

		.super-debug--code .bigint {
			color: var(--sd-code-bigint, var(--sd-vscode-code-bigint, #af77e9));
		}

		.super-debug--code .null {
			color: var(--sd-code-null, var(--sd-vscode-code-null, #238afe));
		}

		.super-debug--code .nan {
			color: var(--sd-code-nan, var(--sd-vscode-code-nan, #af77e9));
		}

		.super-debug--code .undefined {
			color: var(--sd-code-undefined, var(--sd-vscode-code-undefined, #238afe));
		}

		.super-debug--code .function {
			color: var(--sd-code-function, var(--sd-vscode-code-function, #f06962));
		}

		.super-debug--code .symbol {
			color: var(--sd-code-symbol, var(--sd-vscode-code-symbol, #4de0c5));
		}

		.super-debug--code .error {
			color: var(--sd-code-error, var(--sd-vscode-code-error, #ff475d));
		}

		.super-debug pre::-webkit-scrollbar {
			width: var(--sd-sb-width, var(--sd-vscode-sb-width, 1rem));
			height: var(--sd-sb-height, var(--sd-vscode-sb-height, 1rem));
		}

		.super-debug pre::-webkit-scrollbar-track {
			border-radius: 12px;
			background-color: var(
				--sd-sb-track-color,
				var(--sd-vscode-sb-track-color, hsl(0, 0%, 40%, 0.2))
			);
		}
		.super-debug:is(:focus-within, :hover) pre::-webkit-scrollbar-track {
			border-radius: 12px;
			background-color: var(
				--sd-sb-track-color-focus,
				var(--sd-vscode-sb-track-color-focus, hsl(0, 0%, 50%, 0.2))
			);
		}

		.super-debug pre::-webkit-scrollbar-thumb {
			border-radius: 12px;
			background-color: var(
				--sd-sb-thumb-color,
				var(--sd-vscode-sb-thumb-color, hsl(217, 50%, 50%, 0.5))
			);
		}
		.super-debug:is(:focus-within, :hover) pre::-webkit-scrollbar-thumb {
			border-radius: 12px;
			background-color: var(
				--sd-sb-thumb-color-focus,
				var(--sd-vscode-sb-thumb-color-focus, hsl(217, 50%, 50%))
			);
		}</style>  `;
  })() : ``}  ${display ? `<div class="${["super-debug", collapsible ? "super-debug--collapsible" : ""].join(" ").trim()}"${add_attribute("style", themeStyle, 0)} dir="ltr"><div class="${"super-debug--status " + escape(
    label === "" ? "super-debug--absolute super-debug--inset-x-0 super-debug--top-0" : "",
    true
  )}"><div class="super-debug--label">${escape(label)}</div> <div class="super-debug--right-status"><button type="button" class="super-debug--copy">${`<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z"></path><path d="M4.012 16.737A2.005 2.005 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1"></path></g></svg>`}</button> ${status ? `<div${add_classes((($page.status < 200 ? "super-debug--info" : "") + " " + ($page.status >= 200 && $page.status < 300 ? "super-debug--success" : "") + " " + ($page.status >= 300 && $page.status < 400 ? "super-debug--redirect" : "") + " " + ($page.status >= 400 ? "super-debug--error" : "")).trim())}>${escape($page.status)}</div>` : ``}</div></div> <pre class="${[
    "super-debug--pre",
    (label ? "super-debug--with-label" : "") + " " + (collapsed ? "super-debug--hidden" : "")
  ].join(" ").trim()}"${add_attribute("this", ref, 0)}><code class="super-debug--code">${slots.default ? slots.default({}) : `${assertPromise($debugData, raw, promise) ? `${function(__value) {
    if (is_promise(__value)) {
      __value.then(null, noop$1);
      return `<div class="super-debug--promise-loading" data-svelte-h="svelte-phqra4">Loading data...</div>`;
    }
    return function(result) {
      return `<!-- HTML_TAG_START -->${syntaxHighlight(assertStore(result, raw) ? get_store_value(result) : result)}<!-- HTML_TAG_END -->`;
    }(__value);
  }($debugData)}` : `<!-- HTML_TAG_START -->${syntaxHighlight($debugData)}<!-- HTML_TAG_END -->`}`}</code></pre> ${collapsible ? `<button type="button" class="super-debug--collapse" aria-label="Collapse"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"${add_classes((collapsed ? "super-debug--rotated" : "").trim())}><path fill="currentColor" d="M4.08 11.92L12 4l7.92 7.92l-1.42 1.41l-5.5-5.5V22h-2V7.83l-5.5 5.5l-1.42-1.41M12 4h10V2H2v2h10Z"></path></svg></button>` : ``}</div>` : ``} `;
});
const Alert = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class", "variant"]);
  let { class: className = void 0 } = $$props;
  let { variant = "default" } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  if ($$props.variant === void 0 && $$bindings.variant && variant !== void 0) $$bindings.variant(variant);
  return `<div${spread(
    [
      {
        class: escape_attribute_value(cn(alertVariants({ variant }), className))
      },
      escape_object($$restProps),
      { role: "alert" }
    ],
    {}
  )}>${slots.default ? slots.default({}) : ``}</div>`;
});
const Alert_description = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `<div${spread(
    [
      {
        class: escape_attribute_value(cn("text-sm [&_p]:leading-relaxed", className))
      },
      escape_object($$restProps)
    ],
    {}
  )}>${slots.default ? slots.default({}) : ``}</div>`;
});
const SCORE_CONTINUE_MATCH = 1, SCORE_SPACE_WORD_JUMP = 0.9, SCORE_NON_SPACE_WORD_JUMP = 0.8, SCORE_CHARACTER_JUMP = 0.17, SCORE_TRANSPOSITION = 0.1, PENALTY_SKIPPED = 0.999, PENALTY_CASE_MISMATCH = 0.9999, PENALTY_NOT_COMPLETE = 0.99;
const IS_GAP_REGEXP = /[\\/_+.#"@[({&]/, COUNT_GAPS_REGEXP = /[\\/_+.#"@[({&]/g, IS_SPACE_REGEXP = /[\s-]/, COUNT_SPACE_REGEXP = /[\s-]/g;
function commandScoreInner(string, abbreviation, lowerString, lowerAbbreviation, stringIndex, abbreviationIndex, memoizedResults) {
  if (abbreviationIndex === abbreviation.length) {
    if (stringIndex === string.length) {
      return SCORE_CONTINUE_MATCH;
    }
    return PENALTY_NOT_COMPLETE;
  }
  const memoizeKey = `${stringIndex},${abbreviationIndex}`;
  if (memoizedResults[memoizeKey] !== void 0) {
    return memoizedResults[memoizeKey];
  }
  const abbreviationChar = lowerAbbreviation.charAt(abbreviationIndex);
  let index = lowerString.indexOf(abbreviationChar, stringIndex);
  let highScore = 0;
  let score, transposedScore, wordBreaks, spaceBreaks;
  while (index >= 0) {
    score = commandScoreInner(string, abbreviation, lowerString, lowerAbbreviation, index + 1, abbreviationIndex + 1, memoizedResults);
    if (score > highScore) {
      if (index === stringIndex) {
        score *= SCORE_CONTINUE_MATCH;
      } else if (IS_GAP_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP;
        wordBreaks = string.slice(stringIndex, index - 1).match(COUNT_GAPS_REGEXP);
        if (wordBreaks && stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, wordBreaks.length);
        }
      } else if (IS_SPACE_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP;
        spaceBreaks = string.slice(stringIndex, index - 1).match(COUNT_SPACE_REGEXP);
        if (spaceBreaks && stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, spaceBreaks.length);
        }
      } else {
        score *= SCORE_CHARACTER_JUMP;
        if (stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, index - stringIndex);
        }
      }
      if (string.charAt(index) !== abbreviation.charAt(abbreviationIndex)) {
        score *= PENALTY_CASE_MISMATCH;
      }
    }
    if (score < SCORE_TRANSPOSITION && lowerString.charAt(index - 1) === lowerAbbreviation.charAt(abbreviationIndex + 1) || lowerAbbreviation.charAt(abbreviationIndex + 1) === lowerAbbreviation.charAt(abbreviationIndex) && // allow duplicate letters. Ref #7428
    lowerString.charAt(index - 1) !== lowerAbbreviation.charAt(abbreviationIndex)) {
      transposedScore = commandScoreInner(string, abbreviation, lowerString, lowerAbbreviation, index + 1, abbreviationIndex + 2, memoizedResults);
      if (transposedScore * SCORE_TRANSPOSITION > score) {
        score = transposedScore * SCORE_TRANSPOSITION;
      }
    }
    if (score > highScore) {
      highScore = score;
    }
    index = lowerString.indexOf(abbreviationChar, index + 1);
  }
  memoizedResults[memoizeKey] = highScore;
  return highScore;
}
function formatInput(string) {
  return string.toLowerCase().replace(COUNT_SPACE_REGEXP, " ");
}
function commandScore(string, abbreviation) {
  return commandScoreInner(string, abbreviation, formatInput(string), formatInput(abbreviation), 0, 0, {});
}
const isBrowser = typeof document !== "undefined";
function isHTMLElement(element) {
  return element instanceof HTMLElement;
}
function isUndefined(value) {
  return value === void 0;
}
function generateId() {
  return nanoid(10);
}
const kbd = {
  ALT: "Alt",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  BACKSPACE: "Backspace",
  CAPS_LOCK: "CapsLock",
  CONTROL: "Control",
  DELETE: "Delete",
  END: "End",
  ENTER: "Enter",
  ESCAPE: "Escape",
  F1: "F1",
  F10: "F10",
  F11: "F11",
  F12: "F12",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  HOME: "Home",
  META: "Meta",
  PAGE_DOWN: "PageDown",
  PAGE_UP: "PageUp",
  SHIFT: "Shift",
  SPACE: " ",
  TAB: "Tab",
  CTRL: "Control",
  ASTERISK: "*"
};
function omit(obj, ...keys) {
  const result = {};
  for (const key of Object.keys(obj)) {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}
function removeUndefined(obj) {
  const result = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== void 0) {
      result[key] = value;
    }
  }
  return result;
}
function toWritableStores(properties) {
  const result = {};
  Object.keys(properties).forEach((key) => {
    const propertyKey = key;
    const value = properties[propertyKey];
    result[propertyKey] = writable(value);
  });
  return result;
}
function effect(stores, fn) {
  const unsub = derivedWithUnsubscribe(stores, (stores2, onUnsubscribe) => {
    return {
      stores: stores2,
      onUnsubscribe
    };
  }).subscribe(({ stores: stores2, onUnsubscribe }) => {
    const returned = fn(stores2);
    if (returned) {
      onUnsubscribe(returned);
    }
  });
  onDestroy(unsub);
  return unsub;
}
function derivedWithUnsubscribe(stores, fn) {
  let unsubscribers = [];
  const onUnsubscribe = (cb) => {
    unsubscribers.push(cb);
  };
  const unsubscribe = () => {
    unsubscribers.forEach((fn2) => fn2());
    unsubscribers = [];
  };
  const derivedStore = derived(stores, ($storeValues) => {
    unsubscribe();
    return fn($storeValues, onUnsubscribe);
  });
  onDestroy(unsubscribe);
  const subscribe2 = (...args) => {
    const unsub = derivedStore.subscribe(...args);
    return () => {
      unsub();
      unsubscribe();
    };
  };
  return {
    ...derivedStore,
    subscribe: subscribe2
  };
}
function styleToString(style) {
  return Object.keys(style).reduce((str, key) => {
    if (style[key] === void 0)
      return str;
    return str + `${key}:${style[key]};`;
  }, "");
}
const srOnlyStyles = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: "0"
};
function addEventListener(target, event, handler, options) {
  const events = Array.isArray(event) ? event : [event];
  events.forEach((_event) => target.addEventListener(_event, handler, options));
  return () => {
    events.forEach((_event) => target.removeEventListener(_event, handler, options));
  };
}
function executeCallbacks(...callbacks) {
  return (...args) => {
    for (const callback of callbacks) {
      if (typeof callback === "function") {
        callback(...args);
      }
    }
  };
}
const NAME = "Command";
const STATE_NAME = "CommandState";
const GROUP_NAME = "CommandGroup";
const LIST_SELECTOR = `[data-cmdk-list-sizer]`;
const GROUP_SELECTOR = `[data-cmdk-group]`;
const GROUP_ITEMS_SELECTOR = `[data-cmdk-group-items]`;
const GROUP_HEADING_SELECTOR = `[data-cmdk-group-heading]`;
const ITEM_SELECTOR = `[data-cmdk-item]`;
const VALID_ITEM_SELECTOR = `${ITEM_SELECTOR}:not([aria-disabled="true"])`;
const VALUE_ATTR = `data-value`;
const defaultFilter = (value, search) => commandScore(value, search);
function getCtx() {
  return getContext(NAME);
}
function getState() {
  return getContext(STATE_NAME);
}
function getGroup() {
  const context = getContext(GROUP_NAME);
  if (!context)
    return void 0;
  return context;
}
function createState(initialValues) {
  const defaultState = {
    search: "",
    value: "",
    filtered: {
      count: 0,
      items: /* @__PURE__ */ new Map(),
      groups: /* @__PURE__ */ new Set()
    }
  };
  const state = writable({ ...defaultState, ...removeUndefined(initialValues) });
  return state;
}
const defaults = {
  label: "Command menu",
  shouldFilter: true,
  loop: false,
  onValueChange: void 0,
  value: void 0,
  filter: defaultFilter,
  ids: {
    root: generateId(),
    list: generateId(),
    label: generateId(),
    input: generateId()
  }
};
function createCommand(props) {
  const ids = {
    root: generateId(),
    list: generateId(),
    label: generateId(),
    input: generateId(),
    ...props.ids
  };
  const withDefaults = {
    ...defaults,
    ...removeUndefined(props)
  };
  const state = props.state ?? createState({
    value: withDefaults.value
  });
  const allItems = writable(/* @__PURE__ */ new Set());
  const allGroups = writable(/* @__PURE__ */ new Map());
  const allIds = writable(/* @__PURE__ */ new Map());
  const commandEl = writable(null);
  const options = toWritableStores(omit(withDefaults, "value", "ids"));
  let $allItems = get_store_value(allItems);
  let $allGroups = get_store_value(allGroups);
  let $allIds = get_store_value(allIds);
  let shouldFilter = get_store_value(options.shouldFilter);
  let loop = get_store_value(options.loop);
  let label = get_store_value(options.label);
  let filter = get_store_value(options.filter);
  effect(options.shouldFilter, ($shouldFilter) => {
    shouldFilter = $shouldFilter;
  });
  effect(options.loop, ($loop) => {
    loop = $loop;
  });
  effect(options.filter, ($filter) => {
    filter = $filter;
  });
  effect(options.label, ($label) => {
    label = $label;
  });
  effect(allItems, (v) => {
    $allItems = v;
  });
  effect(allGroups, (v) => {
    $allGroups = v;
  });
  effect(allIds, (v) => {
    $allIds = v;
  });
  const context = {
    value: (id, value) => {
      if (value !== $allIds.get(id)) {
        allIds.update(($allIds2) => {
          $allIds2.set(id, value);
          return $allIds2;
        });
        state.update(($state) => {
          $state.filtered.items.set(id, score(value, $state.search));
          return $state;
        });
      }
    },
    // Track item lifecycle (add/remove)
    item: (id, groupId) => {
      allItems.update(($allItems2) => $allItems2.add(id));
      if (groupId) {
        allGroups.update(($allGroups2) => {
          if (!$allGroups2.has(groupId)) {
            $allGroups2.set(groupId, /* @__PURE__ */ new Set([id]));
          } else {
            $allGroups2.get(groupId)?.add(id);
          }
          return $allGroups2;
        });
      }
      state.update(($state) => {
        const filteredState = filterItems($state, shouldFilter);
        if (!filteredState.value) {
          const value = selectFirstItem();
          filteredState.value = value ?? "";
        }
        return filteredState;
      });
      return () => {
        allIds.update(($allIds2) => {
          $allIds2.delete(id);
          return $allIds2;
        });
        allItems.update(($allItems2) => {
          $allItems2.delete(id);
          return $allItems2;
        });
        state.update(($state) => {
          $state.filtered.items.delete(id);
          const selectedItem = getSelectedItem();
          const filteredState = filterItems($state);
          if (selectedItem?.getAttribute("id") === id) {
            filteredState.value = selectFirstItem() ?? "";
          }
          return $state;
        });
      };
    },
    group: (id) => {
      allGroups.update(($allGroups2) => {
        if (!$allGroups2.has(id)) {
          $allGroups2.set(id, /* @__PURE__ */ new Set());
        }
        return $allGroups2;
      });
      return () => {
        allIds.update(($allIds2) => {
          $allIds2.delete(id);
          return $allIds2;
        });
        allGroups.update(($allGroups2) => {
          $allGroups2.delete(id);
          return $allGroups2;
        });
      };
    },
    filter: () => {
      return shouldFilter;
    },
    label: label || props["aria-label"] || "",
    commandEl,
    ids,
    updateState
  };
  function updateState(key, value, preventScroll) {
    state.update((curr) => {
      if (Object.is(curr[key], value))
        return curr;
      curr[key] = value;
      if (key === "search") {
        const filteredState = filterItems(curr, shouldFilter);
        curr = filteredState;
        const sortedState = sort(curr, shouldFilter);
        curr = sortedState;
        tick().then(() => state.update((curr2) => {
          curr2.value = selectFirstItem() ?? "";
          props.onValueChange?.(curr2.value);
          return curr2;
        }));
      } else if (key === "value") {
        props.onValueChange?.(curr.value);
        if (!preventScroll) {
          tick().then(() => scrollSelectedIntoView());
        }
      }
      return curr;
    });
  }
  function filterItems(state2, shouldFilterVal) {
    const $shouldFilter = shouldFilterVal ?? shouldFilter;
    if (!state2.search || !$shouldFilter) {
      state2.filtered.count = $allItems.size;
      return state2;
    }
    state2.filtered.groups = /* @__PURE__ */ new Set();
    let itemCount = 0;
    for (const id of $allItems) {
      const value = $allIds.get(id);
      const rank = score(value, state2.search);
      state2.filtered.items.set(id, rank);
      if (rank > 0) {
        itemCount++;
      }
    }
    for (const [groupId, group] of $allGroups) {
      for (const itemId of group) {
        const rank = state2.filtered.items.get(itemId);
        if (rank && rank > 0) {
          state2.filtered.groups.add(groupId);
        }
      }
    }
    state2.filtered.count = itemCount;
    return state2;
  }
  function sort(state2, shouldFilterVal) {
    const $shouldFilter = shouldFilterVal ?? shouldFilter;
    if (!state2.search || !$shouldFilter) {
      return state2;
    }
    const scores = state2.filtered.items;
    const groups = [];
    for (const value of state2.filtered.groups) {
      const items = $allGroups.get(value);
      if (!items)
        continue;
      let max = 0;
      for (const item of items) {
        const score2 = scores.get(item);
        if (isUndefined(score2))
          continue;
        max = Math.max(score2, max);
      }
      groups.push([value, max]);
    }
    const rootEl = document.getElementById(ids.root);
    if (!rootEl)
      return state2;
    const list = rootEl.querySelector(LIST_SELECTOR);
    const validItems = getValidItems(rootEl).sort((a, b) => {
      const valueA = a.getAttribute(VALUE_ATTR) ?? "";
      const valueB = b.getAttribute(VALUE_ATTR) ?? "";
      return (scores.get(valueA) ?? 0) - (scores.get(valueB) ?? 0);
    });
    for (const item of validItems) {
      const group = item.closest(GROUP_ITEMS_SELECTOR);
      const closest = item.closest(`${GROUP_ITEMS_SELECTOR} > *`);
      if (group) {
        if (item.parentElement === group) {
          group.appendChild(item);
        } else {
          if (!closest)
            continue;
          group.appendChild(closest);
        }
      } else {
        if (item.parentElement === list) {
          list?.appendChild(item);
        } else {
          if (!closest)
            continue;
          list?.appendChild(closest);
        }
      }
    }
    groups.sort((a, b) => b[1] - a[1]);
    for (const group of groups) {
      const el = rootEl.querySelector(`${GROUP_SELECTOR}[${VALUE_ATTR}="${group[0]}"]`);
      el?.parentElement?.appendChild(el);
    }
    return state2;
  }
  function selectFirstItem() {
    const item = getValidItems().find((item2) => !item2.ariaDisabled);
    if (!item)
      return;
    const value = item.getAttribute(VALUE_ATTR);
    if (!value)
      return;
    return value;
  }
  function score(value, search) {
    const lowerCaseAndTrimmedValue = value?.toLowerCase().trim();
    const filterFn = filter;
    if (!filterFn) {
      return lowerCaseAndTrimmedValue ? defaultFilter(lowerCaseAndTrimmedValue, search) : 0;
    }
    return lowerCaseAndTrimmedValue ? filterFn(lowerCaseAndTrimmedValue, search) : 0;
  }
  function scrollSelectedIntoView() {
    const item = getSelectedItem();
    if (!item) {
      return;
    }
    if (item.parentElement?.firstChild === item) {
      tick().then(() => item.closest(GROUP_SELECTOR)?.querySelector(GROUP_HEADING_SELECTOR)?.scrollIntoView({
        block: "nearest"
      }));
    }
    tick().then(() => item.scrollIntoView({ block: "nearest" }));
  }
  function getValidItems(rootElement) {
    const rootEl = rootElement ?? document.getElementById(ids.root);
    if (!rootEl)
      return [];
    return Array.from(rootEl.querySelectorAll(VALID_ITEM_SELECTOR)).filter((el) => el ? true : false);
  }
  function getSelectedItem(rootElement) {
    const rootEl = document.getElementById(ids.root);
    if (!rootEl)
      return;
    const selectedEl = rootEl.querySelector(`${VALID_ITEM_SELECTOR}[aria-selected="true"]`);
    if (!selectedEl)
      return;
    return selectedEl;
  }
  function updateSelectedToIndex(index) {
    const rootEl = document.getElementById(ids.root);
    if (!rootEl)
      return;
    const items = getValidItems(rootEl);
    const item = items[index];
    if (!item)
      return;
    updateState("value", item.getAttribute(VALUE_ATTR) ?? "");
  }
  function updateSelectedByChange(change) {
    const selected = getSelectedItem();
    const items = getValidItems();
    const index = items.findIndex((item) => item === selected);
    let newSelected = items[index + change];
    if (loop) {
      if (index + change < 0) {
        newSelected = items[items.length - 1];
      } else if (index + change === items.length) {
        newSelected = items[0];
      } else {
        newSelected = items[index + change];
      }
    }
    if (newSelected) {
      updateState("value", newSelected.getAttribute(VALUE_ATTR) ?? "");
    }
  }
  function updateSelectedToGroup(change) {
    const selected = getSelectedItem();
    let group = selected?.closest(GROUP_SELECTOR);
    let item = void 0;
    while (group && !item) {
      group = change > 0 ? findNextSibling(group, GROUP_SELECTOR) : findPreviousSibling(group, GROUP_SELECTOR);
      item = group?.querySelector(VALID_ITEM_SELECTOR);
    }
    if (item) {
      updateState("value", item.getAttribute(VALUE_ATTR) ?? "");
    } else {
      updateSelectedByChange(change);
    }
  }
  function last() {
    return updateSelectedToIndex(getValidItems().length - 1);
  }
  function next(e) {
    e.preventDefault();
    if (e.metaKey) {
      last();
    } else if (e.altKey) {
      updateSelectedToGroup(1);
    } else {
      updateSelectedByChange(1);
    }
  }
  function prev(e) {
    e.preventDefault();
    if (e.metaKey) {
      updateSelectedToIndex(0);
    } else if (e.altKey) {
      updateSelectedToGroup(-1);
    } else {
      updateSelectedByChange(-1);
    }
  }
  function handleRootKeydown(e) {
    switch (e.key) {
      case kbd.ARROW_DOWN:
        next(e);
        break;
      case kbd.ARROW_UP:
        prev(e);
        break;
      case kbd.HOME:
        e.preventDefault();
        updateSelectedToIndex(0);
        break;
      case kbd.END:
        e.preventDefault();
        last();
        break;
      case kbd.ENTER: {
        e.preventDefault();
        const item = getSelectedItem();
        if (item) {
          item?.click();
        }
      }
    }
  }
  setContext(NAME, context);
  const stateStore = {
    subscribe: state.subscribe,
    update: state.update,
    set: state.set,
    updateState
  };
  setContext(STATE_NAME, stateStore);
  return {
    state: stateStore,
    handleRootKeydown,
    commandEl,
    ids
  };
}
function findNextSibling(el, selector) {
  let sibling = el.nextElementSibling;
  while (sibling) {
    if (sibling.matches(selector))
      return sibling;
    sibling = sibling.nextElementSibling;
  }
}
function findPreviousSibling(el, selector) {
  let sibling = el.previousElementSibling;
  while (sibling) {
    if (sibling.matches(selector))
      return sibling;
    sibling = sibling.previousElementSibling;
  }
}
const Command$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let slotProps;
  let $$restProps = compute_rest_props($$props, [
    "label",
    "shouldFilter",
    "filter",
    "value",
    "onValueChange",
    "loop",
    "onKeydown",
    "state",
    "ids",
    "asChild"
  ]);
  let $stateStore, $$unsubscribe_stateStore;
  let { label = void 0 } = $$props;
  let { shouldFilter = true } = $$props;
  let { filter = void 0 } = $$props;
  let { value = void 0 } = $$props;
  let { onValueChange = void 0 } = $$props;
  let { loop = void 0 } = $$props;
  let { onKeydown = void 0 } = $$props;
  let { state = void 0 } = $$props;
  let { ids = void 0 } = $$props;
  let { asChild = false } = $$props;
  const { commandEl, handleRootKeydown, ids: commandIds, state: stateStore } = createCommand({
    label,
    shouldFilter,
    filter,
    value,
    onValueChange: (next) => {
      if (next !== value) {
        value = next;
        onValueChange?.(next);
      }
    },
    loop,
    state,
    ids
  });
  $$unsubscribe_stateStore = subscribe(stateStore, (value2) => $stateStore = value2);
  function syncValueAndState(value2) {
    if (value2 && value2 !== $stateStore.value) {
      set_store_value(stateStore, $stateStore.value = value2, $stateStore);
    }
  }
  function rootAction(node) {
    commandEl.set(node);
    const unsubEvents = executeCallbacks(addEventListener(node, "keydown", handleKeydown));
    return { destroy: unsubEvents };
  }
  const rootAttrs = {
    role: "application",
    id: commandIds.root,
    "data-cmdk-root": ""
  };
  const labelAttrs = {
    "data-cmdk-label": "",
    for: commandIds.input,
    id: commandIds.label,
    style: styleToString(srOnlyStyles)
  };
  function handleKeydown(e) {
    onKeydown?.(e);
    if (e.defaultPrevented) return;
    handleRootKeydown(e);
  }
  const root = { action: rootAction, attrs: rootAttrs };
  if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
  if ($$props.shouldFilter === void 0 && $$bindings.shouldFilter && shouldFilter !== void 0) $$bindings.shouldFilter(shouldFilter);
  if ($$props.filter === void 0 && $$bindings.filter && filter !== void 0) $$bindings.filter(filter);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.onValueChange === void 0 && $$bindings.onValueChange && onValueChange !== void 0) $$bindings.onValueChange(onValueChange);
  if ($$props.loop === void 0 && $$bindings.loop && loop !== void 0) $$bindings.loop(loop);
  if ($$props.onKeydown === void 0 && $$bindings.onKeydown && onKeydown !== void 0) $$bindings.onKeydown(onKeydown);
  if ($$props.state === void 0 && $$bindings.state && state !== void 0) $$bindings.state(state);
  if ($$props.ids === void 0 && $$bindings.ids && ids !== void 0) $$bindings.ids(ids);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  {
    syncValueAndState(value);
  }
  slotProps = {
    root,
    label: { attrs: labelAttrs },
    stateStore,
    state: $stateStore
  };
  $$unsubscribe_stateStore();
  return `${asChild ? `${slots.default ? slots.default({ ...slotProps }) : ``}` : `<div${spread([escape_object(rootAttrs), escape_object($$restProps)], {})}> <label${spread([escape_object(labelAttrs)], {})}>${escape(label ?? "")}</label> ${slots.default ? slots.default({ ...slotProps }) : ``}</div>`}`;
});
const CommandEmpty = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  compute_rest_props($$props, ["asChild"]);
  let $state, $$unsubscribe_state;
  let { asChild = false } = $$props;
  const state = getState();
  $$unsubscribe_state = subscribe(state, (value) => $state = value);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  $state.filtered.count === 0;
  $$unsubscribe_state();
  return `${``}`;
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const CommandInput = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["autofocus", "value", "asChild", "el"]);
  let $selectedItemId, $$unsubscribe_selectedItemId;
  const { ids, commandEl } = getCtx();
  const state = getState();
  const search = derived(state, ($state) => $state.search);
  const valueStore = derived(state, ($state) => $state.value);
  let { autofocus = void 0 } = $$props;
  let { value = get_store_value(search) } = $$props;
  let { asChild = false } = $$props;
  let { el = void 0 } = $$props;
  const selectedItemId = derived([valueStore, commandEl], ([$value, $commandEl]) => {
    if (!isBrowser) return void 0;
    const item = $commandEl?.querySelector(`${ITEM_SELECTOR}[${VALUE_ATTR}="${$value}"]`);
    return item?.getAttribute("id");
  });
  $$unsubscribe_selectedItemId = subscribe(selectedItemId, (value2) => $selectedItemId = value2);
  function handleValueUpdate(v) {
    state.updateState("search", v);
  }
  function action(node) {
    if (autofocus) {
      sleep(10).then(() => node.focus());
    }
    if (asChild) {
      const unsubEvents = addEventListener(node, "change", (e) => {
        const currTarget = e.currentTarget;
        state.updateState("search", currTarget.value);
      });
      return { destroy: unsubEvents };
    }
  }
  let attrs;
  if ($$props.autofocus === void 0 && $$bindings.autofocus && autofocus !== void 0) $$bindings.autofocus(autofocus);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  {
    handleValueUpdate(value);
  }
  attrs = {
    type: "text",
    "data-cmdk-input": "",
    autocomplete: "off",
    autocorrect: "off",
    spellcheck: false,
    "aria-autocomplete": "list",
    role: "combobox",
    "aria-expanded": true,
    "aria-controls": ids.list,
    "aria-labelledby": ids.label,
    "aria-activedescendant": $selectedItemId ?? void 0,
    id: ids.input
  };
  $$unsubscribe_selectedItemId();
  return `${asChild ? `${slots.default ? slots.default({ action, attrs }) : ``}` : `<input${spread([escape_object(attrs), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}${add_attribute("value", value, 0)}>`}`;
});
const CommandItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let attrs;
  let $$restProps = compute_rest_props($$props, ["disabled", "value", "onSelect", "alwaysRender", "asChild", "id"]);
  let $selected, $$unsubscribe_selected;
  let $$unsubscribe_render;
  let { disabled = false } = $$props;
  let { value = "" } = $$props;
  let { onSelect = void 0 } = $$props;
  let { alwaysRender = false } = $$props;
  let { asChild = false } = $$props;
  let { id = generateId() } = $$props;
  const groupContext = getGroup();
  const context = getCtx();
  const state = getState();
  const trueAlwaysRender = alwaysRender ?? groupContext?.alwaysRender;
  const render = derived(state, ($state) => {
    if (trueAlwaysRender || context.filter() === false || !$state.search) return true;
    const currentScore = $state.filtered.items.get(id);
    if (isUndefined(currentScore)) return false;
    return currentScore > 0;
  });
  $$unsubscribe_render = subscribe(render, (value2) => value2);
  const selected = derived(state, ($state) => $state.value === value);
  $$unsubscribe_selected = subscribe(selected, (value2) => $selected = value2);
  function action(node) {
    if (!value && node.textContent) {
      value = node.textContent.trim().toLowerCase();
    }
    context.value(id, value);
    node.setAttribute(VALUE_ATTR, value);
    const unsubEvents = executeCallbacks(
      addEventListener(node, "pointermove", () => {
        if (disabled) return;
        select();
      }),
      addEventListener(node, "click", () => {
        if (disabled) return;
        handleItemClick();
      })
    );
    return {
      destroy() {
        unsubEvents();
      }
    };
  }
  function handleItemClick() {
    select();
    onSelect?.(value);
  }
  function select() {
    state.updateState("value", value, true);
  }
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.onSelect === void 0 && $$bindings.onSelect && onSelect !== void 0) $$bindings.onSelect(onSelect);
  if ($$props.alwaysRender === void 0 && $$bindings.alwaysRender && alwaysRender !== void 0) $$bindings.alwaysRender(alwaysRender);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
  attrs = {
    "aria-disabled": disabled ? true : void 0,
    "aria-selected": $selected ? true : void 0,
    "data-disabled": disabled ? true : void 0,
    "data-selected": $selected ? true : void 0,
    "data-cmdk-item": "",
    "data-value": value,
    role: "option",
    id
  };
  $$unsubscribe_selected();
  $$unsubscribe_render();
  return `${`${asChild ? `${slots.default ? slots.default({ action, attrs }) : ``}` : `<div${spread([escape_object(attrs), escape_object($$restProps)], {})}>${slots.default ? slots.default({ action, attrs }) : ``}</div>`}`}`;
});
const CommandList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["el", "asChild"]);
  let $$unsubscribe_state;
  const { ids } = getCtx();
  const state = getState();
  $$unsubscribe_state = subscribe(state, (value) => value);
  let { el = void 0 } = $$props;
  let { asChild = false } = $$props;
  function sizerAction(node) {
    let animationFrame;
    const listEl = node.closest("[data-cmdk-list]");
    if (!isHTMLElement(listEl)) {
      return;
    }
    const observer = new ResizeObserver(() => {
      animationFrame = requestAnimationFrame(() => {
        const height = node.offsetHeight;
        listEl.style.setProperty("--cmdk-list-height", height.toFixed(1) + "px");
      });
    });
    observer.observe(node);
    return {
      destroy() {
        cancelAnimationFrame(animationFrame);
        observer.unobserve(node);
      }
    };
  }
  const listAttrs = {
    "data-cmdk-list": "",
    role: "listbox",
    "aria-label": "Suggestions",
    id: ids.list,
    "aria-labelledby": ids.input
  };
  const sizerAttrs = { "data-cmdk-list-sizer": "" };
  const list = { attrs: listAttrs };
  const sizer = { attrs: sizerAttrs, action: sizerAction };
  if ($$props.el === void 0 && $$bindings.el && el !== void 0) $$bindings.el(el);
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  $$unsubscribe_state();
  return `${asChild ? `${slots.default ? slots.default({ list, sizer }) : ``}` : `<div${spread([escape_object(listAttrs), escape_object($$restProps)], {})}${add_attribute("this", el, 0)}><div${spread([escape_object(sizerAttrs)], {})}>${slots.default ? slots.default({}) : ``}</div></div>`}`;
});
const Command = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["value", "class"]);
  let { value = void 0 } = $$props;
  let { class: className = void 0 } = $$props;
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${validate_component(Command$1, "CommandPrimitive.Root").$$render(
      $$result,
      Object.assign(
        {},
        {
          class: cn("bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md", className)
        },
        $$restProps,
        { value }
      ),
      {
        value: ($$value) => {
          value = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${slots.default ? slots.default({}) : ``}`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});
const Command_empty = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `${validate_component(CommandEmpty, "CommandPrimitive.Empty").$$render(
    $$result,
    Object.assign(
      {},
      {
        class: cn("py-6 text-center text-sm", className)
      },
      $$restProps
    ),
    {},
    {
      default: () => {
        return `${slots.default ? slots.default({}) : ``}`;
      }
    }
  )}`;
});
const Command_item = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["asChild", "class"]);
  let { asChild = false } = $$props;
  let { class: className = void 0 } = $$props;
  if ($$props.asChild === void 0 && $$bindings.asChild && asChild !== void 0) $$bindings.asChild(asChild);
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `${validate_component(CommandItem, "CommandPrimitive.Item").$$render(
    $$result,
    Object.assign(
      {},
      { asChild },
      {
        class: cn("aria-selected:bg-accent aria-selected:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)
      },
      $$restProps
    ),
    {},
    {
      default: ({ action, attrs }) => {
        return `${slots.default ? slots.default({ action, attrs }) : ``}`;
      }
    }
  )}`;
});
const Command_input = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class", "value"]);
  let { class: className = void 0 } = $$props;
  let { value = "" } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<div class="flex items-center border-b px-2" data-cmdk-input-wrapper="">${validate_component(Search, "Search").$$render(
      $$result,
      {
        class: "mr-2 h-4 w-4 shrink-0 opacity-50"
      },
      {},
      {}
    )} ${validate_component(CommandInput, "CommandPrimitive.Input").$$render(
      $$result,
      Object.assign(
        {},
        {
          class: cn("placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50", className)
        },
        $$restProps,
        { value }
      ),
      {
        value: ($$value) => {
          value = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>`;
  } while (!$$settled);
  return $$rendered;
});
const Command_list = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class"]);
  let { class: className = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  return `${validate_component(CommandList, "CommandPrimitive.List").$$render(
    $$result,
    Object.assign(
      {},
      {
        class: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)
      },
      $$restProps
    ),
    {},
    {
      default: () => {
        return `${slots.default ? slots.default({}) : ``}`;
      }
    }
  )}`;
});
const Popover_content = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["class", "transition", "transitionConfig"]);
  let { class: className = void 0 } = $$props;
  let { transition = flyAndScale } = $$props;
  let { transitionConfig = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0) $$bindings.class(className);
  if ($$props.transition === void 0 && $$bindings.transition && transition !== void 0) $$bindings.transition(transition);
  if ($$props.transitionConfig === void 0 && $$bindings.transitionConfig && transitionConfig !== void 0) $$bindings.transitionConfig(transitionConfig);
  return `${validate_component(Popover_content$1, "PopoverPrimitive.Content").$$render(
    $$result,
    Object.assign(
      {},
      { transition },
      { transitionConfig },
      {
        class: cn("bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-none", className)
      },
      $$restProps
    ),
    {},
    {
      default: () => {
        return `${slots.default ? slots.default({}) : ``}`;
      }
    }
  )}`;
});
const Root = Popover;
const Trigger = Popover_trigger;
const MultiSelect = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let filteredOptions;
  let { options = [] } = $$props;
  let { selected = [] } = $$props;
  let { placeholder = "Select items..." } = $$props;
  let { multiSelect = true } = $$props;
  let open = false;
  let search = "";
  createEventDispatcher();
  function handleSelect(value) {
    const numValue = typeof value === "string" ? parseInt(value) : value;
    if (multiSelect) {
      if (selected.includes(numValue)) {
        selected = selected.filter((item) => item !== numValue);
      } else {
        selected = [...selected, numValue];
      }
    } else {
      selected = [numValue];
    }
  }
  if ($$props.options === void 0 && $$bindings.options && options !== void 0) $$bindings.options(options);
  if ($$props.selected === void 0 && $$bindings.selected && selected !== void 0) $$bindings.selected(selected);
  if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0) $$bindings.placeholder(placeholder);
  if ($$props.multiSelect === void 0 && $$bindings.multiSelect && multiSelect !== void 0) $$bindings.multiSelect(multiSelect);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    filteredOptions = options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));
    {
      {
        if (!multiSelect && selected.length > 1) {
          selected = [selected[0]];
        }
      }
    }
    $$rendered = `  ${validate_component(Root, "Popover.Root").$$render(
      $$result,
      { open },
      {
        open: ($$value) => {
          open = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${validate_component(Trigger, "Popover.Trigger").$$render($$result, { asChild: true }, {}, {
            default: ({ builder }) => {
              return `${validate_component(Button, "Button").$$render(
                $$result,
                {
                  builders: [builder],
                  variant: "outline",
                  role: "combobox",
                  "aria-expanded": open,
                  class: "w-full justify-between"
                },
                {},
                {
                  default: () => {
                    return `<div class="flex gap-2 justify-start overflow-x-hidden">${selected.length > 0 ? `${each(selected, (value) => {
                      return `<div class="px-2 py-1 rounded-xl border bg-slate-200 text-xs font-medium">${escape(options.find((option) => option.value === value)?.label || value)} </div>`;
                    })}` : `${escape(placeholder)}`}</div> ${validate_component(Chevrons_up_down, "ChevronsUpDown").$$render(
                      $$result,
                      {
                        class: "ml-2 h-4 w-4 shrink-0 opacity-50"
                      },
                      {},
                      {}
                    )}`;
                  }
                }
              )}`;
            }
          })} ${validate_component(Popover_content, "Popover.Content").$$render($$result, { class: "w-[200px] p-0" }, {}, {
            default: () => {
              return `${validate_component(Command, "Command.Root").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Command_input, "Command.Input").$$render(
                    $$result,
                    {
                      placeholder: "Search items...",
                      value: search
                    },
                    {
                      value: ($$value) => {
                        search = $$value;
                        $$settled = false;
                      }
                    },
                    {}
                  )} ${validate_component(Command_list, "Command.List").$$render($$result, {}, {}, {
                    default: () => {
                      return `${validate_component(Command_empty, "Command.Empty").$$render($$result, {}, {}, {
                        default: () => {
                          return `No items found.`;
                        }
                      })} ${each(filteredOptions, (option) => {
                        return `${validate_component(Command_item, "Command.Item").$$render(
                          $$result,
                          {
                            value: option.value.toString(),
                            onSelect: () => handleSelect(option.value)
                          },
                          {},
                          {
                            default: () => {
                              return `${validate_component(Check, "Check").$$render(
                                $$result,
                                {
                                  class: cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")
                                },
                                {},
                                {}
                              )} ${escape(option.label)} `;
                            }
                          }
                        )}`;
                      })}`;
                    }
                  })}`;
                }
              })}`;
            }
          })}`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});
const css = {
  code: ".form-field.svelte-xfuy7a>.svelte-xfuy7a:not([hidden])~.svelte-xfuy7a:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse))\n}.form-field select{width:100%;border-radius:calc(var(--radius) - 2px);border-width:1px;--tw-border-opacity:1;border-color:hsl(var(--input) / var(--tw-border-opacity, 1));--tw-bg-opacity:1;background-color:hsl(var(--background) / var(--tw-bg-opacity, 1));padding-left:0.75rem;padding-right:0.75rem;padding-top:0.5rem;padding-bottom:0.5rem;font-size:0.875rem;line-height:1.25rem;--tw-ring-offset-color:hsl(var(--background) / 1)\n}.form-field select[multiple]{height:8rem\n}.form-field select option{padding-top:0.25rem;padding-bottom:0.25rem\n}.form-field input{width:100%;border-radius:calc(var(--radius) - 2px);border-width:1px;--tw-border-opacity:1;border-color:hsl(var(--input) / var(--tw-border-opacity, 1));--tw-bg-opacity:1;background-color:hsl(var(--background) / var(--tw-bg-opacity, 1));padding-left:0.75rem;padding-right:0.75rem;padding-top:0.5rem;padding-bottom:0.5rem;font-size:0.875rem;line-height:1.25rem;--tw-ring-offset-color:hsl(var(--background) / 1)\n}.form-field textarea{width:100%;border-radius:calc(var(--radius) - 2px);border-width:1px;--tw-border-opacity:1;border-color:hsl(var(--input) / var(--tw-border-opacity, 1));--tw-bg-opacity:1;background-color:hsl(var(--background) / var(--tw-bg-opacity, 1));padding-left:0.75rem;padding-right:0.75rem;padding-top:0.5rem;padding-bottom:0.5rem;font-size:0.875rem;line-height:1.25rem;--tw-ring-offset-color:hsl(var(--background) / 1)\n}.error-message{margin-top:0.25rem;font-size:0.875rem;line-height:1.25rem;--tw-text-opacity:1;color:hsl(var(--destructive) / var(--tw-text-opacity, 1))\n}",
  map: `{"version":3,"file":"LeaseForm.svelte","sources":["LeaseForm.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { superForm } from \\"sveltekit-superforms/client\\";\\nimport { leaseSchema } from \\"./formSchema\\";\\nimport { createEventDispatcher } from \\"svelte\\";\\nimport { Button } from \\"$lib/components/ui/button\\";\\nimport { Label } from \\"$lib/components/ui/label\\";\\nimport { Alert, AlertDescription } from \\"$lib/components/ui/alert\\";\\nimport MultiSelect from \\"$lib/components/ui/multiSelect.svelte\\";\\nexport let data;\\nexport let editMode = false;\\nexport let form;\\nexport let errors;\\nexport let enhance;\\nexport let constraints;\\nexport let submitting;\\nexport let entity = void 0;\\nconst dispatch = createEventDispatcher();\\nfunction getRentalUnitName(rental_unit_id) {\\n  return data.rental_units?.find((r) => r.id === rental_unit_id)?.name;\\n}\\nfunction getTenantName(tenantId) {\\n  return data.tenants?.find((t) => t.id === tenantId)?.name;\\n}\\nfunction getTenantNames(tenantIds) {\\n  return tenantIds.map((id) => getTenantName(id)).filter((name) => name !== void 0).join(\\", \\");\\n}\\n$: currentTenants = ($form.tenantIds?.map((id) => data.tenants?.find((t) => t.id === id)) || []).filter((t) => t !== void 0);\\n$: currentRentalUnit = data.rental_units?.find((r) => r.id === $form.rental_unit_id);\\n$: {\\n  dispatch(\\"tenantsChange\\", currentTenants);\\n  dispatch(\\"rentalUnitChange\\", currentRentalUnit);\\n}\\nfunction mapTenantToOption(tenant) {\\n  return {\\n    value: tenant.id,\\n    label: tenant.name\\n  };\\n}\\nfunction mapRentalUnit(rental_unit) {\\n  if (typeof rental_unit === \\"object\\" && rental_unit !== null && \\"id\\" in rental_unit && \\"name\\" in rental_unit && \\"property\\" in rental_unit && typeof rental_unit.property === \\"object\\" && rental_unit.property !== null && \\"id\\" in rental_unit.property && \\"name\\" in rental_unit.property) {\\n    return rental_unit;\\n  }\\n  throw new Error(\\"Invalid rental unit data structure\\");\\n}\\n$: if ($form.start_date && $form.terms_month) {\\n  const startDate = new Date($form.start_date);\\n  const endDate = new Date(startDate);\\n  endDate.setMonth(endDate.getMonth() + Number($form.terms_month));\\n  const year = endDate.getFullYear();\\n  const month = String(endDate.getMonth() + 1).padStart(2, \\"0\\");\\n  const day = String(endDate.getDate()).padStart(2, \\"0\\");\\n  $form.end_date = \`\${year}-\${month}-\${day}\`;\\n}\\n$: formErrors = $errors;\\n<\/script>\\n\\n<form \\n  method=\\"POST\\" \\n  action={editMode ? \\"?/update\\" : \\"?/create\\"} \\n  use:enhance\\n  class=\\"space-y-4\\"\\n>\\n  {#if formErrors?.message || formErrors?.error}\\n    <Alert variant=\\"destructive\\">\\n      <AlertDescription>\\n        {formErrors.message || formErrors.error || 'An error occurred'}\\n      </AlertDescription>\\n    </Alert>\\n  {/if}\\n\\n  {#if entity}\\n    <div class=\\"text-sm text-muted-foreground mb-4\\">\\n      Editing lease for {getRentalUnitName(entity.rental_unit_id)}\\n      {#if entity.tenantIds.length > 0}\\n        - Tenants: {getTenantNames(entity.tenantIds)}\\n      {/if}\\n    </div>\\n  {/if}\\n\\n  {#if editMode}\\n    <input type=\\"hidden\\" name=\\"id\\" bind:value={$form.id} />\\n  {/if}\\n  <input type=\\"hidden\\" name=\\"name\\" value=\\"\\"/>\\n  <div class=\\"space-y-4\\">\\n    <div class=\\"form-field\\">\\n      <Label for=\\"tenantIds\\">Tenants</Label>\\n      <MultiSelect\\n        options={data.tenants?.map(mapTenantToOption) || []}\\n        bind:selected={$form.tenantIds}\\n        placeholder=\\"Select tenants...\\"\\n      />\\n      <input type=\\"hidden\\" name=\\"tenantIds\\" value={JSON.stringify($form.tenantIds)} />\\n      {#if $errors.tenantIds}\\n        <p class=\\"error-message\\">{$errors.tenantIds}</p>\\n      {/if}\\n    </div>\\n\\n    <div class=\\"form-field\\">\\n      <Label for=\\"rental_unit_id\\">Rental Unit</Label>\\n      <select \\n        id=\\"rental_unit_id\\"\\n        name=\\"rental_unit_id\\" \\n        bind:value={$form.rental_unit_id}\\n        class=\\"w-full\\"\\n        {...$constraints.rental_unit_id}\\n      >\\n        <option value=\\"\\">Select rental unit</option>\\n        {#each data.rental_units?.map(mapRentalUnit) || [] as rental_unit}\\n          <option value={rental_unit.id}>\\n            {rental_unit.name} - {rental_unit.property.name}\\n          </option>\\n        {/each}\\n      </select>\\n      {#if $errors.rental_unit_id}\\n        <p class=\\"error-message\\">{$errors.rental_unit_id}</p>\\n      {/if}\\n    </div>\\n\\n    <div class=\\"form-field\\">\\n      <Label for=\\"status\\">Status</Label>\\n      <select \\n        id=\\"status\\"\\n        name=\\"status\\" \\n        bind:value={$form.status}\\n        class=\\"w-full\\"\\n        {...$constraints.status}\\n      >\\n        <option value=\\"\\">Select status</option>\\n        {#each Object.values(leaseSchema.shape.status.options) as status}\\n          <option value={status}>{status}</option>\\n        {/each}\\n      </select>\\n      {#if $errors.status}\\n        <p class=\\"error-message\\">{$errors.status}</p>\\n      {/if}\\n    </div>\\n\\n    <div class=\\"grid grid-cols-1 md:grid-cols-2 gap-4\\">\\n      <div class=\\"form-field\\">\\n        <Label for=\\"start_date\\">Start Date</Label>\\n        <input\\n          type=\\"date\\"\\n          id=\\"start_date\\"\\n          name=\\"start_date\\"\\n          bind:value={$form.start_date}\\n          {...$constraints.start_date}\\n        />\\n        {#if $errors.start_date}\\n          <p class=\\"error-message\\">{$errors.start_date}</p>\\n        {/if}\\n      </div>\\n\\n      <div class=\\"form-field\\">\\n        <Label for=\\"terms_month\\">Terms (months)</Label>\\n        <input\\n          type=\\"number\\"\\n          id=\\"terms_month\\"\\n          name=\\"terms_month\\"\\n          bind:value={$form.terms_month}\\n          min=\\"1\\"\\n          max=\\"60\\"\\n          {...$constraints.terms_month}\\n        />\\n        {#if $errors.terms_month}\\n          <p class=\\"error-message\\">{$errors.terms_month}</p>\\n        {/if}\\n      </div>\\n    </div>\\n\\n    <input type=\\"hidden\\" name=\\"end_date\\" bind:value={$form.end_date} />\\n\\n    <div class=\\"grid grid-cols-1 md:grid-cols-2 gap-4\\">\\n      <div class=\\"form-field\\">\\n        <Label for=\\"rent_amount\\">Monthly Rent</Label>\\n        <input\\n          type=\\"number\\"\\n          id=\\"rent_amount\\"\\n          name=\\"rent_amount\\"\\n          bind:value={$form.rent_amount}\\n          min=\\"0\\"\\n          step=\\"0.01\\"\\n          {...$constraints.rent_amount}\\n        />\\n        {#if $errors.rent_amount}\\n          <p class=\\"error-message\\">{$errors.rent_amount}</p>\\n        {/if}\\n      </div>\\n\\n      <div class=\\"form-field\\">\\n        <Label for=\\"security_deposit\\">Security Deposit</Label>\\n        <input\\n          type=\\"number\\"\\n          id=\\"security_deposit\\"\\n          name=\\"security_deposit\\"\\n          bind:value={$form.security_deposit}\\n          min=\\"0\\"\\n          step=\\"0.01\\"\\n          {...$constraints.security_deposit}\\n        />\\n        {#if $errors.security_deposit}\\n          <p class=\\"error-message\\">{$errors.security_deposit}</p>\\n        {/if}\\n      </div>\\n    </div>\\n\\n    <div class=\\"form-field\\">\\n      <Label for=\\"notes\\">Notes</Label>\\n      <textarea\\n        id=\\"notes\\"\\n        name=\\"notes\\"\\n        bind:value={$form.notes}\\n        rows={3}\\n        {...$constraints.notes}\\n      />\\n      {#if $errors.notes}\\n        <p class=\\"error-message\\">{$errors.notes}</p>\\n      {/if}\\n    </div>\\n\\n    <div class=\\"flex justify-end space-x-2\\">\\n      {#if editMode && data.isAdminLevel}\\n        <Button\\n          type=\\"button\\"\\n          variant=\\"destructive\\"\\n          on:click={() => dispatch('delete')}\\n        >\\n          Delete\\n        </Button>\\n      {/if}\\n      <Button type=\\"button\\" variant=\\"outline\\" on:click={() => dispatch('cancel')}>\\n        Cancel\\n      </Button>\\n      <Button type=\\"submit\\" variant=\\"default\\" disabled={$submitting}>\\n        {#if $submitting}\\n          Saving...\\n        {:else}\\n          {editMode ? 'Update' : 'Create'} Lease\\n        {/if}\\n      </Button>\\n    </div>\\n  </div>\\n</form>\\n\\n<style lang=\\"postcss\\">\\n  .form-field > :not([hidden]) ~ :not([hidden]) {\\n\\n    --tw-space-y-reverse: 0;\\n\\n    margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));\\n\\n    margin-bottom: calc(0.5rem * var(--tw-space-y-reverse))\\n}\\n\\n  :global(.form-field select) {\\n\\n    width: 100%;\\n\\n    border-radius: calc(var(--radius) - 2px);\\n\\n    border-width: 1px;\\n\\n    --tw-border-opacity: 1;\\n\\n    border-color: hsl(var(--input) / var(--tw-border-opacity, 1));\\n\\n    --tw-bg-opacity: 1;\\n\\n    background-color: hsl(var(--background) / var(--tw-bg-opacity, 1));\\n\\n    padding-left: 0.75rem;\\n\\n    padding-right: 0.75rem;\\n\\n    padding-top: 0.5rem;\\n\\n    padding-bottom: 0.5rem;\\n\\n    font-size: 0.875rem;\\n\\n    line-height: 1.25rem;\\n\\n    --tw-ring-offset-color: hsl(var(--background) / 1)\\n}\\n\\n  :global(.form-field select[multiple]) {\\n\\n    height: 8rem\\n}\\n\\n  :global(.form-field select option) {\\n\\n    padding-top: 0.25rem;\\n\\n    padding-bottom: 0.25rem\\n}\\n\\n  :global(.form-field input) {\\n\\n    width: 100%;\\n\\n    border-radius: calc(var(--radius) - 2px);\\n\\n    border-width: 1px;\\n\\n    --tw-border-opacity: 1;\\n\\n    border-color: hsl(var(--input) / var(--tw-border-opacity, 1));\\n\\n    --tw-bg-opacity: 1;\\n\\n    background-color: hsl(var(--background) / var(--tw-bg-opacity, 1));\\n\\n    padding-left: 0.75rem;\\n\\n    padding-right: 0.75rem;\\n\\n    padding-top: 0.5rem;\\n\\n    padding-bottom: 0.5rem;\\n\\n    font-size: 0.875rem;\\n\\n    line-height: 1.25rem;\\n\\n    --tw-ring-offset-color: hsl(var(--background) / 1)\\n}\\n\\n  :global(.form-field textarea) {\\n\\n    width: 100%;\\n\\n    border-radius: calc(var(--radius) - 2px);\\n\\n    border-width: 1px;\\n\\n    --tw-border-opacity: 1;\\n\\n    border-color: hsl(var(--input) / var(--tw-border-opacity, 1));\\n\\n    --tw-bg-opacity: 1;\\n\\n    background-color: hsl(var(--background) / var(--tw-bg-opacity, 1));\\n\\n    padding-left: 0.75rem;\\n\\n    padding-right: 0.75rem;\\n\\n    padding-top: 0.5rem;\\n\\n    padding-bottom: 0.5rem;\\n\\n    font-size: 0.875rem;\\n\\n    line-height: 1.25rem;\\n\\n    --tw-ring-offset-color: hsl(var(--background) / 1)\\n}\\n\\n  :global(.error-message) {\\n\\n    margin-top: 0.25rem;\\n\\n    font-size: 0.875rem;\\n\\n    line-height: 1.25rem;\\n\\n    --tw-text-opacity: 1;\\n\\n    color: hsl(var(--destructive) / var(--tw-text-opacity, 1))\\n}\\n</style>\\n"],"names":[],"mappings":"AAmPE,yBAAW,eAAG,KAAK,CAAC,MAAM,CAAC,CAAC,eAAG,KAAK,CAAC,MAAM,CAAC,CAAE,CAE5C,oBAAoB,CAAE,CAAC,CAEvB,UAAU,CAAE,KAAK,MAAM,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,IAAI,oBAAoB,CAAC,CAAC,CAAC,CAE9D,aAAa,CAAE,KAAK,MAAM,CAAC,CAAC,CAAC,IAAI,oBAAoB,CAAC;AAC1D,CAEU,kBAAoB,CAE1B,KAAK,CAAE,IAAI,CAEX,aAAa,CAAE,KAAK,IAAI,QAAQ,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAExC,YAAY,CAAE,GAAG,CAEjB,mBAAmB,CAAE,CAAC,CAEtB,YAAY,CAAE,IAAI,IAAI,OAAO,CAAC,CAAC,CAAC,CAAC,IAAI,mBAAmB,CAAC,EAAE,CAAC,CAAC,CAE7D,eAAe,CAAE,CAAC,CAElB,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAAC,CAAC,IAAI,eAAe,CAAC,EAAE,CAAC,CAAC,CAElE,YAAY,CAAE,OAAO,CAErB,aAAa,CAAE,OAAO,CAEtB,WAAW,CAAE,MAAM,CAEnB,cAAc,CAAE,MAAM,CAEtB,SAAS,CAAE,QAAQ,CAEnB,WAAW,CAAE,OAAO,CAEpB,sBAAsB,CAAE;AAC5B,CAEU,4BAA8B,CAEpC,MAAM,CAAE;AACZ,CAEU,yBAA2B,CAEjC,WAAW,CAAE,OAAO,CAEpB,cAAc,CAAE;AACpB,CAEU,iBAAmB,CAEzB,KAAK,CAAE,IAAI,CAEX,aAAa,CAAE,KAAK,IAAI,QAAQ,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAExC,YAAY,CAAE,GAAG,CAEjB,mBAAmB,CAAE,CAAC,CAEtB,YAAY,CAAE,IAAI,IAAI,OAAO,CAAC,CAAC,CAAC,CAAC,IAAI,mBAAmB,CAAC,EAAE,CAAC,CAAC,CAE7D,eAAe,CAAE,CAAC,CAElB,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAAC,CAAC,IAAI,eAAe,CAAC,EAAE,CAAC,CAAC,CAElE,YAAY,CAAE,OAAO,CAErB,aAAa,CAAE,OAAO,CAEtB,WAAW,CAAE,MAAM,CAEnB,cAAc,CAAE,MAAM,CAEtB,SAAS,CAAE,QAAQ,CAEnB,WAAW,CAAE,OAAO,CAEpB,sBAAsB,CAAE;AAC5B,CAEU,oBAAsB,CAE5B,KAAK,CAAE,IAAI,CAEX,aAAa,CAAE,KAAK,IAAI,QAAQ,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAExC,YAAY,CAAE,GAAG,CAEjB,mBAAmB,CAAE,CAAC,CAEtB,YAAY,CAAE,IAAI,IAAI,OAAO,CAAC,CAAC,CAAC,CAAC,IAAI,mBAAmB,CAAC,EAAE,CAAC,CAAC,CAE7D,eAAe,CAAE,CAAC,CAElB,gBAAgB,CAAE,IAAI,IAAI,YAAY,CAAC,CAAC,CAAC,CAAC,IAAI,eAAe,CAAC,EAAE,CAAC,CAAC,CAElE,YAAY,CAAE,OAAO,CAErB,aAAa,CAAE,OAAO,CAEtB,WAAW,CAAE,MAAM,CAEnB,cAAc,CAAE,MAAM,CAEtB,SAAS,CAAE,QAAQ,CAEnB,WAAW,CAAE,OAAO,CAEpB,sBAAsB,CAAE;AAC5B,CAEU,cAAgB,CAEtB,UAAU,CAAE,OAAO,CAEnB,SAAS,CAAE,QAAQ,CAEnB,WAAW,CAAE,OAAO,CAEpB,iBAAiB,CAAE,CAAC,CAEpB,KAAK,CAAE,IAAI,IAAI,aAAa,CAAC,CAAC,CAAC,CAAC,IAAI,iBAAiB,CAAC,EAAE,CAAC;AAC7D"}`
};
function mapTenantToOption(tenant) {
  return { value: tenant.id, label: tenant.name };
}
function mapRentalUnit(rental_unit) {
  if (typeof rental_unit === "object" && rental_unit !== null && "id" in rental_unit && "name" in rental_unit && "property" in rental_unit && typeof rental_unit.property === "object" && rental_unit.property !== null && "id" in rental_unit.property && "name" in rental_unit.property) {
    return rental_unit;
  }
  throw new Error("Invalid rental unit data structure");
}
const LeaseForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let currentTenants;
  let currentRentalUnit;
  let formErrors;
  let $errors, $$unsubscribe_errors;
  let $form, $$unsubscribe_form;
  let $constraints, $$unsubscribe_constraints;
  let $submitting, $$unsubscribe_submitting;
  let { data } = $$props;
  let { editMode = false } = $$props;
  let { form } = $$props;
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  let { errors } = $$props;
  $$unsubscribe_errors = subscribe(errors, (value) => $errors = value);
  let { enhance } = $$props;
  let { constraints } = $$props;
  $$unsubscribe_constraints = subscribe(constraints, (value) => $constraints = value);
  let { submitting } = $$props;
  $$unsubscribe_submitting = subscribe(submitting, (value) => $submitting = value);
  let { entity = void 0 } = $$props;
  const dispatch = createEventDispatcher();
  function getRentalUnitName(rental_unit_id) {
    return data.rental_units?.find((r) => r.id === rental_unit_id)?.name;
  }
  function getTenantName(tenantId) {
    return data.tenants?.find((t) => t.id === tenantId)?.name;
  }
  function getTenantNames(tenantIds) {
    return tenantIds.map((id) => getTenantName(id)).filter((name2) => name2 !== void 0).join(", ");
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  if ($$props.editMode === void 0 && $$bindings.editMode && editMode !== void 0) $$bindings.editMode(editMode);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
  if ($$props.errors === void 0 && $$bindings.errors && errors !== void 0) $$bindings.errors(errors);
  if ($$props.enhance === void 0 && $$bindings.enhance && enhance !== void 0) $$bindings.enhance(enhance);
  if ($$props.constraints === void 0 && $$bindings.constraints && constraints !== void 0) $$bindings.constraints(constraints);
  if ($$props.submitting === void 0 && $$bindings.submitting && submitting !== void 0) $$bindings.submitting(submitting);
  if ($$props.entity === void 0 && $$bindings.entity && entity !== void 0) $$bindings.entity(entity);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    {
      if ($form.start_date && $form.terms_month) {
        const startDate = new Date($form.start_date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + Number($form.terms_month));
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, "0");
        const day = String(endDate.getDate()).padStart(2, "0");
        set_store_value(form, $form.end_date = `${year}-${month}-${day}`, $form);
      }
    }
    currentTenants = ($form.tenantIds?.map((id) => data.tenants?.find((t) => t.id === id)) || []).filter((t) => t !== void 0);
    currentRentalUnit = data.rental_units?.find((r) => r.id === $form.rental_unit_id);
    {
      {
        dispatch("tenantsChange", currentTenants);
        dispatch("rentalUnitChange", currentRentalUnit);
      }
    }
    formErrors = $errors;
    $$rendered = `<form method="POST"${add_attribute("action", editMode ? "?/update" : "?/create", 0)} class="space-y-4">${formErrors?.message || formErrors?.error ? `${validate_component(Alert, "Alert").$$render($$result, { variant: "destructive" }, {}, {
      default: () => {
        return `${validate_component(Alert_description, "AlertDescription").$$render($$result, {}, {}, {
          default: () => {
            return `${escape(formErrors.message || formErrors.error || "An error occurred")}`;
          }
        })}`;
      }
    })}` : ``} ${entity ? `<div class="text-sm text-muted-foreground mb-4">Editing lease for ${escape(getRentalUnitName(entity.rental_unit_id))} ${entity.tenantIds.length > 0 ? `- Tenants: ${escape(getTenantNames(entity.tenantIds))}` : ``}</div>` : ``} ${editMode ? `<input type="hidden" name="id"${add_attribute("value", $form.id, 0)}>` : ``} <input type="hidden" name="name" value=""> <div class="space-y-4"><div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "tenantIds" }, {}, {
      default: () => {
        return `Tenants`;
      }
    })} ${validate_component(MultiSelect, "MultiSelect").$$render(
      $$result,
      {
        options: data.tenants?.map(mapTenantToOption) || [],
        placeholder: "Select tenants...",
        selected: $form.tenantIds
      },
      {
        selected: ($$value) => {
          $form.tenantIds = $$value;
          $$settled = false;
        }
      },
      {}
    )} <input type="hidden" name="tenantIds"${add_attribute("value", JSON.stringify($form.tenantIds), 0)} class="svelte-xfuy7a"> ${$errors.tenantIds ? `<p class="error-message svelte-xfuy7a">${escape($errors.tenantIds)}</p>` : ``}</div> <div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "rental_unit_id" }, {}, {
      default: () => {
        return `Rental Unit`;
      }
    })} <select${spread(
      [
        { id: "rental_unit_id" },
        { name: "rental_unit_id" },
        { class: "w-full" },
        escape_object($constraints.rental_unit_id)
      ],
      { classes: "svelte-xfuy7a" }
    )}><option value="" class="svelte-xfuy7a" data-svelte-h="svelte-11vdmdi">Select rental unit</option>${each(data.rental_units?.map(mapRentalUnit) || [], (rental_unit) => {
      return `<option${add_attribute("value", rental_unit.id, 0)} class="svelte-xfuy7a">${escape(rental_unit.name)} - ${escape(rental_unit.property.name)} </option>`;
    })}</select> ${$errors.rental_unit_id ? `<p class="error-message svelte-xfuy7a">${escape($errors.rental_unit_id)}</p>` : ``}</div> <div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "status" }, {}, {
      default: () => {
        return `Status`;
      }
    })} <select${spread(
      [
        { id: "status" },
        { name: "status" },
        { class: "w-full" },
        escape_object($constraints.status)
      ],
      { classes: "svelte-xfuy7a" }
    )}><option value="" class="svelte-xfuy7a" data-svelte-h="svelte-74n6qy">Select status</option>${each(Object.values(leaseSchema.shape.status.options), (status) => {
      return `<option${add_attribute("value", status, 0)} class="svelte-xfuy7a">${escape(status)}</option>`;
    })}</select> ${$errors.status ? `<p class="error-message svelte-xfuy7a">${escape($errors.status)}</p>` : ``}</div> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "start_date" }, {}, {
      default: () => {
        return `Start Date`;
      }
    })} <input${spread(
      [
        { type: "date" },
        { id: "start_date" },
        { name: "start_date" },
        escape_object($constraints.start_date)
      ],
      { classes: "svelte-xfuy7a" }
    )}${add_attribute("value", $form.start_date, 0)}> ${$errors.start_date ? `<p class="error-message svelte-xfuy7a">${escape($errors.start_date)}</p>` : ``}</div> <div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "terms_month" }, {}, {
      default: () => {
        return `Terms (months)`;
      }
    })} <input${spread(
      [
        { type: "number" },
        { id: "terms_month" },
        { name: "terms_month" },
        { min: "1" },
        { max: "60" },
        escape_object($constraints.terms_month)
      ],
      { classes: "svelte-xfuy7a" }
    )}${add_attribute("value", $form.terms_month, 0)}> ${$errors.terms_month ? `<p class="error-message svelte-xfuy7a">${escape($errors.terms_month)}</p>` : ``}</div></div> <input type="hidden" name="end_date"${add_attribute("value", $form.end_date, 0)}> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "rent_amount" }, {}, {
      default: () => {
        return `Monthly Rent`;
      }
    })} <input${spread(
      [
        { type: "number" },
        { id: "rent_amount" },
        { name: "rent_amount" },
        { min: "0" },
        { step: "0.01" },
        escape_object($constraints.rent_amount)
      ],
      { classes: "svelte-xfuy7a" }
    )}${add_attribute("value", $form.rent_amount, 0)}> ${$errors.rent_amount ? `<p class="error-message svelte-xfuy7a">${escape($errors.rent_amount)}</p>` : ``}</div> <div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "security_deposit" }, {}, {
      default: () => {
        return `Security Deposit`;
      }
    })} <input${spread(
      [
        { type: "number" },
        { id: "security_deposit" },
        { name: "security_deposit" },
        { min: "0" },
        { step: "0.01" },
        escape_object($constraints.security_deposit)
      ],
      { classes: "svelte-xfuy7a" }
    )}${add_attribute("value", $form.security_deposit, 0)}> ${$errors.security_deposit ? `<p class="error-message svelte-xfuy7a">${escape($errors.security_deposit)}</p>` : ``}</div></div> <div class="form-field svelte-xfuy7a">${validate_component(Label, "Label").$$render($$result, { for: "notes" }, {}, {
      default: () => {
        return `Notes`;
      }
    })} <textarea${spread(
      [
        { id: "notes" },
        { name: "notes" },
        { rows: escape_attribute_value(3) },
        escape_object($constraints.notes)
      ],
      { classes: "svelte-xfuy7a" }
    )}>${escape($form.notes || "")}</textarea> ${$errors.notes ? `<p class="error-message svelte-xfuy7a">${escape($errors.notes)}</p>` : ``}</div> <div class="flex justify-end space-x-2">${editMode && data.isAdminLevel ? `${validate_component(Button, "Button").$$render($$result, { type: "button", variant: "destructive" }, {}, {
      default: () => {
        return `Delete`;
      }
    })}` : ``} ${validate_component(Button, "Button").$$render($$result, { type: "button", variant: "outline" }, {}, {
      default: () => {
        return `Cancel`;
      }
    })} ${validate_component(Button, "Button").$$render(
      $$result,
      {
        type: "submit",
        variant: "default",
        disabled: $submitting
      },
      {},
      {
        default: () => {
          return `${$submitting ? `Saving...` : `${escape(editMode ? "Update" : "Create")} Lease`}`;
        }
      }
    )}</div></div> </form>`;
  } while (!$$settled);
  $$unsubscribe_errors();
  $$unsubscribe_form();
  $$unsubscribe_constraints();
  $$unsubscribe_submitting();
  return $$rendered;
});
function getStatusVariant(status) {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "secondary";
    case "TERMINATED":
      return "destructive";
    case "EXPIRED":
      return "outline";
    default:
      return "secondary";
  }
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
}
const LeaseList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { leases = [] } = $$props;
  let { data } = $$props;
  createEventDispatcher();
  if ($$props.leases === void 0 && $$bindings.leases && leases !== void 0) $$bindings.leases(leases);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<div class="grid gap-4">${each(leases, (lease) => {
    return `${validate_component(Card, "Card.Root").$$render(
      $$result,
      {
        class: "cursor-pointer " + (data.isAdminLevel || data.isAccountant ? "hover:bg-gray-50" : "")
      },
      {},
      {
        default: () => {
          return `${validate_component(Card_header, "Card.Header").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Card_title, "Card.Title").$$render(
                $$result,
                {
                  class: "flex justify-between items-center"
                },
                {},
                {
                  default: () => {
                    return `<span>${escape(lease.name)} ${validate_component(Badge, "Badge").$$render(
                      $$result,
                      {
                        variant: getStatusVariant(lease.status),
                        class: "ml-2"
                      },
                      {},
                      {
                        default: () => {
                          return `${escape(lease.status)} `;
                        }
                      }
                    )}</span> <span class="text-sm font-normal">Rental_unit ${escape(lease.rental_unit?.rental_unit_number)} ${lease.rental_unit?.floor ? `- Floor ${escape(lease.rental_unit.floor.floor_number)} ${lease.rental_unit.floor.wing ? `Wing ${escape(lease.rental_unit.floor.wing)}` : ``}` : ``}</span> `;
                  }
                }
              )} ${validate_component(Card_description, "Card.Description").$$render($$result, {}, {}, {
                default: () => {
                  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-2"><div><strong data-svelte-h="svelte-107j0ix">Property:</strong> ${escape(lease.rental_unit?.property?.name)}</div> <div><strong data-svelte-h="svelte-1y9dw9w">Type:</strong> ${escape(lease.type)}</div> <div><strong data-svelte-h="svelte-1n50ixy">Contract:</strong> ${escape(formatDate(lease.start_date))} - ${escape(formatDate(lease.end_date))}</div> <div><strong data-svelte-h="svelte-1wava6r">Rent:</strong> ${escape(formatCurrency(lease.rent_amount))} </div></div> `;
                }
              })} `;
            }
          })} ${validate_component(Card_content, "Card.Content").$$render($$result, {}, {}, {
            default: () => {
              return `<div class="space-y-2"><div><strong data-svelte-h="svelte-l4roet">Tenants:</strong> <div class="mt-1 space-y-1">${each(lease.lease_tenants, (lt) => {
                return `<div class="text-sm">${escape(lt.tenant.name)} ${lt.tenant.contact_number || lt.tenant.email ? `<span class="text-gray-500">(${escape(lt.tenant.contact_number || lt.tenant.email)})
                    </span>` : ``} </div>`;
              })} </div></div> ${lease.notes ? `<div class="text-sm"><strong data-svelte-h="svelte-5k9uvd">Notes:</strong> ${escape(lease.notes)} </div>` : ``} ${lease.balance > 0 ? `<div class="text-sm text-red-600"><strong data-svelte-h="svelte-qr5p7e">Outstanding Balance:</strong> ${escape(formatCurrency(lease.balance))} </div>` : ``}</div> `;
            }
          })} `;
        }
      }
    )}`;
  })}</div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $form, $$unsubscribe_form;
  let { data } = $$props;
  let editMode = false;
  let selectedLease = void 0;
  let showDeleteConfirm = false;
  const { form, errors, enhance, reset, delayed, constraints, submitting } = superForm(data.form, {
    validators: zod(leaseSchema),
    resetForm: true,
    taintedMessage: null,
    onUpdated: ({ form: form2 }) => {
      if (!form2.valid) {
        const formData = form2.data;
        const errorMessage = formData.error?.message || "Failed to save lease";
        toast.error(errorMessage);
        return;
      }
      if ("success" in form2.data && form2.data.success) {
        toast.success("Lease saved successfully");
        editMode = false;
        reset();
      }
    },
    onSubmit: () => {
      console.log("Form submitted with values:", $form);
    },
    onResult: ({ result }) => {
      console.log("Server response:", result);
    },
    onError: ({ result }) => {
      console.error("Form submission error:", result.error);
      const errorMessage = result.error?.message || "An error occurred";
      toast.error(errorMessage);
    }
  });
  $$unsubscribe_form = subscribe(form, (value) => $form = value);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<div class="container mx-auto p-4 flex"> <div class="w-2/3"><div class="flex justify-between items-center mb-4" data-svelte-h="svelte-mil5b9"><h1 class="text-2xl font-bold">Leases</h1></div> ${validate_component(LeaseList, "LeaseList").$$render($$result, { leases: data.leases, data }, {}, {})}</div>  <div class="w-1/3 pl-4"><div class="flex justify-between items-center mb-4"><h1 class="text-2xl font-bold">${escape(editMode ? "Edit" : "Add")} Lease</h1></div> ${validate_component(LeaseForm, "LeaseForm").$$render(
      $$result,
      {
        data,
        editMode,
        form,
        errors,
        enhance,
        constraints,
        submitting,
        entity: selectedLease
      },
      {},
      {}
    )}</div></div> ${validate_component(Root$1, "Dialog.Root").$$render(
      $$result,
      { open: showDeleteConfirm },
      {
        open: ($$value) => {
          showDeleteConfirm = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${validate_component(Dialog_content, "Dialog.Content").$$render($$result, {}, {}, {
            default: () => {
              return `${validate_component(Dialog_header, "Dialog.Header").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(Dialog_title, "Dialog.Title").$$render($$result, {}, {}, {
                    default: () => {
                      return `Delete Lease`;
                    }
                  })} ${validate_component(Dialog_description, "Dialog.Description").$$render($$result, {}, {}, {
                    default: () => {
                      return `Are you sure you want to delete this lease? This action cannot be undone.`;
                    }
                  })}`;
                }
              })} <div class="flex justify-end space-x-2">${validate_component(Button, "Button").$$render($$result, { variant: "outline" }, {}, {
                default: () => {
                  return `Cancel`;
                }
              })} <form method="POST" action="?/delete"><input type="hidden" name="id"${add_attribute("value", $form.id, 0)}> ${validate_component(Button, "Button").$$render($$result, { type: "submit", variant: "destructive" }, {}, {
                default: () => {
                  return `Delete`;
                }
              })}</form></div>`;
            }
          })}`;
        }
      }
    )} ${validate_component(SuperDebug, "SuperDebug").$$render($$result, { data: $form }, {}, {})}`;
  } while (!$$settled);
  $$unsubscribe_form();
  return $$rendered;
});
export {
  Page as default
};
