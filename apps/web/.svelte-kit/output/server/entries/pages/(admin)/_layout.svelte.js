import { c as create_ssr_component, s as subscribe } from "../../../chunks/ssr.js";
import { p as page } from "../../../chunks/stores.js";
import "../../../chunks/client.js";
const css = {
  code: ".admin-layout.svelte-nwqf3g{width:100%;min-height:100vh;display:flex;flex-direction:column}body{background:white}",
  map: '{"version":3,"file":"+layout.svelte","sources":["+layout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { page } from \\"$app/stores\\";\\nimport { onMount } from \\"svelte\\";\\nimport { goto } from \\"$app/navigation\\";\\n$: console.log(\\"[Admin Layout]\\", {\\n  path: $page.url.pathname,\\n  data: $page.data\\n});\\nonMount(() => {\\n  if (!$page.url.pathname.startsWith(\\"/midcodes\\")) {\\n    goto(\\"/midcodes\\");\\n  }\\n});\\n<\/script>\\n\\n<div class=\\"admin-layout\\">\\n    <slot />\\n</div>\\n\\n<style>\\n    .admin-layout {\\n        width: 100%;\\n        min-height: 100vh;\\n        display: flex;\\n        flex-direction: column;\\n    }\\n\\n    :global(body) {\\n        background: white;\\n    }\\n</style>\\n"],"names":[],"mappings":"AAmBI,2BAAc,CACV,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MACpB,CAEQ,IAAM,CACV,UAAU,CAAE,KAChB"}'
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$result.css.add(css);
  {
    console.log("[Admin Layout]", {
      path: $page.url.pathname,
      data: $page.data
    });
  }
  $$unsubscribe_page();
  return `<div class="admin-layout svelte-nwqf3g">${slots.default ? slots.default({}) : ``} </div>`;
});
export {
  Layout as default
};
