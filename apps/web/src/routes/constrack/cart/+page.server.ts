import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Product, CartItem } from '$lib/types/constrack';

// Mock data - Replace with actual database queries
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Power Drill',
        category: 'Power Tools',
        price: 2999.99,
        image: 'https://placehold.co/300x200?text=Power+Drill'
    },
    {
        id: '2',
        name: 'Hammer',
        category: 'Hand Tools',
        price: 299.99,
        image: 'https://placehold.co/300x200?text=Hammer'
    },
    {
        id: '3',
        name: 'Paint Brush Set',
        category: 'Painting',
        price: 499.99,
        image: 'https://placehold.co/300x200?text=Paint+Brush+Set'
    },
    {
        id: '4',
        name: 'Cement (40kg)',
        category: 'Building Materials',
        price: 259.99,
        image: 'https://placehold.co/300x200?text=Cement'
    }
];

export const load: PageServerLoad = async ({ cookies }) => {
    // Get cart from cookies
    const cart = cookies.get('cart') ? JSON.parse(cookies.get('cart')!) : [];
    
    // Get cart items with quantities
    const cartItems: CartItem[] = cart.reduce((items: CartItem[], productId: string) => {
        const product = mockProducts.find(p => p.id === productId);
        if (product) {
            const existingItem = items.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                items.push({ ...product, quantity: 1 });
            }
        }
        return items;
    }, []);
    
    return {
        cartItems
    };
};

export const actions: Actions = {
    updateQuantity: async ({ request, cookies }) => {
        const data = await request.formData();
        const productId = data.get('productId');
        const quantity = parseInt(data.get('quantity') as string);

        if (!productId || !quantity) {
            throw error(400, 'Product ID and quantity are required');
        }

        // Get existing cart
        const cart = cookies.get('cart') ? JSON.parse(cookies.get('cart')!) : [];
        
        // Update cart with new quantity
        const newCart = [];
        for (let i = 0; i < quantity; i++) {
            newCart.push(productId);
        }
        
        // Save cart back to cookies
        cookies.set('cart', JSON.stringify(newCart), {
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return { success: true };
    },

    removeItem: async ({ request, cookies }) => {
        const data = await request.formData();
        const productId = data.get('productId');

        if (!productId) {
            throw error(400, 'Product ID is required');
        }

        // Get existing cart
        const cart = cookies.get('cart') ? JSON.parse(cookies.get('cart')!) : [];
        
        // Remove all instances of the product
        const newCart = cart.filter((id: string) => id !== productId);
        
        // Save cart back to cookies
        cookies.set('cart', JSON.stringify(newCart), {
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return { success: true };
    },

    checkout: async ({ cookies }) => {
        // Clear cart after checkout
        cookies.delete('cart', { path: '/' });
        
        // Redirect to a success page (you'll need to create this)
        throw redirect(303, '/constrack/checkout/success');
    }
};
