<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';
    import type { CartItem } from '$lib/types/constrack';
    
    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    
    let subtotal = $derived(data.cartItems.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0));
    let deliveryFee = $derived(150); // Fixed delivery fee
    let total = $derived(subtotal + deliveryFee);
</script>

<div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex justify-between items-center">
                <a href="/constrack" class="text-3xl font-bold hover:text-blue-200">
                    Constrack Hardware
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
        <h2 class="text-2xl font-bold mb-6">Shopping Cart</h2>

        {#if data.cartItems.length === 0}
            <div class="bg-white rounded-lg shadow-md p-6 text-center">
                <p class="text-gray-600">Your cart is empty</p>
                <a href="/constrack" class="text-blue-600 hover:underline mt-4 inline-block">
                    Continue Shopping
                </a>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Cart Items -->
                <div class="md:col-span-2">
                    {#each data.cartItems as item}
                        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                            <div class="flex items-center">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    class="w-24 h-24 object-cover rounded"
                                />
                                <div class="ml-4 flex-1">
                                    <h3 class="text-lg font-semibold">{item.name}</h3>
                                    <p class="text-gray-600">{item.category}</p>
                                    <p class="text-blue-600 font-bold">₱{item.price.toFixed(2)}</p>
                                </div>
                                <div class="flex items-center">
                                    <form
                                        action="?/updateQuantity"
                                        method="POST"
                                        use:enhance
                                        class="flex items-center"
                                    >
                                        <input type="hidden" name="productId" value={item.id} />
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={item.quantity}
                                            min="1"
                                            class="w-16 p-2 border rounded-lg text-center"
                                        />
                                    </form>
                                    <form
                                        action="?/removeItem"
                                        method="POST"
                                        use:enhance
                                        class="ml-4"
                                    >
                                        <input type="hidden" name="productId" value={item.id} />
                                        <button
                                            type="submit"
                                            class="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>

                <!-- Order Summary -->
                <div class="bg-white rounded-lg shadow-md p-6 h-fit">
                    <h3 class="text-xl font-semibold mb-4">Order Summary</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Subtotal</span>
                            <span>₱{subtotal.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Delivery Fee</span>
                            <span>₱{deliveryFee.toFixed(2)}</span>
                        </div>
                        <div class="border-t pt-2 mt-2">
                            <div class="flex justify-between font-bold">
                                <span>Total</span>
                                <span>₱{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <form
                        action="?/checkout"
                        method="POST"
                        use:enhance
                        class="mt-6"
                    >
                        <button
                            type="submit"
                            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Proceed to Checkout
                        </button>
                    </form>
                </div>
            </div>
        {/if}
    </main>
</div>
