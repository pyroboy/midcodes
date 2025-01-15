import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Product } from '$lib/types/constrack';

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

const categories = ['Power Tools', 'Hand Tools', 'Painting', 'Building Materials'];

export const load: PageServerLoad = async ({ locals, cookies }) => {
    // Get cart from cookies
    const cart = cookies.get('cart') ? JSON.parse(cookies.get('cart')!) : [];
    
    return {
        products: mockProducts,
        categories,
        cartCount: cart.length
    };
};

export const actions: Actions = {
    addToCart: async ({ request, cookies }) => {
        const data = await request.formData();
        const productId = data.get('productId');

        if (!productId) {
            throw error(400, 'Product ID is required');
        }

        // Get existing cart or initialize empty array
        const cart = cookies.get('cart') ? JSON.parse(cookies.get('cart')!) : [];
        
        // Add product to cart
        cart.push(productId);
        
        // Save cart back to cookies
        cookies.set('cart', JSON.stringify(cart), {
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return { success: true };
    }
};
