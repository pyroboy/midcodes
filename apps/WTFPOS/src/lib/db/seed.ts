import type { RxDatabase } from 'rxdb';
import { INITIAL_TABLES as sourceTables, INITIAL_MENU_ITEMS as sourceMenu } from '$lib/stores/pos.svelte';
import { 
    INITIAL_STOCK_ITEMS, 
    INITIAL_DELIVERIES, 
    INITIAL_STOCK_EVENTS,
    INITIAL_ADJUSTMENT_EVENTS,
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
        
        // 2. Seed Tables (with pre-assigned orders for UX audits)
        if (existingTables.length === 0) {
            // Apply currentOrderId to the seeded tables so they show as occupied
            const tablesWithOrders = JSON.parse(JSON.stringify(sourceTables));
            const t1 = tablesWithOrders.find((t: any) => t.id === 't1');
            const t2 = tablesWithOrders.find((t: any) => t.id === 't2');
            const t3 = tablesWithOrders.find((t: any) => t.id === 't3');
            
            if (t1) { t1.status = 'occupied'; t1.currentOrderId = 'order-t1-mock'; t1.sessionStartedAt = new Date(Date.now() - 45 * 60000).toISOString(); }
            if (t2) { t2.status = 'occupied'; t2.currentOrderId = 'order-t2-mock'; t2.sessionStartedAt = new Date(Date.now() - 15 * 60000).toISOString(); }
            if (t3) { t3.status = 'occupied'; t3.currentOrderId = 'order-t3-mock'; t3.sessionStartedAt = new Date(Date.now() - 5 * 60000).toISOString(); }
            
            await db.tables.bulkInsert(tablesWithOrders);
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
            await db.stock_events.bulkInsert(JSON.parse(JSON.stringify([...INITIAL_STOCK_EVENTS, ...INITIAL_ADJUSTMENT_EVENTS])));
            
            // 3.5 Seed active Mock Orders for UX Audits
            const now = new Date().toISOString();
            const mockOrders = [
                // T1: 4 pax, Unli Pork & Beef
                {
                    id: 'order-t1-mock', locationId: 'tag', orderType: 'dine-in', tableId: 't1', tableNumber: 1,
                    packageName: 'Beef + Pork Unlimited', packageId: 'pkg-combo',
                    pax: 4, items: [], status: 'open', discountType: 'none',
                    subtotal: 1996, discountAmount: 0, vatAmount: 0, total: 1996, payments: [],
                    createdAt: new Date(Date.now() - 45 * 60000).toISOString(), closedAt: null, billPrinted: false, updatedAt: now
                },
                // T2: 2 pax, Unli Beef, plus an attached active takeout
                {
                    id: 'order-t2-mock', locationId: 'tag', orderType: 'dine-in', tableId: 't2', tableNumber: 2,
                    packageName: 'Beef Unlimited', packageId: 'pkg-beef',
                    pax: 2, items: [], status: 'open', discountType: 'none',
                    subtotal: 1198, discountAmount: 0, vatAmount: 0, total: 1198, payments: [],
                    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), closedAt: null, billPrinted: false, updatedAt: now
                },
                // Attached takeout for T2
                {
                    id: 'takeout-t2-mock', locationId: 'tag', orderType: 'takeout', tableId: null, tableNumber: null,
                    customerName: 'T2 Takeout Add-on', packageName: null, packageId: null,
                    pax: 1, items: [], status: 'open', takeoutStatus: 'preparing', discountType: 'none',
                    subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0, payments: [],
                    createdAt: new Date(Date.now() - 10 * 60000).toISOString(), closedAt: null, billPrinted: false, updatedAt: now
                },
                // T3: 3 adults, 1 child, 1 free (5 total pax), Unli Pork
                {
                    id: 'order-t3-mock', locationId: 'tag', orderType: 'dine-in', tableId: 't3', tableNumber: 3,
                    packageName: 'Pork Unlimited', packageId: 'pkg-pork',
                    pax: 5, childPax: 1, freePax: 1, originalPax: 5, items: [], status: 'open', discountType: 'none',
                    subtotal: 1547, discountAmount: 0, vatAmount: 0, total: 1547, payments: [],
                    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), closedAt: null, billPrinted: false, updatedAt: now
                }
            ];
            await db.orders.bulkInsert(mockOrders as any);


            // 4. Seed Historical Data (1 week)
            try {
                const { seedHistory } = await import('./seed-history');
                await seedHistory(db);
            } catch (historyErr) {
                console.error('[RxDB] Failed to seed history:', historyErr);
            }

            await db.expenses.bulkInsert([

                {
                    id: nanoid(),
                    category: 'Meat Procurement',
                    amount: 8500,
                    description: 'Pork belly delivery',
                    paidBy: 'Petty Cash',
                    locationId: 'tag',
                    createdBy: 'Manager',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: nanoid(),
                    category: 'Produce & Sides',
                    amount: 1250,
                    description: 'Morning market run for lettuce',
                    paidBy: 'Petty Cash',
                    locationId: 'pgl',
                    createdBy: 'Manager',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]);

            // 5. Seed Audit Log with demo entries
            const auditNow = Date.now();
            const auditTs = (minutesAgo: number) => new Date(auditNow - minutesAgo * 60 * 1000).toISOString();
            const auditFmt = (minutesAgo: number) => new Date(auditNow - minutesAgo * 60 * 1000)
                .toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

            await db.audit_logs.bulkInsert([
                { id: 'l-1',  isoTimestamp: auditTs(5),   timestamp: auditFmt(5),   user: 'Maria Santos',   role: 'staff',   action: 'order',   description: 'Added 250g Pork Sliced to T3',                 branch: 'TAG', updatedAt: auditTs(5) },
                { id: 'l-2',  isoTimestamp: auditTs(8),   timestamp: auditFmt(8),   user: 'Juan Reyes',     role: 'manager', action: 'payment', description: 'Applied Senior Citizen discount on T2 (20%)',  branch: 'TAG', updatedAt: auditTs(8) },
                { id: 'l-3',  isoTimestamp: auditTs(15),  timestamp: auditFmt(15),  user: 'Pedro Cruz',     role: 'kitchen', action: 'order',   description: 'Marked Pork Sliced (T5) as served',             branch: 'TAG', updatedAt: auditTs(15) },
                { id: 'l-4',  isoTimestamp: auditTs(30),  timestamp: auditFmt(30),  user: 'Maria Santos',   role: 'staff',   action: 'stock',   description: 'Logged 150g Galbi as waste — Dropped',        branch: 'TAG', updatedAt: auditTs(30) },
                { id: 'l-5',  isoTimestamp: auditTs(45),  timestamp: auditFmt(45),  user: 'Juan Reyes',     role: 'manager', action: 'payment', description: 'Closed T1 — Cash ₱4,820.00',                  branch: 'TAG', updatedAt: auditTs(45) },
                { id: 'l-6',  isoTimestamp: auditTs(60),  timestamp: auditFmt(60),  user: 'Maria Santos',   role: 'staff',   action: 'order',   description: 'Opened T5 — Unli Pork & Beef · 4 pax',        branch: 'TAG', updatedAt: auditTs(60) },
                { id: 'l-7',  isoTimestamp: auditTs(90),  timestamp: auditFmt(90),  user: 'Pedro Cruz',     role: 'kitchen', action: 'stock',   description: 'Stock count submitted — Afternoon session',    branch: 'TAG', updatedAt: auditTs(90) },
                { id: 'l-8',  isoTimestamp: auditTs(120), timestamp: auditFmt(120), user: 'Ana Reyes',      role: 'staff',   action: 'order',   description: 'Added 2× Iced Tea to T3',                     branch: 'PGL', updatedAt: auditTs(120) },
                { id: 'l-9',  isoTimestamp: auditTs(180), timestamp: auditFmt(180), user: 'Pedro Cruz',     role: 'kitchen', action: 'stock',   description: 'Received 5,000g Pork Sliced — Metro Meat Co.', branch: 'TAG', updatedAt: auditTs(180) },
                { id: 'l-10', isoTimestamp: auditTs(240), timestamp: auditFmt(240), user: 'Maria Santos',   role: 'staff',   action: 'auth',    description: 'Login — Maria Santos (staff)',                 branch: 'TAG', updatedAt: auditTs(240) },
            ]);
        }

        console.log('[RxDB] Seeding complete! Database is ready.');
    } else {
        console.log(`[RxDB] Database has ${existingMenu.length} menu items and ${existingTables.length} tables. Seeding skipped.`);
    }
}
