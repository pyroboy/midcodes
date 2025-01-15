import { c as create_ssr_component, v as validate_component, f as createEventDispatcher, b as each, a as add_attribute, e as escape, s as subscribe } from "../../../../chunks/ssr.js";
import "../../../../chunks/supabaseClient.js";
import { w as writable } from "../../../../chunks/index4.js";
import "dequal";
import "../../../../chunks/create.js";
import "clsx";
import "../../../../chunks/index2.js";
import "../../../../chunks/client.js";
import { B as Button } from "../../../../chunks/button.js";
import { I as Icon } from "../../../../chunks/Icon.js";
import { T as Trash_2 } from "../../../../chunks/trash-2.js";
import { p as profile, s as session } from "../../../../chunks/auth.js";
const Copy = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "rect",
      {
        "width": "14",
        "height": "14",
        "x": "8",
        "y": "8",
        "rx": "2",
        "ry": "2"
      }
    ],
    [
      "path",
      {
        "d": "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "copy" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Square_pen = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      }
    ],
    [
      "path",
      {
        "d": "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "square-pen" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
function createTemplateStore() {
  const { subscribe: subscribe2, set, update } = writable({
    id: "",
    user_id: "",
    name: "",
    front_background: "",
    back_background: "",
    orientation: "landscape",
    template_elements: [],
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    org_id: ""
  });
  return {
    subscribe: subscribe2,
    set,
    update,
    select: (template) => {
      set(template);
    },
    reset: () => set({
      id: "",
      user_id: "",
      name: "",
      front_background: "",
      back_background: "",
      orientation: "landscape",
      template_elements: [],
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      org_id: ""
    })
  };
}
const templateData = createTemplateStore();
const TemplateList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { templates = [] } = $$props;
  createEventDispatcher();
  if ($$props.templates === void 0 && $$bindings.templates && templates !== void 0) $$bindings.templates(templates);
  return `<div class="h-full w-full overflow-y-auto bg-background p-6"><div class="mb-8" data-svelte-h="svelte-1h5r9op"><h2 class="text-2xl font-bold tracking-tight">Templates</h2></div> <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">${each(templates, (template) => {
    return `<div class="bg-card text-card-foreground dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative group" role="article"${add_attribute("aria-label", `Template card for ${template.name}`, 0)}><a href="${"/id-gen/use-template/" + escape(template.id, true)}" class="block w-full text-left" data-sveltekit-preload-data="hover" data-sveltekit-noscroll data-sveltekit-reload="off">${template.front_background ? `<img${add_attribute("src", template.front_background, 0)}${add_attribute("alt", template.name, 0)} class="aspect-[1.6/1] w-full object-cover">` : `<div class="aspect-[1.6/1] w-full flex items-center justify-center bg-muted dark:bg-gray-700" data-svelte-h="svelte-14ndu9n"><span class="text-muted-foreground dark:text-gray-400">No preview</span> </div>`} <div class="p-3 text-center"><h3 class="text-sm font-medium text-foreground dark:text-gray-200">${escape(template.name)}</h3> </div></a> <div class="absolute right-2 top-2 flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">${validate_component(Button, "Button").$$render(
      $$result,
      {
        variant: "ghost",
        size: "sm",
        class: "h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200",
        "aria-label": `Edit ${template.name}`
      },
      {},
      {
        default: () => {
          return `${validate_component(Square_pen, "Edit").$$render($$result, { class: "h-4 w-4" }, {}, {})} `;
        }
      }
    )} ${validate_component(Button, "Button").$$render(
      $$result,
      {
        variant: "ghost",
        size: "sm",
        class: "h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200",
        "aria-label": `Duplicate ${template.name}`
      },
      {},
      {
        default: () => {
          return `${validate_component(Copy, "Copy").$$render($$result, { class: "h-4 w-4" }, {}, {})} `;
        }
      }
    )} ${validate_component(Button, "Button").$$render(
      $$result,
      {
        variant: "ghost",
        size: "sm",
        class: "h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200",
        "aria-label": `Delete ${template.name}`
      },
      {},
      {
        default: () => {
          return `${validate_component(Trash_2, "Trash2").$$render($$result, { class: "h-4 w-4" }, {}, {})} `;
        }
      }
    )}</div> </div>`;
  })}</div></div> ${``}`;
});
const css = {
  code: ".edit-template-container.svelte-178m0vk{display:flex;width:100%;height:100%;transition:all 0.3s ease}.edit-template-container.edit-mode.svelte-178m0vk{justify-content:center}.template-form-container.svelte-178m0vk{flex:1;padding:2rem;overflow-y:auto;max-width:100%;transition:all 0.3s ease;position:relative}.template-form-container.active.svelte-178m0vk{max-width:1200px;margin:0 auto}.back-button-container.svelte-178m0vk{position:sticky;top:0;left:0;padding:1rem 0;z-index:10}.back-button.svelte-178m0vk{font-size:1.125rem;font-weight:500;transition:all 0.2s ease}.template-content.svelte-178m0vk{padding-top:1rem}.animate-pulse{animation:svelte-178m0vk-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite}@keyframes svelte-178m0vk-pulse{0%,100%{opacity:1}50%{opacity:.5}}",
  map: '{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount } from \\"svelte\\";\\nimport { supabase } from \\"$lib/supabaseClient\\";\\nimport TemplateForm from \\"$lib/TemplateForm.svelte\\";\\nimport TemplateList from \\"$lib/TemplateList.svelte\\";\\nimport { uploadImage } from \\"$lib/database\\";\\nimport { templateData } from \\"$lib/stores/templateStore\\";\\nimport { auth, session, profile } from \\"$lib/stores/auth\\";\\nexport let data;\\nlet frontBackground = null;\\nlet backBackground = null;\\nlet frontPreview = null;\\nlet backPreview = null;\\nlet errorMessage = \\"\\";\\nlet frontElements = [];\\nlet backElements = [];\\nlet isLoading = false;\\nlet isEditMode = false;\\nonMount(async () => {\\n  if (!$session) {\\n    window.location.href = \\"/login\\";\\n  }\\n});\\nasync function validateBackgrounds() {\\n  if (!frontBackground && !frontPreview || !backBackground && !backPreview) {\\n    errorMessage = \\"Both front and back backgrounds are required. Please ensure both are present.\\";\\n    return false;\\n  }\\n  if (frontBackground) {\\n    const frontValid = await validateImage(frontBackground, \\"front\\");\\n    if (!frontValid) return false;\\n  }\\n  if (backBackground) {\\n    const backValid = await validateImage(backBackground, \\"back\\");\\n    if (!backValid) return false;\\n  }\\n  return true;\\n}\\nasync function validateImage(file, side) {\\n  try {\\n    const url = URL.createObjectURL(file);\\n    const img = new Image();\\n    await new Promise((resolve, reject) => {\\n      img.onload = resolve;\\n      img.onerror = reject;\\n      img.src = url;\\n    });\\n    if (img.width !== 1013 || img.height !== 638) {\\n      errorMessage = `${side.charAt(0).toUpperCase() + side.slice(1)} background must be exactly 1013x638 pixels.`;\\n      return false;\\n    }\\n    return true;\\n  } catch {\\n    errorMessage = `Error validating ${side} background image. Please try again.`;\\n    return false;\\n  }\\n}\\nasync function saveTemplate() {\\n  console.log(\\"\\\\u{1F4DD} Starting template save...\\", {\\n    frontElementsCount: frontElements.length,\\n    backElementsCount: backElements.length,\\n    authStatus: {\\n      hasSession: !!$session,\\n      hasUser: !!$profile,\\n      userId: $profile?.id\\n    }\\n  });\\n  if (!$session || !$profile) {\\n    console.error(\\"\\\\u274C Auth check failed:\\", { session: !!$session, user: !!$profile });\\n    errorMessage = \\"User is not authenticated.\\";\\n    return;\\n  }\\n  if (!await validateBackgrounds()) {\\n    console.error(\\"\\\\u274C Background validation failed\\");\\n    return;\\n  }\\n  try {\\n    let frontUrl = frontPreview;\\n    let backUrl = backPreview;\\n    console.log(\\"\\\\u{1F5BC}\\\\uFE0F Processing backgrounds:\\", {\\n      hasFrontBackground: !!frontBackground,\\n      hasBackBackground: !!backBackground,\\n      currentFrontUrl: frontUrl,\\n      currentBackUrl: backUrl\\n    });\\n    if (frontBackground) {\\n      frontUrl = await uploadImage(frontBackground, \\"front\\", $profile.id);\\n      console.log(\\"\\\\u2705 Front background uploaded:\\", frontUrl);\\n    }\\n    if (backBackground) {\\n      backUrl = await uploadImage(backBackground, \\"back\\", $profile.id);\\n      console.log(\\"\\\\u2705 Back background uploaded:\\", backUrl);\\n    }\\n    const templateDataToSave = {\\n      id: $templateData.id || crypto.randomUUID(),\\n      user_id: $profile?.id ?? \\"\\",\\n      name: $templateData.name,\\n      front_background: $templateData.front_background,\\n      back_background: $templateData.back_background,\\n      orientation: $templateData.orientation,\\n      template_elements: $templateData.template_elements,\\n      created_at: $templateData.created_at || (/* @__PURE__ */ new Date()).toISOString(),\\n      org_id: $profile?.org_id ?? \\"\\"\\n    };\\n    console.log(\\"\\\\u{1F4CB} Template data to save:\\", {\\n      id: templateDataToSave.id,\\n      name: templateDataToSave.name,\\n      userId: templateDataToSave.user_id,\\n      elementsCount: templateDataToSave.template_elements.length,\\n      frontElements: frontElements.map((el) => ({ type: el.type, name: el.variableName })),\\n      backElements: backElements.map((el) => ({ type: el.type, name: el.variableName }))\\n    });\\n    if (templateDataToSave.template_elements.length === 0) {\\n      console.error(\\"\\\\u274C No template elements found\\");\\n      throw new Error(\\"No template elements provided\\");\\n    }\\n    console.log(\\"\\\\u{1F4BE} Saving to database...\\");\\n    const formData = new FormData();\\n    formData.append(\\"templateData\\", JSON.stringify(templateDataToSave));\\n    const response = await fetch(\\"?/create\\", {\\n      method: \\"POST\\",\\n      body: formData\\n    });\\n    const result = await response.json();\\n    if (!response.ok) {\\n      console.error(\\"\\\\u274C Server action failed:\\", result);\\n      throw new Error(result.message || \\"Failed to save template\\");\\n    }\\n    console.log(\\"\\\\u2705 Template saved successfully:\\", {\\n      savedData: result.data\\n    });\\n    alert(\\"Template saved successfully!\\");\\n    window.location.reload();\\n  } catch (error) {\\n    console.error(\\"\\\\u274C Error saving template:\\", error);\\n    errorMessage = `Error saving template: ${error instanceof Error ? error.message : JSON.stringify(error)}`;\\n  }\\n}\\nasync function handleImageUpload(event) {\\n  const { event: fileEvent, side } = event.detail;\\n  const input = fileEvent.target;\\n  if (!input.files || input.files.length === 0) return;\\n  const file = input.files[0];\\n  if (!file.type.startsWith(\\"image/\\")) {\\n    errorMessage = \\"Please upload an image file.\\";\\n    return;\\n  }\\n  const isValid = await validateImage(file, side);\\n  if (!isValid) return;\\n  if (side === \\"front\\") {\\n    frontBackground = file;\\n    frontPreview = URL.createObjectURL(file);\\n  } else {\\n    backBackground = file;\\n    backPreview = URL.createObjectURL(file);\\n  }\\n  errorMessage = \\"\\";\\n}\\nfunction removeImage(event) {\\n  const { side } = event.detail;\\n  if (side === \\"front\\") {\\n    frontBackground = null;\\n    frontPreview = null;\\n    frontElements = [];\\n  } else {\\n    backBackground = null;\\n    backPreview = null;\\n    backElements = [];\\n  }\\n}\\nfunction updateElements(event) {\\n  const { elements, side } = event.detail;\\n  if (side === \\"front\\") {\\n    frontElements = elements;\\n  } else {\\n    backElements = elements;\\n  }\\n  templateData.update((data2) => ({\\n    ...data2,\\n    template_elements: [...frontElements, ...backElements]\\n  }));\\n}\\nasync function handleTemplateSelect(event) {\\n  const templateId = event.detail.id;\\n  console.log(\\"\\\\u{1F504} EditTemplate: Template select event received:\\", event.detail);\\n  isEditMode = true;\\n  isLoading = true;\\n  try {\\n    const response = await fetch(`/api/templates/${templateId}`, {\\n      method: \\"GET\\",\\n      headers: {\\n        \\"Accept\\": \\"application/json\\"\\n      },\\n      credentials: \\"include\\"\\n    });\\n    if (!response.ok) {\\n      const errorText = await response.text();\\n      console.error(\\"\\\\u274C EditTemplate: Server response:\\", errorText);\\n      throw new Error(\\"Failed to fetch template. Please try again.\\");\\n    }\\n    const data2 = await response.json();\\n    console.log(\\"\\\\u{1F4E5} EditTemplate: Template data fetched:\\", {\\n      id: data2.id,\\n      name: data2.name,\\n      elements: data2.template_elements?.length || 0,\\n      frontBackground: data2.front_background?.substring(0, 50) + \\"...\\",\\n      backBackground: data2.back_background?.substring(0, 50) + \\"...\\"\\n    });\\n    templateData.select(data2);\\n    frontBackground = null;\\n    backBackground = null;\\n    errorMessage = \\"\\";\\n  } catch (err) {\\n    const error = err;\\n    console.error(\\"\\\\u274C EditTemplate: Error:\\", error);\\n    errorMessage = error.message || \\"An unexpected error occurred. Please try again.\\";\\n    isEditMode = false;\\n  } finally {\\n    isLoading = false;\\n  }\\n}\\nfunction handleBack() {\\n  isEditMode = false;\\n  clearForm();\\n}\\nfunction clearForm() {\\n  console.log(\\"\\\\u{1F504} EditTemplate: Clearing form\\");\\n  frontBackground = null;\\n  backBackground = null;\\n  frontPreview = null;\\n  backPreview = null;\\n  frontElements = [];\\n  backElements = [];\\n  errorMessage = \\"\\";\\n  templateData.set({\\n    id: \\"\\",\\n    user_id: $profile?.id ?? \\"\\",\\n    name: \\"\\",\\n    front_background: \\"\\",\\n    back_background: \\"\\",\\n    orientation: \\"landscape\\",\\n    template_elements: [],\\n    created_at: (/* @__PURE__ */ new Date()).toISOString(),\\n    org_id: $profile?.org_id ?? \\"\\"\\n  });\\n  console.log(\\"\\\\u2705 EditTemplate: Form cleared\\");\\n}\\n$: {\\n  if ($templateData && $templateData.template_elements) {\\n    frontElements = $templateData.template_elements.filter((el) => el.side === \\"front\\");\\n    backElements = $templateData.template_elements.filter((el) => el.side === \\"back\\");\\n    frontPreview = $templateData.front_background;\\n    backPreview = $templateData.back_background;\\n    console.log(\\"\\\\u{1F4CB} EditTemplate: Elements filtered:\\", {\\n      front: {\\n        count: frontElements.length,\\n        elements: frontElements.map((e) => ({\\n          name: e.variableName,\\n          type: e.type,\\n          position: { x: e.x, y: e.y }\\n        }))\\n      },\\n      back: {\\n        count: backElements.length,\\n        elements: backElements.map((e) => ({\\n          name: e.variableName,\\n          type: e.type,\\n          position: { x: e.x, y: e.y }\\n        }))\\n      }\\n    });\\n  }\\n}\\n<\/script>\\n\\n<main class=\\"h-full\\">\\n    <div class=\\"edit-template-container {isEditMode ? \'edit-mode\' : \'\'}\\">\\n        {#if !isEditMode}\\n            <TemplateList templates={data.templates} on:select={handleTemplateSelect} />\\n        {:else}\\n            <div class=\\"template-form-container active\\">\\n                <div class=\\"back-button-container\\">\\n                    <button \\n                        on:click={handleBack}\\n                        class=\\"back-button inline-flex items-center text-lg dark:text-gray-300 text-gray-700 hover:text-primary dark:hover:text-primary-400\\"\\n                    >\\n                        <svg \\n                            xmlns=\\"http://www.w3.org/2000/svg\\" \\n                            viewBox=\\"0 0 24 24\\" \\n                            fill=\\"none\\" \\n                            stroke=\\"currentColor\\" \\n                            class=\\"w-6 h-6 mr-2\\"\\n                            stroke-width=\\"2.5\\" \\n                            stroke-linecap=\\"round\\" \\n                            stroke-linejoin=\\"round\\"\\n                        >\\n                            <path d=\\"M19 12H5M12 19l-7-7 7-7\\"/>\\n                        </svg>\\n                        Back\\n                    </button>\\n                </div>\\n\\n                <div class=\\"template-content\\">\\n                    <h1 class=\\"text-2xl font-bold mb-6\\">Edit Template</h1>\\n\\n                    {#if isLoading}\\n                        <div class=\\"animate-pulse space-y-8\\">\\n                            <!-- Skeleton for front template form -->\\n                            <div class=\\"space-y-4\\">\\n                                <div class=\\"h-8 bg-gray-200 rounded w-1/4\\"></div>\\n                                <div class=\\"h-64 bg-gray-200 rounded\\"></div>\\n                                <div class=\\"space-y-2\\">\\n                                    <div class=\\"h-4 bg-gray-200 rounded w-1/3\\"></div>\\n                                    <div class=\\"h-4 bg-gray-200 rounded w-1/4\\"></div>\\n                                </div>\\n                            </div>\\n\\n                            <!-- Skeleton for back template form -->\\n                            <div class=\\"space-y-4\\">\\n                                <div class=\\"h-8 bg-gray-200 rounded w-1/4\\"></div>\\n                                <div class=\\"h-64 bg-gray-200 rounded\\"></div>\\n                                <div class=\\"space-y-2\\">\\n                                    <div class=\\"h-4 bg-gray-200 rounded w-1/3\\"></div>\\n                                    <div class=\\"h-4 bg-gray-200 rounded w-1/4\\"></div>\\n                                </div>\\n                            </div>\\n                        </div>\\n                    {:else}\\n                        <div class=\\"template-form\\">\\n                            <TemplateForm\\n                                side=\\"front\\"\\n                                bind:elements={frontElements}\\n                                bind:preview={frontPreview}\\n                                on:imageUpload={handleImageUpload}\\n                                on:removeImage={removeImage}\\n                            />\\n                        </div>\\n                        <div class=\\"template-form\\">\\n                            <TemplateForm\\n                                side=\\"back\\"\\n                                bind:elements={backElements}\\n                                bind:preview={backPreview}\\n                                on:imageUpload={handleImageUpload}\\n                                on:removeImage={removeImage}\\n                            />\\n                        </div>\\n\\n                        {#if errorMessage}\\n                            <p class=\\"mt-4 text-sm text-red-600\\">{errorMessage}</p>\\n                        {/if}\\n\\n                        <div class=\\"mt-6 flex gap-4\\">\\n                            <button \\n                                on:click={saveTemplate}\\n                                class=\\"inline-flex justify-center rounded-md border-0 bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 dark:focus:ring-blue-400 transition-colors duration-200 dark:shadow-blue-900/30\\"\\n                            >\\n                                Save Template\\n                            </button>\\n                            <button \\n                                on:click={clearForm}\\n                                class=\\"inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2\\"\\n                            >\\n                                Clear Form\\n                            </button>\\n                        </div>\\n                    {/if}\\n                </div>\\n            </div>\\n        {/if}\\n    </div>\\n</main>\\n\\n<style>\\n    .edit-template-container {\\n        display: flex;\\n        width: 100%;\\n        height: 100%;\\n        transition: all 0.3s ease;\\n    }\\n\\n    .edit-template-container.edit-mode {\\n        justify-content: center;\\n    }\\n\\n    .template-form-container {\\n        flex: 1;\\n        padding: 2rem;\\n        overflow-y: auto;\\n        max-width: 100%;\\n        transition: all 0.3s ease;\\n        position: relative;\\n    }\\n\\n    .template-form-container.active {\\n        max-width: 1200px;\\n        margin: 0 auto;\\n    }\\n\\n    .back-button-container {\\n        position: sticky;\\n        top: 0;\\n        left: 0;\\n        padding: 1rem 0;\\n        z-index: 10;\\n    }\\n\\n    .back-button {\\n        font-size: 1.125rem;\\n        font-weight: 500;\\n        transition: all 0.2s ease;\\n    }\\n\\n    .template-content {\\n        padding-top: 1rem;\\n    }\\n\\n    :global(.animate-pulse) {\\n        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\\n    }\\n\\n    @keyframes pulse {\\n        0%, 100% {\\n            opacity: 1;\\n        }\\n        50% {\\n            opacity: .5;\\n        }\\n    }\\n</style>"],"names":[],"mappings":"AAoXI,uCAAyB,CACrB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACzB,CAEA,wBAAwB,yBAAW,CAC/B,eAAe,CAAE,MACrB,CAEA,uCAAyB,CACrB,IAAI,CAAE,CAAC,CACP,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,CAChB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IAAI,CACzB,QAAQ,CAAE,QACd,CAEA,wBAAwB,sBAAQ,CAC5B,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IACd,CAEA,qCAAuB,CACnB,QAAQ,CAAE,MAAM,CAChB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,OAAO,CAAE,IAAI,CAAC,CAAC,CACf,OAAO,CAAE,EACb,CAEA,2BAAa,CACT,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,GAAG,CAChB,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACzB,CAEA,gCAAkB,CACd,WAAW,CAAE,IACjB,CAEQ,cAAgB,CACpB,SAAS,CAAE,oBAAK,CAAC,EAAE,CAAC,aAAa,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,QACrD,CAEA,WAAW,oBAAM,CACb,EAAE,CAAE,IAAK,CACL,OAAO,CAAE,CACb,CACA,GAAI,CACA,OAAO,CAAE,EACb,CACJ"}'
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $templateData, $$unsubscribe_templateData;
  let $$unsubscribe_profile;
  let $$unsubscribe_session;
  $$unsubscribe_templateData = subscribe(templateData, (value) => $templateData = value);
  $$unsubscribe_profile = subscribe(profile, (value) => value);
  $$unsubscribe_session = subscribe(session, (value) => value);
  let { data } = $$props;
  let frontElements = [];
  let backElements = [];
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
        if ($templateData && $templateData.template_elements) {
          frontElements = $templateData.template_elements.filter((el) => el.side === "front");
          backElements = $templateData.template_elements.filter((el) => el.side === "back");
          $templateData.front_background;
          $templateData.back_background;
          console.log("📋 EditTemplate: Elements filtered:", {
            front: {
              count: frontElements.length,
              elements: frontElements.map((e) => ({
                name: e.variableName,
                type: e.type,
                position: { x: e.x, y: e.y }
              }))
            },
            back: {
              count: backElements.length,
              elements: backElements.map((e) => ({
                name: e.variableName,
                type: e.type,
                position: { x: e.x, y: e.y }
              }))
            }
          });
        }
      }
    }
    $$rendered = `<main class="h-full"><div class="${"edit-template-container " + escape("", true) + " svelte-178m0vk"}">${`${validate_component(TemplateList, "TemplateList").$$render($$result, { templates: data.templates }, {}, {})}`}</div> </main>`;
  } while (!$$settled);
  $$unsubscribe_templateData();
  $$unsubscribe_profile();
  $$unsubscribe_session();
  return $$rendered;
});
export {
  Page as default
};
