import { c as create_ssr_component, e as escape, a as add_attribute, b as each } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let filteredProducts;
  let { data } = $$props;
  let searchQuery = "";
  let selectedCategory = "all";
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  filteredProducts = data.products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all";
    return matchesSearch && matchesCategory;
  });
  return `<div class="min-h-screen bg-gray-100"> <header class="bg-blue-600 text-white shadow-lg"><div class="container mx-auto px-4 py-6"><div class="flex justify-between items-center"><h1 class="text-3xl font-bold" data-svelte-h="svelte-1ldc911">Constrack Hardware</h1> <div class="flex items-center space-x-4"><a href="/constrack/cart" class="hover:text-blue-200"><span class="material-icons" data-svelte-h="svelte-hj2ajs">shopping_cart</span> ${data.cartCount ? `<span class="bg-red-500 text-white rounded-full px-2 py-1 text-xs">${escape(data.cartCount)}</span>` : ``}</a></div></div></div></header>  <main class="container mx-auto px-4 py-8"> <div class="mb-8 flex flex-col md:flex-row gap-4"><input type="text" placeholder="Search products..." class="flex-1 p-2 border rounded-lg"${add_attribute("value", searchQuery, 0)}> <select class="p-2 border rounded-lg"><option value="all" data-svelte-h="svelte-16sr5ty">All Categories</option>${each(data.categories, (category) => {
    return `<option${add_attribute("value", category, 0)}>${escape(category)}</option>`;
  })}</select></div>  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">${each(filteredProducts, (product) => {
    return `<div class="bg-white rounded-lg shadow-md overflow-hidden"><img${add_attribute("src", product.image, 0)}${add_attribute("alt", product.name, 0)} class="w-full h-48 object-cover"> <div class="p-4"><h3 class="text-lg font-semibold">${escape(product.name)}</h3> <p class="text-gray-600">${escape(product.category)}</p> <p class="text-blue-600 font-bold mt-2">₱${escape(product.price.toFixed(2))}</p> <form action="?/addToCart" method="POST" class="mt-4"><input type="hidden" name="productId"${add_attribute("value", product.id, 0)}> <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors" data-svelte-h="svelte-16gws0u">Add to Cart</button> </form></div> </div>`;
  })}</div></main> </div>`;
});
export {
  Page as default
};
