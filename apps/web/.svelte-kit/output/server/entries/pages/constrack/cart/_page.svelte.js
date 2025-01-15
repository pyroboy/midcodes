import { c as create_ssr_component, b as each, e as escape, a as add_attribute } from "../../../../chunks/ssr.js";
import "../../../../chunks/client.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let subtotal;
  let deliveryFee;
  let total;
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  subtotal = data.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  deliveryFee = 150;
  total = subtotal + deliveryFee;
  return `<div class="min-h-screen bg-gray-100"> <header class="bg-blue-600 text-white shadow-lg" data-svelte-h="svelte-1du77m0"><div class="container mx-auto px-4 py-6"><div class="flex justify-between items-center"><a href="/constrack" class="text-3xl font-bold hover:text-blue-200">Constrack Hardware</a></div></div></header>  <main class="container mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6" data-svelte-h="svelte-1lxid6q">Shopping Cart</h2> ${data.cartItems.length === 0 ? `<div class="bg-white rounded-lg shadow-md p-6 text-center" data-svelte-h="svelte-1hwdbt3"><p class="text-gray-600">Your cart is empty</p> <a href="/constrack" class="text-blue-600 hover:underline mt-4 inline-block">Continue Shopping</a></div>` : `<div class="grid grid-cols-1 md:grid-cols-3 gap-6"> <div class="md:col-span-2">${each(data.cartItems, (item) => {
    return `<div class="bg-white rounded-lg shadow-md p-4 mb-4"><div class="flex items-center"><img${add_attribute("src", item.image, 0)}${add_attribute("alt", item.name, 0)} class="w-24 h-24 object-cover rounded"> <div class="ml-4 flex-1"><h3 class="text-lg font-semibold">${escape(item.name)}</h3> <p class="text-gray-600">${escape(item.category)}</p> <p class="text-blue-600 font-bold">₱${escape(item.price.toFixed(2))}</p></div> <div class="flex items-center"><form action="?/updateQuantity" method="POST" class="flex items-center"><input type="hidden" name="productId"${add_attribute("value", item.id, 0)}> <input type="number" name="quantity"${add_attribute("value", item.quantity, 0)} min="1" class="w-16 p-2 border rounded-lg text-center"></form> <form action="?/removeItem" method="POST" class="ml-4"><input type="hidden" name="productId"${add_attribute("value", item.id, 0)}> <button type="submit" class="text-red-600 hover:text-red-800" data-svelte-h="svelte-1lktzoo">Remove
                                        </button></form> </div></div> </div>`;
  })}</div>  <div class="bg-white rounded-lg shadow-md p-6 h-fit"><h3 class="text-xl font-semibold mb-4" data-svelte-h="svelte-1jx6zae">Order Summary</h3> <div class="space-y-2"><div class="flex justify-between"><span data-svelte-h="svelte-3vhy5m">Subtotal</span> <span>₱${escape(subtotal.toFixed(2))}</span></div> <div class="flex justify-between"><span data-svelte-h="svelte-1lhj50u">Delivery Fee</span> <span>₱${escape(deliveryFee.toFixed(2))}</span></div> <div class="border-t pt-2 mt-2"><div class="flex justify-between font-bold"><span data-svelte-h="svelte-2fqrek">Total</span> <span>₱${escape(total.toFixed(2))}</span></div></div></div> <form action="?/checkout" method="POST" class="mt-6" data-svelte-h="svelte-17p8eu8"><button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">Proceed to Checkout</button></form></div></div>`}</main></div>`;
});
export {
  Page as default
};
