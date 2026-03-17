import { createSupabaseClient } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { error as svelteKitError } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    console.log('🏠 [SERVER] Inventory page server load started');

    if (!locals.user) {
        console.log('🚫 [SERVER] No authenticated user found');
        // Returning an empty state is fine for now
        return { products: null, purchaseOrders: null };
    }

    console.log('👤 [SERVER] Authenticated user:', locals.user.id);
    const supabase = createSupabaseClient();
    const limit = 50;

    // Your original debug query and log are retained here
    console.log('🔍 [SERVER] Starting Supabase debug query for any products...');
    const { data: allProducts, error: allError, count: allCount } = await supabase
        .from('products')
        .select('id, name, is_active, is_archived', { count: 'exact' })
        .limit(5);

    console.log('🔍 [SERVER] All products check:', {
        allProductsCount: allProducts?.length || 0,
        totalInDb: allCount,
        first5Products: allProducts?.map(p => ({ id: p.id, name: p.name, is_active: p.is_active, is_archived: p.is_archived })),
        allError: allError?.message
    });

    // 1. Fetch active products
    console.log('🔍 [SERVER] Starting Supabase query for active products...');
    const { data: products, error: productsError, count: productsCount } = await supabase
        .from('products')
        .select(
            `
            *,
            category:categories(id, name),
            supplier:suppliers(id, name)
            `,
            { count: 'exact' }
        )
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('name', { ascending: true })
        .limit(limit);

    console.log('📊 [SERVER] Supabase products query results:', {
        productsCount: products?.length || 0,
        totalCount: productsCount,
        hasError: !!productsError,
        errorMessage: productsError?.message
    });

    if (productsError) {
        console.error('🚨 [SERVER] Error loading products:', productsError);
        throw svelteKitError(500, 'Could not load products.');
    }

    // 2. Fetch relevant purchase orders
    console.log('📦 [SERVER] Loading purchase orders for receiving...');
    const { data: purchaseOrders, error: poError, count: poCount } = await supabase
        .from('purchase_orders')
        .select(`*, supplier:suppliers(id, name)`, { count: 'exact' }) // Fixed pagination
        .in('status', ['partially_received', 'received', 'draft'])
        .order('order_date', { ascending: false })
        .limit(limit);

    if (poError) {
        console.error('❌ [SERVER] Purchase orders load error:', poError);
        throw svelteKitError(500, 'Could not load purchase orders.');
    }
    
    console.log('📦 [SERVER] Purchase orders loaded:', purchaseOrders?.length || 0);

    const finalResult = {
        products: {
            products: products || [],
            pagination: {
                page: 1,
                limit: limit,
                total: productsCount || 0,
                totalPages: Math.ceil((productsCount || 0) / limit),
                hasMore: (productsCount || 0) > limit
            }
        },
        purchaseOrders: {
            purchase_orders: purchaseOrders || [],
            pagination: {
                page: 1,
                limit: limit,
                total: poCount || 0,
                totalPages: Math.ceil((poCount || 0) / limit),
                hasMore: (poCount || 0) > limit
            }
        }
    };
    
    console.log('🎯 [SERVER] Final result prepared:', {
        productsCount: finalResult.products.products.length,
        productsTotal: finalResult.products.pagination.total,
        poCount: finalResult.purchaseOrders.purchase_orders.length,
        poTotal: finalResult.purchaseOrders.pagination.total
    });

    return finalResult;
};