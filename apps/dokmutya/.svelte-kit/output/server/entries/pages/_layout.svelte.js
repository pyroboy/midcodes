import { c as pop, d as stringify, p as push } from "../../chunks/index.js";
import { b as base } from "../../chunks/paths.js";
import { a as attr } from "../../chunks/attributes.js";
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  $$payload.out += `<nav${attr("class", `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${stringify("bg-gradient-to-b from-[#32949199] to-transparent")} svelte-1n06o81`)}><div class="container mx-auto px-4 svelte-1n06o81"><div class="flex items-center justify-between h-20 svelte-1n06o81"><a${attr("href", `${stringify(base)}/`)} class="flex items-center svelte-1n06o81"><img src="https://ucarecdn.com/58c1e01e-1959-4f3a-bd04-00aed947f020/-/preview/200x200/" alt="Logo" class="h-12 md:h-24 w-auto beating-heart object-cover -mb-2 md:-mb-10 svelte-1n06o81"></a> <button${attr("class", `md:hidden p-2 ${stringify("text-white")} svelte-1n06o81`)} aria-label="Toggle menu"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 svelte-1n06o81" fill="none" viewBox="0 0 24 24" stroke="currentColor">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" class="svelte-1n06o81"></path>`;
  }
  $$payload.out += `<!--]--></svg></button> <ul class="hidden md:flex space-x-8 svelte-1n06o81"><li class="svelte-1n06o81"><a${attr("href", `${stringify(base)}/about`)}${attr("class", `transition-colors ${stringify("text-white/90 hover:text-white")} svelte-1n06o81`)}>About</a></li> <li class="svelte-1n06o81"><a${attr("href", `${stringify(base)}/cv`)}${attr("class", `transition-colors ${stringify("text-white/90 hover:text-white")} svelte-1n06o81`)}>Priorities</a></li> <li class="svelte-1n06o81"><a${attr("href", `${stringify(base)}/#events`)}${attr("class", `transition-colors ${stringify("text-white/90 hover:text-white")} svelte-1n06o81`)}>Events</a></li> <li class="svelte-1n06o81"><a${attr("href", `${stringify(base)}/#contact`)}${attr("class", `transition-colors ${stringify("text-white/90 hover:text-white")} svelte-1n06o81`)}>Contact</a></li></ul></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></nav> `;
  children($$payload);
  $$payload.out += `<!---->`;
  pop();
}
export {
  _layout as default
};
