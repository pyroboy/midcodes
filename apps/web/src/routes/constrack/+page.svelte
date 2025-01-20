<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';
    
    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    
    let searchQuery = $state('');
    let selectedCategory = $state('all');
    
    let filteredProducts = $derived(data.products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }));
</script>

<div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex justify-between items-center">
                <h1 class="text-3xl font-bold">Constrack Hardware</h1>
                <div class="flex items-center space-x-4">
                    <a href="/constrack/cart" class="hover:text-blue-200">
                        <span class="material-icons">shopping_cart</span>
                        {#if data.cartCount}
                            <span class="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                                {data.cartCount}
                            </span>
                        {/if}
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
        <!-- Search and Filter -->
        <div class="mb-8 flex flex-col md:flex-row gap-4">
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search products..."
                class="flex-1 p-2 border rounded-lg"
            />
            <select
                bind:value={selectedCategory}
                class="p-2 border rounded-lg"
            >
                <option value="all">All Categories</option>
                {#each data.categories as category}
                    <option value={category}>{category}</option>
                {/each}
            </select>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {#each filteredProducts as product}
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        class="w-full h-48 object-cover"
                    />
                    <div class="p-4">
                        <h3 class="text-lg font-semibold">{product.name}</h3>
                        <p class="text-gray-600">{product.category}</p>
                        <p class="text-blue-600 font-bold mt-2">₱{product.price.toFixed(2)}</p>
                        <form
                            action="?/addToCart"
                            method="POST"
                            use:enhance
                            class="mt-4"
                        >
                            <input type="hidden" name="productId" value={product.id} />
                            <button
                                type="submit"
                                class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add to Cart
                            </button>
                        </form>
                    </div>
                </div>
            {/each}
        </div>
    </main>
</div>

<style>
    /* Add any custom styles here */
</style>
