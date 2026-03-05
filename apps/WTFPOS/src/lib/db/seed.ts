import type { RxDatabase } from 'rxdb';
import { INITIAL_TABLES as sourceTables, INITIAL_MENU_ITEMS as sourceMenu } from '$lib/stores/pos.svelte';
import { 
    INITIAL_STOCK_ITEMS, 
    INITIAL_DELIVERIES, 
    INITIAL_WASTE_ENTRIES,
    INITIAL_STOCK_COUNTS
} from '$lib/stores/stock.svelte';
import { expenseCategories } from '$lib/stores/expenses.svelte';
import { nanoid } from 'nanoid';

/**
 * Automatically seeds the database with mock data if it determines
 * the current collections are empty (first time load).
 */
export async function seedDatabaseIfNeeded(db: RxDatabase) {
    // Check if the menu items or tables collection is empty
    const existingMenu = await db.menu_items.find().exec();
    const existingTables = await db.tables.find().exec();
    
    if (existingMenu.length === 0 || existingTables.length === 0) {
        console.log('[RxDB] Database is empty or missing tables. Seeding initial mock data...');
        
        // 1. Seed Menu Items if empty
        if (existingMenu.length === 0) {
            await db.menu_items.bulkInsert(JSON.parse(JSON.stringify(sourceMenu)));
        }
        
        // 2. Seed Tables if empty
        if (existingTables.length === 0) {
            await db.tables.bulkInsert(JSON.parse(JSON.stringify(sourceTables)));
        }
        
        // 3. Seed other collections if menu was empty (assume full seed needed)
        if (existingMenu.length === 0) {
            const mappedStockItems = INITIAL_STOCK_ITEMS.map(s => ({
                ...s,
                proteinType: s.proteinType || '' // Fallback empty string if undefined for schema
            }));
            await db.stock_items.bulkInsert(JSON.parse(JSON.stringify(mappedStockItems)));
            await db.stock_counts.bulkInsert(JSON.parse(JSON.stringify(INITIAL_STOCK_COUNTS)));
            await db.deliveries.bulkInsert(JSON.parse(JSON.stringify(INITIAL_DELIVERIES)));
            await db.waste.bulkInsert(JSON.parse(JSON.stringify(INITIAL_WASTE_ENTRIES)));

            await db.expenses.bulkInsert([
                {
                    id: nanoid(),
                    category: 'Meat Procurement',
                    amount: 8500,
                    description: 'Pork belly delivery',
                    paidBy: 'Petty Cash',
                    locationId: 'qc',
                    createdBy: 'Manager',
                    createdAt: new Date().toISOString()
                },
                {
                    id: nanoid(),
                    category: 'Produce & Sides',
                    amount: 1250,
                    description: 'Morning market run for lettuce',
                    paidBy: 'Petty Cash',
                    locationId: 'mkti',
                    createdBy: 'Manager',
                    createdAt: new Date().toISOString()
                }
            ]);
        }

        console.log('[RxDB] Seeding complete! Database is ready.');
    } else {
        console.log(`[RxDB] Database has ${existingMenu.length} menu items and ${existingTables.length} tables. Seeding skipped.`);
    }
}
