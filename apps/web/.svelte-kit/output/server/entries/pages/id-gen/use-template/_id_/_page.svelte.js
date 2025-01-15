import { c as create_ssr_component, v as validate_component, f as createEventDispatcher, q as onDestroy, a as add_attribute, e as escape, s as subscribe, b as each } from "../../../../../chunks/ssr.js";
import { p as page } from "../../../../../chunks/stores.js";
import { u as user, s as session } from "../../../../../chunks/auth.js";
import { b as browser } from "../../../../../chunks/index5.js";
import { debounce } from "lodash-es";
import "../../../../../chunks/index2.js";
import { C as Card } from "../../../../../chunks/card.js";
import "clsx";
import { L as Label } from "../../../../../chunks/label.js";
import { R as Root, S as Select_trigger, V as Value, a as Select_content, b as Select_item } from "../../../../../chunks/index7.js";
import { w as writable } from "../../../../../chunks/index4.js";
import { I as Icon } from "../../../../../chunks/Icon.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/button.js";
const Move = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M12 2v20" }],
    ["path", { "d": "m15 19-3 3-3-3" }],
    ["path", { "d": "m19 9 3 3-3 3" }],
    ["path", { "d": "M2 12h20" }],
    ["path", { "d": "m5 9-3 3 3 3" }],
    ["path", { "d": "m9 5 3-3 3 3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "move" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Scaling = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      }
    ],
    ["path", { "d": "M14 15H9v-5" }],
    ["path", { "d": "M16 3h5v5" }],
    ["path", { "d": "M21 3 9 15" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "scaling" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const css$1 = {
  code: ".id-canvas.svelte-14cw9ao{border-radius:calc(var(--radius) - 2px);border-width:1px;--tw-border-opacity:1;border-color:rgb(226 232 240 / var(--tw-border-opacity, 1));--tw-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05);--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges;width:100%;height:auto;display:block /* Avoid inline gap */\n}",
  map: '{"version":3,"file":"IdCanvas.svelte","sources":["IdCanvas.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, createEventDispatcher, afterUpdate, onDestroy } from \\"svelte\\";\\nimport { browser } from \\"$app/environment\\";\\nimport { debounce } from \\"lodash-es\\";\\nexport let elements;\\nexport let backgroundUrl;\\nexport let formData;\\nexport let fileUploads;\\nexport let imagePositions;\\nexport let fullResolution = false;\\nexport let isDragging = false;\\nconst dispatch = createEventDispatcher();\\nclass CanvasOperationError extends Error {\\n  code;\\n  constructor(message, code) {\\n    super(message);\\n    this.code = code;\\n    this.name = \\"CanvasOperationError\\";\\n  }\\n}\\nlet displayCanvas;\\nlet bufferCanvas;\\nlet offscreenCanvas = null;\\nlet displayCtx = null;\\nlet bufferCtx = null;\\nlet isReady = false;\\nlet isRendering = false;\\nlet renderRequested = false;\\nlet isMounted = false;\\nconst DEBOUNCE_DELAY = 20;\\nconst PREVIEW_SCALE = 0.5;\\nconst ELEMENT_SCALE = 2;\\nconst FULL_WIDTH = 1013;\\nconst FULL_HEIGHT = 638;\\nconst LOW_RES_SCALE = 0.2;\\nconst MAX_CACHE_SIZE = 20;\\nconst MEMORY_CHECK_INTERVAL = 1e4;\\nconst imageCache = /* @__PURE__ */ new Map();\\nconst lowResImageCache = /* @__PURE__ */ new Map();\\nlet memoryCheckInterval;\\nfunction cleanImageCache() {\\n  const now = Date.now();\\n  const maxAge = 5 * 60 * 1e3;\\n  for (const [url, entry] of imageCache) {\\n    if (now - entry.lastUsed > maxAge) {\\n      URL.revokeObjectURL(url);\\n      imageCache.delete(url);\\n    }\\n  }\\n  for (const [url, entry] of lowResImageCache) {\\n    if (now - entry.lastUsed > maxAge) {\\n      URL.revokeObjectURL(url);\\n      lowResImageCache.delete(url);\\n    }\\n  }\\n  while (imageCache.size > MAX_CACHE_SIZE) {\\n    let oldestUrl = null;\\n    let oldestTime = Infinity;\\n    for (const [url, entry] of imageCache) {\\n      if (entry.lastUsed < oldestTime) {\\n        oldestTime = entry.lastUsed;\\n        oldestUrl = url;\\n      }\\n    }\\n    if (oldestUrl) {\\n      URL.revokeObjectURL(oldestUrl);\\n      imageCache.delete(oldestUrl);\\n    }\\n  }\\n}\\nfunction checkMemoryUsage() {\\n  if (\\"memory\\" in performance) {\\n    const memory = performance.memory;\\n    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {\\n      console.warn(\\"High memory usage detected, cleaning caches...\\");\\n      cleanImageCache();\\n    }\\n  }\\n}\\nfunction disposeCanvas(canvas) {\\n  if (!canvas) return;\\n  const ctx = canvas.getContext(\\"2d\\");\\n  if (ctx) {\\n    ctx.clearRect(0, 0, canvas.width, canvas.height);\\n  }\\n  canvas.width = 0;\\n  canvas.height = 0;\\n}\\nasync function loadAndCacheImage(url, lowRes = false) {\\n  if (!browser || !url) {\\n    throw new CanvasOperationError(\\n      \\"Cannot load image: browser not available or URL is empty\\",\\n      \\"IMAGE_LOAD_ERROR\\"\\n    );\\n  }\\n  const cache = lowRes ? lowResImageCache : imageCache;\\n  const cacheEntry = cache.get(url);\\n  if (cacheEntry?.image) {\\n    cacheEntry.lastUsed = Date.now();\\n    return cacheEntry.image;\\n  }\\n  if (cache.size >= MAX_CACHE_SIZE) {\\n    cleanImageCache();\\n  }\\n  try {\\n    const img = await loadImage(url);\\n    if (lowRes) {\\n      const lowResImg = await createLowResImage(img);\\n      cache.set(url, { image: lowResImg, lastUsed: Date.now() });\\n      return lowResImg;\\n    }\\n    cache.set(url, { image: img, lastUsed: Date.now() });\\n    return img;\\n  } catch (error) {\\n    const message = error instanceof Error ? error.message : \\"Unknown error\\";\\n    throw new CanvasOperationError(\\n      `Failed to load and cache image: ${message}`,\\n      \\"IMAGE_CACHE_ERROR\\"\\n    );\\n  }\\n}\\nexport function isCanvasReady() {\\n  try {\\n    if (!browser) {\\n      throw new CanvasOperationError(\\n        \\"Canvas operations are only available in browser environment\\",\\n        \\"BROWSER_UNAVAILABLE\\"\\n      );\\n    }\\n    if (!displayCanvas) {\\n      throw new CanvasOperationError(\\n        \\"Display canvas is not initialized\\",\\n        \\"DISPLAY_CANVAS_MISSING\\"\\n      );\\n    }\\n    if (!bufferCanvas) {\\n      throw new CanvasOperationError(\\n        \\"Buffer canvas is not initialized\\",\\n        \\"BUFFER_CANVAS_MISSING\\"\\n      );\\n    }\\n    if (!offscreenCanvas) {\\n      throw new CanvasOperationError(\\n        \\"Offscreen canvas is not initialized\\",\\n        \\"OFFSCREEN_CANVAS_MISSING\\"\\n      );\\n    }\\n    if (!displayCtx || !bufferCtx) {\\n      throw new CanvasOperationError(\\n        \\"Canvas context is not initialized\\",\\n        \\"CONTEXT_MISSING\\"\\n      );\\n    }\\n    if (!isReady) {\\n      throw new CanvasOperationError(\\n        \\"Canvas is not ready for operations\\",\\n        \\"CANVAS_NOT_READY\\"\\n      );\\n    }\\n    return { ready: true };\\n  } catch (error) {\\n    if (error instanceof CanvasOperationError) {\\n      return {\\n        ready: false,\\n        error: {\\n          code: error.code,\\n          message: error.message\\n        }\\n      };\\n    }\\n    return {\\n      ready: false,\\n      error: {\\n        code: \\"UNKNOWN_ERROR\\",\\n        message: \\"An unexpected error occurred while checking canvas readiness\\"\\n      }\\n    };\\n  }\\n}\\nonMount(async () => {\\n  if (browser) {\\n    isMounted = true;\\n    await initializeCanvases();\\n    memoryCheckInterval = setInterval(checkMemoryUsage, MEMORY_CHECK_INTERVAL);\\n  }\\n});\\nonDestroy(() => {\\n  if (memoryCheckInterval) {\\n    clearInterval(memoryCheckInterval);\\n  }\\n  disposeCanvas(displayCanvas);\\n  disposeCanvas(bufferCanvas);\\n  cleanImageCache();\\n});\\nafterUpdate(async () => {\\n  if (browser && !isReady && isMounted) {\\n    await initializeCanvases();\\n  }\\n});\\nasync function initializeCanvases() {\\n  if (!browser || !displayCanvas) {\\n    dispatch(\\"error\\", {\\n      code: \\"INITIALIZATION_ERROR\\",\\n      message: \\"Cannot initialize canvas: browser or canvas not available\\"\\n    });\\n    return;\\n  }\\n  try {\\n    displayCtx = displayCanvas.getContext(\\"2d\\");\\n    if (!displayCtx) {\\n      throw new CanvasOperationError(\\n        \\"Failed to get display canvas context\\",\\n        \\"DISPLAY_CONTEXT_ERROR\\"\\n      );\\n    }\\n    bufferCanvas = document.createElement(\\"canvas\\");\\n    bufferCtx = bufferCanvas.getContext(\\"2d\\");\\n    if (!bufferCtx) {\\n      throw new CanvasOperationError(\\n        \\"Failed to get buffer canvas context\\",\\n        \\"BUFFER_CONTEXT_ERROR\\"\\n      );\\n    }\\n    offscreenCanvas = new OffscreenCanvas(FULL_WIDTH, FULL_HEIGHT);\\n    await new Promise((resolve) => requestAnimationFrame(resolve));\\n    isReady = true;\\n    await renderIdCard();\\n    dispatch(\\"ready\\", { isReady: true });\\n  } catch (error) {\\n    isReady = false;\\n    const errorDetails = error instanceof CanvasOperationError ? { code: error.code, message: error.message } : { code: \\"INITIALIZATION_ERROR\\", message: \\"Failed to initialize canvas\\" };\\n    dispatch(\\"error\\", errorDetails);\\n  }\\n}\\nasync function loadImage(url) {\\n  if (!browser || !url) {\\n    throw new CanvasOperationError(\\n      \\"Cannot load image: browser not available or URL is empty\\",\\n      \\"IMAGE_LOAD_ERROR\\"\\n    );\\n  }\\n  return new Promise((resolve, reject) => {\\n    const img = new Image();\\n    img.crossOrigin = \\"anonymous\\";\\n    img.onload = () => resolve(img);\\n    img.onerror = () => reject(new CanvasOperationError(\\n      `Failed to load image: ${url}`,\\n      \\"IMAGE_LOAD_ERROR\\"\\n    ));\\n    img.src = url;\\n  });\\n}\\nasync function createLowResImage(img) {\\n  if (!browser) return img;\\n  try {\\n    const canvas = document.createElement(\\"canvas\\");\\n    const ctx = canvas.getContext(\\"2d\\");\\n    if (!ctx) {\\n      throw new CanvasOperationError(\\n        \\"Failed to get context for low-res image creation\\",\\n        \\"LOWRES_CONTEXT_ERROR\\"\\n      );\\n    }\\n    const pxLimit = 400;\\n    let newWidth = img.width * LOW_RES_SCALE;\\n    let newHeight = img.height * LOW_RES_SCALE;\\n    if (newWidth > pxLimit || newHeight > pxLimit) {\\n      const aspectRatio = img.width / img.height;\\n      if (newWidth > newHeight) {\\n        newWidth = pxLimit;\\n        newHeight = newWidth / aspectRatio;\\n      } else {\\n        newHeight = pxLimit;\\n        newWidth = newHeight * aspectRatio;\\n      }\\n    }\\n    canvas.width = newWidth;\\n    canvas.height = newHeight;\\n    ctx.drawImage(img, 0, 0, newWidth, newHeight);\\n    return new Promise((resolve, reject) => {\\n      canvas.toBlob((blob) => {\\n        if (!blob) {\\n          reject(new CanvasOperationError(\\n            \\"Failed to create blob for low-res image\\",\\n            \\"BLOB_CREATION_ERROR\\"\\n          ));\\n          return;\\n        }\\n        const lowResImg = new Image();\\n        lowResImg.onload = () => {\\n          disposeCanvas(canvas);\\n          resolve(lowResImg);\\n        };\\n        lowResImg.onerror = (error) => reject(new CanvasOperationError(\\n          \\"Failed to load low-res image\\",\\n          \\"LOWRES_LOAD_ERROR\\"\\n        ));\\n        const objectUrl = URL.createObjectURL(blob);\\n        lowResImg.src = objectUrl;\\n        lowResImg.onload = () => {\\n          URL.revokeObjectURL(objectUrl);\\n          resolve(lowResImg);\\n        };\\n      }, \\"image/jpeg\\", 0.5);\\n    });\\n  } catch (error) {\\n    console.error(\\"Error creating low-res image:\\", error);\\n    return img;\\n  }\\n}\\nfunction getFontString(options) {\\n  const {\\n    style = \\"normal\\",\\n    weight = 400,\\n    size = 16,\\n    family = \\"Arial\\"\\n  } = options;\\n  return `${style} ${weight} ${size}px \\"${family}\\"`;\\n}\\nfunction measureTextHeight(ctx, options = {}) {\\n  if (!browser) return 0;\\n  const previousFont = ctx.font;\\n  const testString = \\"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 \\";\\n  try {\\n    ctx.font = getFontString(options);\\n    const metrics = ctx.measureText(testString);\\n    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;\\n    const fontBoundingBoxAscent = metrics.fontBoundingBoxAscent || 0;\\n    const fontBoundingBoxDescent = metrics.fontBoundingBoxDescent || 0;\\n    const totalHeight = Math.max(\\n      height,\\n      fontBoundingBoxAscent + fontBoundingBoxDescent\\n    );\\n    return totalHeight;\\n  } catch (error) {\\n    console.error(\\"Error measuring text height:\\", error);\\n    return 0;\\n  } finally {\\n    ctx.font = previousFont;\\n  }\\n}\\nconst debouncedRender = debounce(() => {\\n  if (!renderRequested && browser) {\\n    renderRequested = true;\\n    requestAnimationFrame(renderIdCard);\\n  }\\n}, DEBOUNCE_DELAY);\\nasync function renderIdCard() {\\n  const readinessCheck = isCanvasReady();\\n  if (!readinessCheck.ready || isRendering) {\\n    if (readinessCheck.error) {\\n      dispatch(\\"error\\", readinessCheck.error);\\n    }\\n    return;\\n  }\\n  try {\\n    isRendering = true;\\n    renderRequested = false;\\n    const scale = fullResolution ? 1 : PREVIEW_SCALE;\\n    const width = FULL_WIDTH * scale;\\n    const height = FULL_HEIGHT * scale;\\n    if (bufferCanvas.width !== width || bufferCanvas.height !== height) {\\n      bufferCanvas.width = width;\\n      bufferCanvas.height = height;\\n    }\\n    await renderCanvas(bufferCtx, scale, false);\\n    if (displayCanvas.width !== width || displayCanvas.height !== height) {\\n      displayCanvas.width = width;\\n      displayCanvas.height = height;\\n    }\\n    displayCtx.drawImage(bufferCanvas, 0, 0);\\n    dispatch(\\"rendered\\");\\n    checkMemoryUsage();\\n  } catch (error) {\\n    const errorDetails = error instanceof CanvasOperationError ? { code: error.code, message: error.message } : { code: \\"RENDER_ERROR\\", message: \\"Failed to render ID card\\" };\\n    dispatch(\\"error\\", errorDetails);\\n  } finally {\\n    isRendering = false;\\n    if (renderRequested && browser) {\\n      requestAnimationFrame(renderIdCard);\\n    }\\n  }\\n}\\nasync function renderCanvas(ctx, scale, isOffScreen) {\\n  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);\\n  if (backgroundUrl) {\\n    try {\\n      const backgroundImage = await loadAndCacheImage(backgroundUrl);\\n      ctx.drawImage(backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);\\n    } catch (error) {\\n      dispatch(\\"error\\", {\\n        code: \\"BACKGROUND_LOAD_ERROR\\",\\n        message: \\"Error loading background image\\"\\n      });\\n    }\\n  }\\n  for (const element of elements) {\\n    try {\\n      if (element.type === \\"text\\" || element.type === \\"selection\\") {\\n        renderTextElement(ctx, element, scale);\\n      } else if (element.type === \\"photo\\" || element.type === \\"signature\\") {\\n        await renderImageElement(ctx, element, scale, isOffScreen);\\n      }\\n    } catch (error) {\\n      dispatch(\\"error\\", {\\n        code: \\"ELEMENT_RENDER_ERROR\\",\\n        message: `Error rendering element ${element.variableName}`\\n      });\\n    }\\n  }\\n}\\nfunction renderTextElement(ctx, element, scale) {\\n  if (element.type !== \\"text\\" && element.type !== \\"selection\\") return;\\n  try {\\n    const nScale = scale * ELEMENT_SCALE;\\n    const fontSize = (element.size || 12) * nScale;\\n    const fontOptions = {\\n      family: element.font,\\n      size: fontSize,\\n      // Use scaled font size\\n      weight: element.fontWeight,\\n      style: element.fontStyle\\n    };\\n    ctx.font = getFontString(fontOptions);\\n    ctx.fillStyle = element.color || \\"black\\";\\n    ctx.textAlign = element.alignment;\\n    ctx.textBaseline = \\"middle\\";\\n    let text = \\"\\";\\n    if (element.type === \\"selection\\") {\\n      text = formData[element.variableName] || element.options?.[0] || \\"\\";\\n    } else {\\n      text = formData[element.variableName] || \\"\\";\\n    }\\n    const transform = element.textTransform || \\"none\\";\\n    if (transform === \\"uppercase\\") {\\n      text = text.toUpperCase();\\n    } else if (transform === \\"lowercase\\") {\\n      text = text.toLowerCase();\\n    } else if (transform === \\"capitalize\\") {\\n      text = text.split(\\" \\").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(\\" \\");\\n    }\\n    const elementWidth = (element.width || 0) * nScale;\\n    const elementHeight = (element.height || 0) * nScale;\\n    const elementX = (element.x || 0) * nScale;\\n    const elementY = (element.y || 0) * nScale;\\n    let x = elementX;\\n    if (element.alignment === \\"center\\") {\\n      x += elementWidth / 2;\\n    } else if (element.alignment === \\"right\\") {\\n      x += elementWidth;\\n    }\\n    const textHeight = measureTextHeight(ctx, fontOptions);\\n    const y = elementY + elementHeight / 2;\\n    if (element.textDecoration === \\"underline\\") {\\n      const metrics = ctx.measureText(text);\\n      const lineY = y + textHeight / 2;\\n      ctx.beginPath();\\n      ctx.moveTo(x - (element.alignment === \\"right\\" ? metrics.width : 0), lineY);\\n      ctx.lineTo(x + (element.alignment === \\"left\\" ? metrics.width : 0), lineY);\\n      ctx.strokeStyle = element.color || \\"black\\";\\n      ctx.lineWidth = Math.max(1, fontSize * 0.05);\\n      ctx.stroke();\\n    }\\n    if (typeof element.opacity === \\"number\\") {\\n      ctx.globalAlpha = element.opacity;\\n    }\\n    ctx.fillText(text, x, y);\\n    ctx.globalAlpha = 1;\\n  } catch (error) {\\n    throw new CanvasOperationError(\\n      `Failed to render text element: ${element.variableName}`,\\n      \\"TEXT_RENDER_ERROR\\"\\n    );\\n  }\\n}\\nasync function renderImageElement(ctx, element, scale, isOffScreen) {\\n  if (element.type !== \\"photo\\" && element.type !== \\"signature\\") return;\\n  try {\\n    const nScale = scale * ELEMENT_SCALE;\\n    const file = fileUploads[element.variableName];\\n    const pos = imagePositions[element.variableName];\\n    const elementX = (element.x || 0) * nScale;\\n    const elementY = (element.y || 0) * nScale;\\n    const elementWidth = (element.width || 100) * nScale;\\n    const elementHeight = (element.height || 100) * nScale;\\n    ctx.save();\\n    ctx.beginPath();\\n    ctx.rect(elementX, elementY, elementWidth, elementHeight);\\n    ctx.clip();\\n    if (file) {\\n      try {\\n        const image = await loadAndCacheImage(\\n          URL.createObjectURL(file),\\n          isDragging && !isOffScreen && !(element.type === \\"signature\\")\\n        );\\n        const imgAspectRatio = image.width / image.height;\\n        const elementAspectRatio = elementWidth / elementHeight;\\n        let drawWidth = elementWidth * (pos.scale || 1);\\n        let drawHeight = elementHeight * (pos.scale || 1);\\n        if (imgAspectRatio > elementAspectRatio) {\\n          drawHeight = drawWidth / imgAspectRatio;\\n        } else {\\n          drawWidth = drawHeight * imgAspectRatio;\\n        }\\n        const x = elementX + (elementWidth - drawWidth) / 2 + (pos.x || 0) * nScale;\\n        const y = elementY + (elementHeight - drawHeight) / 2 + (pos.y || 0) * nScale;\\n        if (element.type === \\"signature\\") {\\n          ctx.globalCompositeOperation = \\"multiply\\";\\n        }\\n        ctx.drawImage(image, x, y, drawWidth, drawHeight);\\n        ctx.globalCompositeOperation = \\"source-over\\";\\n      } catch (error) {\\n        if (!isOffScreen) {\\n          renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, \\"Error Photo\\", nScale);\\n        }\\n        throw new CanvasOperationError(\\n          `Failed to load image for ${element.variableName}: ${error.message || \\"Unknown error\\"}`,\\n          \\"IMAGE_RENDER_ERROR\\"\\n        );\\n      }\\n    } else if (!isOffScreen) {\\n      renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, element.type, nScale);\\n    }\\n    ctx.restore();\\n  } catch (error) {\\n    throw new CanvasOperationError(\\n      `Failed to render image element: ${element.variableName}`,\\n      \\"IMAGE_RENDER_ERROR\\"\\n    );\\n  }\\n}\\nfunction renderPlaceholder(ctx, x, y, width, height, type, scale) {\\n  if (!browser) return;\\n  try {\\n    ctx.fillStyle = \\"#f0f0f0\\";\\n    ctx.fillRect(x, y, width, height);\\n    ctx.strokeStyle = \\"#999\\";\\n    ctx.strokeRect(x, y, width, height);\\n    ctx.fillStyle = \\"#999\\";\\n    ctx.font = `${12 * scale}px Arial`;\\n    ctx.textAlign = \\"center\\";\\n    ctx.textBaseline = \\"middle\\";\\n    ctx.fillText(type, x + width / 2, y + height / 2);\\n  } catch (error) {\\n    throw new CanvasOperationError(\\n      \\"Failed to render placeholder\\",\\n      \\"PLACEHOLDER_RENDER_ERROR\\"\\n    );\\n  }\\n}\\nexport async function renderFullResolution() {\\n  const readinessCheck = isCanvasReady();\\n  if (!readinessCheck.ready) {\\n    dispatch(\\"error\\", {\\n      code: readinessCheck.error?.code || \\"CANVAS_NOT_READY\\",\\n      message: readinessCheck.error?.message || \\"Canvas is not ready for rendering\\"\\n    });\\n    throw new CanvasOperationError(\\n      readinessCheck.error?.message || \\"Canvas is not ready for rendering\\",\\n      readinessCheck.error?.code || \\"CANVAS_NOT_READY\\"\\n    );\\n  }\\n  if (!offscreenCanvas) {\\n    const error = {\\n      code: \\"OFFSCREEN_CANVAS_ERROR\\",\\n      message: \\"Offscreen canvas is not available for full resolution render\\"\\n    };\\n    dispatch(\\"error\\", error);\\n    throw new CanvasOperationError(error.message, error.code);\\n  }\\n  try {\\n    const offscreenCtx = offscreenCanvas.getContext(\\"2d\\");\\n    if (!offscreenCtx) {\\n      throw new CanvasOperationError(\\n        \\"Could not get 2D context from offscreen canvas\\",\\n        \\"CONTEXT_ACQUISITION_ERROR\\"\\n      );\\n    }\\n    offscreenCanvas.width = FULL_WIDTH;\\n    offscreenCanvas.height = FULL_HEIGHT;\\n    offscreenCtx.clearRect(0, 0, FULL_WIDTH, FULL_HEIGHT);\\n    await renderCanvas(offscreenCtx, 1, true);\\n    const blob = await offscreenCanvas.convertToBlob({\\n      type: \\"image/png\\",\\n      quality: 1\\n    });\\n    if (!blob) {\\n      throw new CanvasOperationError(\\n        \\"Failed to generate image blob\\",\\n        \\"BLOB_GENERATION_ERROR\\"\\n      );\\n    }\\n    return blob;\\n  } catch (error) {\\n    const errorDetails = error instanceof CanvasOperationError ? { code: error.code, message: error.message } : { code: \\"RENDER_ERROR\\", message: \\"Failed to render full resolution image\\" };\\n    dispatch(\\"error\\", errorDetails);\\n    throw new CanvasOperationError(errorDetails.message, errorDetails.code);\\n  }\\n}\\n$: if (elements || formData || fileUploads || imagePositions || fullResolution || isDragging) {\\n  if (browser) {\\n    debouncedRender();\\n  }\\n}\\n<\/script>\\n\\n<canvas \\n    bind:this={displayCanvas} \\n    class=\\"id-canvas\\"\\n/>\\n\\n<style lang=\\"postcss\\">\\n    .id-canvas {\\n        border-radius: calc(var(--radius) - 2px);\\n        border-width: 1px;\\n        --tw-border-opacity: 1;\\n        border-color: rgb(226 232 240 / var(--tw-border-opacity, 1));\\n        --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);\\n        --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);\\n        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\\n        image-rendering: -webkit-optimize-contrast;\\n        image-rendering: crisp-edges;\\n        width: 100%; /* Make it stretch to its container\'s width */\\n  height: auto; /* Maintain aspect ratio */\\n  display: block /* Avoid inline gap */\\n}\\n</style>"],"names":[],"mappings":"AAmmBI,yBAAW,CACP,aAAa,CAAE,KAAK,IAAI,QAAQ,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACxC,YAAY,CAAE,GAAG,CACjB,mBAAmB,CAAE,CAAC,CACtB,YAAY,CAAE,IAAI,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,IAAI,mBAAmB,CAAC,EAAE,CAAC,CAAC,CAC5D,WAAW,CAAE,6BAA6B,CAC1C,mBAAmB,CAAE,kCAAkC,CACvD,UAAU,CAAE,IAAI,uBAAuB,CAAC,UAAU,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,UAAU,CAAC,CAAC,CAAC,IAAI,WAAW,CAAC,CACvG,eAAe,CAAE,yBAAyB,CAC1C,eAAe,CAAE,WAAW,CAC5B,KAAK,CAAE,IAAI,CACjB,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,KAAK;AAChB"}'
};
const DEBOUNCE_DELAY = 20;
const MAX_CACHE_SIZE = 20;
const IdCanvas = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { elements } = $$props;
  let { backgroundUrl } = $$props;
  let { formData } = $$props;
  let { fileUploads } = $$props;
  let { imagePositions } = $$props;
  let { fullResolution: fullResolution2 = false } = $$props;
  let { isDragging = false } = $$props;
  const dispatch = createEventDispatcher();
  class CanvasOperationError extends Error {
    code;
    constructor(message, code) {
      super(message);
      this.code = code;
      this.name = "CanvasOperationError";
    }
  }
  let displayCanvas;
  let bufferCanvas;
  let offscreenCanvas = null;
  let displayCtx = null;
  let bufferCtx = null;
  let isReady = false;
  const imageCache = /* @__PURE__ */ new Map();
  const lowResImageCache = /* @__PURE__ */ new Map();
  function cleanImageCache() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1e3;
    for (const [url, entry] of imageCache) {
      if (now - entry.lastUsed > maxAge) {
        URL.revokeObjectURL(url);
        imageCache.delete(url);
      }
    }
    for (const [url, entry] of lowResImageCache) {
      if (now - entry.lastUsed > maxAge) {
        URL.revokeObjectURL(url);
        lowResImageCache.delete(url);
      }
    }
    while (imageCache.size > MAX_CACHE_SIZE) {
      let oldestUrl = null;
      let oldestTime = Infinity;
      for (const [url, entry] of imageCache) {
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestUrl = url;
        }
      }
      if (oldestUrl) {
        URL.revokeObjectURL(oldestUrl);
        imageCache.delete(oldestUrl);
      }
    }
  }
  function isCanvasReady() {
    try {
      if (!browser) {
        throw new CanvasOperationError("Canvas operations are only available in browser environment", "BROWSER_UNAVAILABLE");
      }
      if (!displayCanvas) {
        throw new CanvasOperationError("Display canvas is not initialized", "DISPLAY_CANVAS_MISSING");
      }
      if (!bufferCanvas) {
        throw new CanvasOperationError("Buffer canvas is not initialized", "BUFFER_CANVAS_MISSING");
      }
      if (!offscreenCanvas) {
        throw new CanvasOperationError("Offscreen canvas is not initialized", "OFFSCREEN_CANVAS_MISSING");
      }
      if (!displayCtx || !bufferCtx) {
        throw new CanvasOperationError("Canvas context is not initialized", "CONTEXT_MISSING");
      }
      if (!isReady) {
        throw new CanvasOperationError("Canvas is not ready for operations", "CANVAS_NOT_READY");
      }
      return { ready: true };
    } catch (error) {
      if (error instanceof CanvasOperationError) {
        return {
          ready: false,
          error: { code: error.code, message: error.message }
        };
      }
      return {
        ready: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: "An unexpected error occurred while checking canvas readiness"
        }
      };
    }
  }
  onDestroy(() => {
    cleanImageCache();
  });
  debounce(
    () => {
    },
    DEBOUNCE_DELAY
  );
  async function renderFullResolution() {
    const readinessCheck = isCanvasReady();
    if (!readinessCheck.ready) {
      dispatch("error", {
        code: readinessCheck.error?.code || "CANVAS_NOT_READY",
        message: readinessCheck.error?.message || "Canvas is not ready for rendering"
      });
      throw new CanvasOperationError(readinessCheck.error?.message || "Canvas is not ready for rendering", readinessCheck.error?.code || "CANVAS_NOT_READY");
    }
    {
      const error = {
        code: "OFFSCREEN_CANVAS_ERROR",
        message: "Offscreen canvas is not available for full resolution render"
      };
      dispatch("error", error);
      throw new CanvasOperationError(error.message, error.code);
    }
  }
  if ($$props.elements === void 0 && $$bindings.elements && elements !== void 0) $$bindings.elements(elements);
  if ($$props.backgroundUrl === void 0 && $$bindings.backgroundUrl && backgroundUrl !== void 0) $$bindings.backgroundUrl(backgroundUrl);
  if ($$props.formData === void 0 && $$bindings.formData && formData !== void 0) $$bindings.formData(formData);
  if ($$props.fileUploads === void 0 && $$bindings.fileUploads && fileUploads !== void 0) $$bindings.fileUploads(fileUploads);
  if ($$props.imagePositions === void 0 && $$bindings.imagePositions && imagePositions !== void 0) $$bindings.imagePositions(imagePositions);
  if ($$props.fullResolution === void 0 && $$bindings.fullResolution && fullResolution2 !== void 0) $$bindings.fullResolution(fullResolution2);
  if ($$props.isDragging === void 0 && $$bindings.isDragging && isDragging !== void 0) $$bindings.isDragging(isDragging);
  if ($$props.isCanvasReady === void 0 && $$bindings.isCanvasReady && isCanvasReady !== void 0) $$bindings.isCanvasReady(isCanvasReady);
  if ($$props.renderFullResolution === void 0 && $$bindings.renderFullResolution && renderFullResolution !== void 0) $$bindings.renderFullResolution(renderFullResolution);
  $$result.css.add(css$1);
  return `<canvas class="id-canvas svelte-14cw9ao"${add_attribute("this", displayCanvas, 0)}></canvas>`;
});
const initialValue = false;
const darkMode = writable(initialValue);
const MAX_HEIGHT = 100;
const ThumbnailInput = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { width } = $$props;
  let { height } = $$props;
  let { fileUrl = null } = $$props;
  let { initialScale = 1 } = $$props;
  let { initialX = 0 } = $$props;
  let { initialY = 0 } = $$props;
  let { isSignature = false } = $$props;
  const dispatch = createEventDispatcher();
  let canvas;
  let ctx;
  let imageScale = initialScale;
  let imageX = initialX;
  let imageY = initialY;
  const aspectRatio = width / height;
  const thumbnailHeight = Math.min(MAX_HEIGHT, height);
  const thumbnailWidth = thumbnailHeight * aspectRatio;
  const scale = thumbnailHeight / height;
  function drawImage(img) {
    const imgAspectRatio = img.width / img.height;
    let drawWidth = width * imageScale;
    let drawHeight = height * imageScale;
    if (imgAspectRatio > aspectRatio) {
      drawHeight = drawWidth / imgAspectRatio;
    } else {
      drawWidth = drawHeight * imgAspectRatio;
    }
    ctx.clearRect(0, 0, thumbnailWidth, thumbnailHeight);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, thumbnailWidth, thumbnailHeight);
    ctx.clip();
    if (isSignature) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);
    }
    ctx.drawImage(img, imageX * scale + (thumbnailWidth - drawWidth * scale) / 2, imageY * scale + (thumbnailHeight - drawHeight * scale) / 2, drawWidth * scale, drawHeight * scale);
    ctx.restore();
  }
  debounce(
    (scale2, x, y) => {
      dispatch("update", { scale: scale2, x, y });
    },
    16
  );
  if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
  if ($$props.fileUrl === void 0 && $$bindings.fileUrl && fileUrl !== void 0) $$bindings.fileUrl(fileUrl);
  if ($$props.initialScale === void 0 && $$bindings.initialScale && initialScale !== void 0) $$bindings.initialScale(initialScale);
  if ($$props.initialX === void 0 && $$bindings.initialX && initialX !== void 0) $$bindings.initialX(initialX);
  if ($$props.initialY === void 0 && $$bindings.initialY && initialY !== void 0) $$bindings.initialY(initialY);
  if ($$props.isSignature === void 0 && $$bindings.isSignature && isSignature !== void 0) $$bindings.isSignature(isSignature);
  {
    if (fileUrl) {
      const img = new Image();
      img.onload = () => drawImage(img);
      img.src = fileUrl;
    }
  }
  return `<div class="flex items-center touch-none"><div class="relative" style="${"width: " + escape(thumbnailWidth, true) + "px; height: " + escape(thumbnailHeight, true) + "px;"}"><canvas${add_attribute("width", thumbnailWidth, 0)}${add_attribute("height", thumbnailHeight, 0)} class="cursor-pointer"${add_attribute("this", canvas, 0)}></canvas></div> <div class="ml-2 flex flex-col gap-2"><div class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-move active:bg-gray-300" role="button" tabindex="0" aria-label="Move image">${validate_component(Move, "Move").$$render($$result, { size: 16 }, {}, {})}</div> <div class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-se-resize active:bg-gray-300" role="button" tabindex="0" aria-label="Resize image">${validate_component(Scaling, "Scaling").$$render($$result, { size: 16 }, {}, {})}</div></div></div>`;
});
const css = {
  code: ".dark{color-scheme:dark}.canvas-wrapper.svelte-1mja2ju{display:flex;gap:20px}.canvas-wrapper.landscape.svelte-1mja2ju{flex-direction:column}.canvas-wrapper.portrait.svelte-1mja2ju{flex-direction:row}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, onDestroy } from \\"svelte\\";\\nimport { page } from \\"$app/stores\\";\\nimport { auth, session, user } from \\"$lib/stores/auth\\";\\nimport IdCanvas from \\"$lib/IdCanvas.svelte\\";\\nimport { Button } from \\"$lib/components/ui/button\\";\\nimport { Card } from \\"$lib/components/ui/card\\";\\nimport { Input } from \\"$lib/components/ui/input\\";\\nimport { Label } from \\"$lib/components/ui/label\\";\\nimport * as Select from \\"$lib/components/ui/select\\";\\nimport { darkMode } from \\"../../../../stores/darkMode\\";\\nimport ThumbnailInput from \\"$lib/ThumbnailInput.svelte\\";\\nimport { Loader } from \\"lucide-svelte\\";\\nimport { goto } from \\"$app/navigation\\";\\nimport { enhance } from \\"$app/forms\\";\\nexport let data;\\nlet templateId = $page.params.id;\\nlet template = {\\n  ...data.template,\\n  template_elements: data.template.template_elements.map((element) => ({\\n    ...element,\\n    width: element.width ?? 100,\\n    height: element.height ?? 100\\n  }))\\n};\\nlet loading = false;\\nlet error = null;\\nlet formElement;\\nlet debugMessages = [];\\nlet formData = {};\\nlet fileUploads = {};\\nlet imagePositions = {};\\nlet selectedOptions = {};\\nlet frontCanvasComponent;\\nlet backCanvasComponent;\\nlet frontCanvasReady = false;\\nlet backCanvasReady = false;\\nlet fullResolution = false;\\nlet mouseMoving = false;\\nlet formErrors = {};\\nlet fileUrls = {};\\n$: {\\n  console.log(\\"Use Template Page: Session exists:\\", !!$session);\\n  console.log(\\"Use Template Page: User exists:\\", !!$user);\\n}\\nfunction initializeFormData() {\\n  if (!template?.template_elements) return;\\n  template.template_elements.forEach((element) => {\\n    if (!element.variableName) return;\\n    if (element.type === \\"text\\" || element.type === \\"selection\\") {\\n      formData[element.variableName] = element.content || \\"\\";\\n      if (element.type === \\"selection\\") {\\n        selectedOptions[element.variableName] = {\\n          value: formData[element.variableName],\\n          label: formData[element.variableName] || \\"Select an option\\"\\n        };\\n      }\\n    } else if (element.type === \\"photo\\" || element.type === \\"signature\\") {\\n      fileUploads[element.variableName] = null;\\n      imagePositions[element.variableName] = {\\n        x: 0,\\n        y: 0,\\n        width: element.width || 100,\\n        height: element.height || 100,\\n        scale: 1\\n      };\\n    }\\n  });\\n}\\nonMount(async () => {\\n  if (!templateId) {\\n    error = \\"No template ID provided\\";\\n    return;\\n  }\\n  console.log(\\" [Use Template] Initializing with template:\\", {\\n    id: template.id,\\n    name: template.name,\\n    elementsCount: template.template_elements?.length || 0\\n  });\\n  initializeFormData();\\n});\\nfunction handleCanvasReady(side) {\\n  if (side === \\"front\\") {\\n    frontCanvasReady = true;\\n  } else {\\n    backCanvasReady = true;\\n  }\\n}\\nfunction handleSelectionChange(event, variableName) {\\n  const selection = event.detail;\\n  formData[variableName] = selection.value;\\n  selectedOptions[variableName] = {\\n    value: selection.value,\\n    label: selection.label\\n  };\\n}\\nfunction handleImageUpdate(event, variableName) {\\n  const { scale, x, y } = event.detail;\\n  imagePositions[variableName] = {\\n    ...imagePositions[variableName],\\n    scale,\\n    x,\\n    y\\n  };\\n}\\nasync function handleSubmit(event) {\\n  event.preventDefault();\\n  try {\\n    if (!validateForm()) {\\n      error = \\"Please fill in all required fields\\";\\n      return;\\n    }\\n    loading = true;\\n    error = null;\\n    if (!template || !frontCanvasComponent || !backCanvasComponent) {\\n      error = \\"Missing required components\\";\\n      return;\\n    }\\n    const [frontBlob, backBlob] = await Promise.all([\\n      frontCanvasComponent.renderFullResolution(),\\n      backCanvasComponent.renderFullResolution()\\n    ]);\\n    const form = event.target;\\n    const formData2 = new FormData(form);\\n    formData2.append(\\"templateId\\", $page.params.id);\\n    formData2.append(\\"frontImage\\", frontBlob, \\"front.png\\");\\n    formData2.append(\\"backImage\\", backBlob, \\"back.png\\");\\n    const response = await fetch(\\"?/saveIdCard\\", {\\n      method: \\"POST\\",\\n      body: formData2\\n    });\\n    const result = await response.json();\\n    console.log(\\"Save response:\\", result);\\n    if (response.ok && (result.type === \\"success\\" || result.data && result.data[0]?.success)) {\\n      goto(\\"/id-gen/all-ids\\");\\n    } else {\\n      error = result.data && result.data[0]?.error || \\"Failed to save ID card\\";\\n      console.error(\\"Save error:\\", error);\\n    }\\n  } catch (err) {\\n    console.error(\\"Submit error:\\", err);\\n    error = err instanceof Error ? err.message : \\"An unexpected error occurred\\";\\n  } finally {\\n    loading = false;\\n  }\\n}\\nfunction handleMouseDown() {\\n  mouseMoving = true;\\n}\\nfunction handleMouseUp() {\\n  mouseMoving = false;\\n}\\nfunction handleToggle(checked) {\\n  darkMode.set(checked);\\n}\\nfunction handleSelectFile(variableName) {\\n  const input = document.createElement(\\"input\\");\\n  input.type = \\"file\\";\\n  input.accept = \\"image/*\\";\\n  input.onchange = (e) => handleFileUpload(e, variableName);\\n  input.click();\\n}\\nfunction handleFileUpload(event, variableName) {\\n  const input = event.target;\\n  if (!input.files?.length) return;\\n  const file = input.files[0];\\n  fileUploads[variableName] = file;\\n  if (fileUrls[variableName]) {\\n    URL.revokeObjectURL(fileUrls[variableName]);\\n  }\\n  const url = URL.createObjectURL(file);\\n  fileUrls[variableName] = url;\\n}\\nfunction validateForm() {\\n  formErrors = {};\\n  let isValid = true;\\n  let emptyFields = [];\\n  if (!template) return false;\\n  template.template_elements.forEach((element) => {\\n    if (!element.variableName) return;\\n    if (element.type === \\"text\\" || element.type === \\"selection\\") {\\n      if (!formData[element.variableName]?.trim()) {\\n        formErrors[element.variableName] = true;\\n        emptyFields.push(element.variableName);\\n        isValid = false;\\n      }\\n    }\\n  });\\n  if (!isValid) {\\n    addDebugMessage(\`Please fill in the following fields: \${emptyFields.join(\\", \\")}\`);\\n  }\\n  return isValid;\\n}\\nfunction addDebugMessage(message) {\\n  debugMessages = [...debugMessages, message];\\n}\\nonDestroy(() => {\\n  Object.values(fileUrls).forEach(URL.revokeObjectURL);\\n});\\n<\/script>\\n\\n<div class=\\"container mx-auto p-4 flex flex-col md:flex-row gap-4\\">\\n    <div class=\\"w-full md:w-1/2\\">\\n        <Card class=\\"h-full\\">\\n            <div class=\\"p-4\\">\\n                <h2 class=\\"text-2xl font-bold mb-4\\">ID Card Preview</h2>\\n                <div class=\\"canvas-wrapper\\" class:landscape={template?.orientation === 'landscape'} class:portrait={template?.orientation === 'portrait'}>\\n                    <div class=\\"front-canvas\\">\\n                        <h3 class=\\"text-lg font-semibold mb-2\\">Front</h3>\\n                        {#if template}\\n                        <div class=\\"w-full aspect-[1013/638]\\">\\n                            <IdCanvas\\n                                bind:this={frontCanvasComponent}\\n                                elements={template.template_elements.filter(el => el.side === 'front')}\\n                                backgroundUrl={template.front_background}\\n                                {formData}\\n                                {fileUploads}\\n                                {imagePositions}\\n                                {fullResolution}\\n                                isDragging={mouseMoving}\\n                                on:ready={() => handleCanvasReady('front')}\\n                                on:error={({ detail }) => addDebugMessage(\`Front Canvas Error: \${detail.code} - \${detail.message}\`)}\\n                            />\\n                        </div>\\n                        {/if}\\n                    </div>\\n                    <div class=\\"back-canvas\\">\\n                        <h3 class=\\"text-lg font-semibold mb-2\\">Back</h3>\\n                        {#if template}\\n                            <IdCanvas\\n                                bind:this={backCanvasComponent}\\n                                elements={template.template_elements.filter(el => el.side === 'back')}\\n                                backgroundUrl={template.back_background}\\n                                {formData}\\n                                {fileUploads}\\n                                {imagePositions}\\n                                {fullResolution}\\n                                isDragging={mouseMoving}\\n                                on:ready={() => handleCanvasReady('back')}\\n                                on:error={({ detail }) => addDebugMessage(\`Back Canvas Error: \${detail.code} - \${detail.message}\`)}\\n                            />\\n                        {/if}\\n                    </div>\\n                </div>\\n            </div>\\n        </Card>\\n    </div>\\n    <div class=\\"w-full md:w-1/2\\">\\n        <Card class=\\"h-full\\">\\n            <div class=\\"p-6\\">\\n                <div class=\\"flex justify-between items-center mb-4\\">\\n                    <h2 class=\\"text-2xl font-bold\\">ID Card Form</h2>\\n\\n                </div>\\n                <p class=\\"text-muted-foreground mb-6\\">Please fill out these details for your ID card.</p>\\n\\n                {#if template && template.template_elements}\\n                    <form \\n                        bind:this={formElement}\\n                        action=\\"?/saveIdCard\\"\\n                        method=\\"POST\\"\\n                        enctype=\\"multipart/form-data\\"\\n                        on:submit|preventDefault={handleSubmit}\\n                        use:enhance\\n                    >\\n                        {#each template.template_elements as element (element.variableName)}\\n                            {#if element.variableName}\\n                                <div role=\\"button\\" tabindex=\\"-1\\" class=\\"grid grid-cols-[auto,1fr] gap-4 items-center\\" \\n                                    on:mousedown={handleMouseDown} \\n                                    on:mouseup={handleMouseUp}>\\n                                    <Label for={element.variableName} class=\\"text-right\\">\\n                                        {element.variableName}\\n                                        {#if element.type === 'text' || element.type === 'selection'}\\n                                            <span class=\\"text-red-500\\">*</span>\\n                                        {/if}\\n                                    </Label>\\n                                    {#if element.type === 'text'}\\n                                        <div class=\\"w-full\\">\\n                                            <input \\n                                                type=\\"text\\"\\n                                                id={element.variableName}\\n                                                name={element.variableName}\\n                                                bind:value={formData[element.variableName]}\\n                                                class=\\"w-full px-3 py-2 border rounded-md {formErrors[element.variableName] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}\\"\\n                                                placeholder={\`Enter \${element.variableName}\`}\\n                                            />\\n                                            {#if formErrors[element.variableName]}\\n                                                <p class=\\"mt-1 text-sm text-red-500\\">This field is required</p>\\n                                            {/if}\\n                                        </div>\\n                                    {:else if element.type === 'selection' && element.options}\\n                                        <div class=\\"relative w-full\\">\\n                                            <Select.Root\\n                                                selected={selectedOptions[element.variableName]}\\n                                                onSelectedChange={(selection) => {\\n                                                    if (selection && typeof selection.value === 'string') {\\n                                                        formData[element.variableName] = selection.value;\\n                                                        selectedOptions[element.variableName] = {\\n                                                            value: selection.value,\\n                                                            label: selection.value\\n                                                        };\\n                                                        // Clear error when value is selected\\n                                                        if (formErrors[element.variableName]) {\\n                                                            formErrors[element.variableName] = false;\\n                                                        }\\n                                                    }\\n                                                }}\\n                                            >\\n                                                <Select.Trigger class=\\"w-full {formErrors[element.variableName] ? 'border-red-500 ring-1 ring-red-500' : ''}\\">\\n                                                    <Select.Value placeholder=\\"Select an option\\">\\n                                                        {selectedOptions[element.variableName]?.label || 'Select an option'}\\n                                                    </Select.Value>\\n                                                </Select.Trigger>\\n                                                <Select.Content>\\n                                                    {#each element.options as option}\\n                                                        <Select.Item \\n                                                            value={option}\\n                                                            label={option}\\n                                                        >\\n                                                            {option}\\n                                                        </Select.Item>\\n                                                    {/each}\\n                                                </Select.Content>\\n                                            </Select.Root>\\n                                            {#if formErrors[element.variableName]}\\n                                                <p class=\\"mt-1 text-sm text-red-500\\">Please select an option</p>\\n                                            {/if}\\n                                        </div>\\n\\n                                    {:else if element.type === 'photo' || element.type === 'signature'}\\n                                        <ThumbnailInput\\n                                            width={element.width}\\n                                            height={element.height}\\n                                            fileUrl={fileUrls[element.variableName]}\\n                                            initialScale={imagePositions[element.variableName]?.scale ?? 1}\\n                                            initialX={imagePositions[element.variableName]?.x ?? 0}\\n                                            initialY={imagePositions[element.variableName]?.y ?? 0}\\n                                            isSignature={element.type === 'signature'}\\n                                            on:selectFile={() => handleSelectFile(element.variableName)}\\n                                            on:update={(e) => handleImageUpdate(e, element.variableName)}\\n                                        />\\n                                    {/if}\\n                                </div>\\n                            {/if}\\n                        {/each}\\n                        <Button type=\\"submit\\" class=\\"w-full mt-6\\" disabled={loading}>\\n                            {#if loading}\\n                                <Loader class=\\"mr-2 h-4 w-4 animate-spin\\" />\\n                            {/if}\\n                            Generate and Save ID Card\\n                        </Button>\\n                        {#if error}\\n                            <p class=\\"mt-2 text-sm text-red-500\\">{error}</p>\\n                        {/if}\\n                    </form>\\n                {/if}\\n\\n                {#if debugMessages.length > 0}\\n                    <div class=\\"mt-6 p-4 rounded-lg {$darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'} border {$darkMode ? 'border-gray-700' : 'border-gray-300'}\\">\\n                        <h3 class=\\"font-bold mb-2 {$darkMode ? 'text-gray-100' : 'text-gray-800'}\\">Debug Messages:</h3>\\n                        <div class=\\"space-y-1\\">\\n                            {#each debugMessages as message}\\n                                <div class=\\"py-1 {$darkMode ? 'text-gray-300' : 'text-gray-700'}\\">{message}</div>\\n                            {/each}\\n                        </div>\\n                    </div>\\n                {/if}\\n            </div>\\n        </Card>\\n    </div>\\n</div>\\n\\n<style>\\n    :global(.dark) {\\n        color-scheme: dark;\\n    }\\n    .canvas-wrapper {\\n        display: flex;\\n        gap: 20px;\\n    }\\n    .canvas-wrapper.landscape {\\n        flex-direction: column;\\n    }\\n    .canvas-wrapper.portrait {\\n        flex-direction: row;\\n    }\\n</style>"],"names":[],"mappings":"AAoXY,KAAO,CACX,YAAY,CAAE,IAClB,CACA,8BAAgB,CACZ,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IACT,CACA,eAAe,yBAAW,CACtB,cAAc,CAAE,MACpB,CACA,eAAe,wBAAU,CACrB,cAAc,CAAE,GACpB"}`
};
let fullResolution = false;
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $user, $$unsubscribe_user;
  let $session, $$unsubscribe_session;
  let $darkMode, $$unsubscribe_darkMode;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  $$unsubscribe_darkMode = subscribe(darkMode, (value) => $darkMode = value);
  let { data } = $$props;
  $page.params.id;
  let template = {
    ...data.template,
    template_elements: data.template.template_elements.map((element) => ({
      ...element,
      width: element.width ?? 100,
      height: element.height ?? 100
    }))
  };
  let loading = false;
  let formElement;
  let debugMessages = [];
  let formData = {};
  let fileUploads = {};
  let imagePositions = {};
  let selectedOptions = {};
  let frontCanvasComponent;
  let backCanvasComponent;
  let mouseMoving = false;
  let formErrors = {};
  let fileUrls = {};
  onDestroy(() => {
    Object.values(fileUrls).forEach(URL.revokeObjectURL);
  });
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    {
      {
        console.log("Use Template Page: Session exists:", !!$session);
        console.log("Use Template Page: User exists:", !!$user);
      }
    }
    $$rendered = `<div class="container mx-auto p-4 flex flex-col md:flex-row gap-4"><div class="w-full md:w-1/2">${validate_component(Card, "Card").$$render($$result, { class: "h-full" }, {}, {
      default: () => {
        return `<div class="p-4"><h2 class="text-2xl font-bold mb-4" data-svelte-h="svelte-5zsvjx">ID Card Preview</h2> <div class="${[
          "canvas-wrapper svelte-1mja2ju",
          (template?.orientation === "landscape" ? "landscape" : "") + " " + (template?.orientation === "portrait" ? "portrait" : "")
        ].join(" ").trim()}"><div class="front-canvas"><h3 class="text-lg font-semibold mb-2" data-svelte-h="svelte-5fkg9y">Front</h3> ${`<div class="w-full aspect-[1013/638]">${validate_component(IdCanvas, "IdCanvas").$$render(
          $$result,
          {
            elements: template.template_elements.filter((el) => el.side === "front"),
            backgroundUrl: template.front_background,
            formData,
            fileUploads,
            imagePositions,
            fullResolution,
            isDragging: mouseMoving,
            this: frontCanvasComponent
          },
          {
            this: ($$value) => {
              frontCanvasComponent = $$value;
              $$settled = false;
            }
          },
          {}
        )}</div>`}</div> <div class="back-canvas"><h3 class="text-lg font-semibold mb-2" data-svelte-h="svelte-iu2gxi">Back</h3> ${`${validate_component(IdCanvas, "IdCanvas").$$render(
          $$result,
          {
            elements: template.template_elements.filter((el) => el.side === "back"),
            backgroundUrl: template.back_background,
            formData,
            fileUploads,
            imagePositions,
            fullResolution,
            isDragging: mouseMoving,
            this: backCanvasComponent
          },
          {
            this: ($$value) => {
              backCanvasComponent = $$value;
              $$settled = false;
            }
          },
          {}
        )}`}</div></div></div>`;
      }
    })}</div> <div class="w-full md:w-1/2">${validate_component(Card, "Card").$$render($$result, { class: "h-full" }, {}, {
      default: () => {
        return `<div class="p-6"><div class="flex justify-between items-center mb-4" data-svelte-h="svelte-147ibdb"><h2 class="text-2xl font-bold">ID Card Form</h2></div> <p class="text-muted-foreground mb-6" data-svelte-h="svelte-ygmfwx">Please fill out these details for your ID card.</p> ${template.template_elements ? `<form action="?/saveIdCard" method="POST" enctype="multipart/form-data"${add_attribute("this", formElement, 0)}>${each(template.template_elements, (element) => {
          return `${element.variableName ? `<div role="button" tabindex="-1" class="grid grid-cols-[auto,1fr] gap-4 items-center">${validate_component(Label, "Label").$$render(
            $$result,
            {
              for: element.variableName,
              class: "text-right"
            },
            {},
            {
              default: () => {
                return `${escape(element.variableName)} ${element.type === "text" || element.type === "selection" ? `<span class="text-red-500" data-svelte-h="svelte-1n3raya">*</span>` : ``} `;
              }
            }
          )} ${element.type === "text" ? `<div class="w-full"><input type="text"${add_attribute("id", element.variableName, 0)}${add_attribute("name", element.variableName, 0)} class="${"w-full px-3 py-2 border rounded-md " + escape(
            formErrors[element.variableName] ? "border-red-500 ring-1 ring-red-500" : "border-gray-300",
            true
          )}"${add_attribute("placeholder", `Enter ${element.variableName}`, 0)}${add_attribute("value", formData[element.variableName], 0)}> ${formErrors[element.variableName] ? `<p class="mt-1 text-sm text-red-500" data-svelte-h="svelte-1nolave">This field is required</p>` : ``} </div>` : `${element.type === "selection" && element.options ? `<div class="relative w-full">${validate_component(Root, "Select.Root").$$render(
            $$result,
            {
              selected: selectedOptions[element.variableName],
              onSelectedChange: (selection) => {
                if (selection && typeof selection.value === "string") {
                  formData[element.variableName] = selection.value;
                  selectedOptions[element.variableName] = {
                    value: selection.value,
                    label: selection.value
                  };
                  if (formErrors[element.variableName]) {
                    formErrors[element.variableName] = false;
                  }
                }
              }
            },
            {},
            {
              default: () => {
                return `${validate_component(Select_trigger, "Select.Trigger").$$render(
                  $$result,
                  {
                    class: "w-full " + (formErrors[element.variableName] ? "border-red-500 ring-1 ring-red-500" : "")
                  },
                  {},
                  {
                    default: () => {
                      return `${validate_component(Value, "Select.Value").$$render($$result, { placeholder: "Select an option" }, {}, {
                        default: () => {
                          return `${escape(selectedOptions[element.variableName]?.label || "Select an option")} `;
                        }
                      })} `;
                    }
                  }
                )} ${validate_component(Select_content, "Select.Content").$$render($$result, {}, {}, {
                  default: () => {
                    return `${each(element.options, (option) => {
                      return `${validate_component(Select_item, "Select.Item").$$render($$result, { value: option, label: option }, {}, {
                        default: () => {
                          return `${escape(option)} `;
                        }
                      })}`;
                    })} `;
                  }
                })} `;
              }
            }
          )} ${formErrors[element.variableName] ? `<p class="mt-1 text-sm text-red-500" data-svelte-h="svelte-1hudd6f">Please select an option</p>` : ``} </div>` : `${element.type === "photo" || element.type === "signature" ? `${validate_component(ThumbnailInput, "ThumbnailInput").$$render(
            $$result,
            {
              width: element.width,
              height: element.height,
              fileUrl: fileUrls[element.variableName],
              initialScale: imagePositions[element.variableName]?.scale ?? 1,
              initialX: imagePositions[element.variableName]?.x ?? 0,
              initialY: imagePositions[element.variableName]?.y ?? 0,
              isSignature: element.type === "signature"
            },
            {},
            {}
          )}` : ``}`}`} </div>` : ``}`;
        })} ${validate_component(Button, "Button").$$render(
          $$result,
          {
            type: "submit",
            class: "w-full mt-6",
            disabled: loading
          },
          {},
          {
            default: () => {
              return `${``}
                            Generate and Save ID Card`;
            }
          }
        )} ${``}</form>` : ``} ${debugMessages.length > 0 ? `<div class="${"mt-6 p-4 rounded-lg " + escape(
          $darkMode ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-800",
          true
        ) + " border " + escape($darkMode ? "border-gray-700" : "border-gray-300", true)}"><h3 class="${"font-bold mb-2 " + escape($darkMode ? "text-gray-100" : "text-gray-800", true)}">Debug Messages:</h3> <div class="space-y-1">${each(debugMessages, (message) => {
          return `<div class="${"py-1 " + escape($darkMode ? "text-gray-300" : "text-gray-700", true)}">${escape(message)}</div>`;
        })}</div></div>` : ``}</div>`;
      }
    })}</div> </div>`;
  } while (!$$settled);
  $$unsubscribe_page();
  $$unsubscribe_user();
  $$unsubscribe_session();
  $$unsubscribe_darkMode();
  return $$rendered;
});
export {
  Page as default
};
