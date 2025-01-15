import "dequal";
import { m as makeElement, b as addMeltEventListener } from "./create.js";
function createLabel() {
  const root = makeElement("label", {
    action: (node) => {
      const mouseDown = addMeltEventListener(node, "mousedown", (e) => {
        if (!e.defaultPrevented && e.detail > 1) {
          e.preventDefault();
        }
      });
      return {
        destroy: mouseDown
      };
    }
  });
  return {
    elements: {
      root
    }
  };
}
export {
  createLabel as c
};
