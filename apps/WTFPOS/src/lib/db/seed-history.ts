import type { RxDatabase } from 'rxdb';
import { nanoid } from 'nanoid';
import { INITIAL_MENU_ITEMS as menuItems } from '$lib/stores/pos.svelte';
import { STOCK_ITEMS_LIST } from '$lib/stores/stock.svelte';
import type { LogEntry } from '$lib/stores/audit.svelte';

/**
 * Generates 1 week of historical data for the POS system.
 * This creates realistic chronological data including:
 * - Orders (dine-in, takeout, with various statuses)
 * - Stock deductions from orders
 * - X-Read reports for each day
 * - Deliveries and expenses
 * - KDS history
 * - Audit log entries
 */
export async function seedHistory(db: RxDatabase) {
    console.log('[RxDB] Generating 7 days of historical POS data...');

    const now = new Date();
    const branches = ['tag', 'pgl'];
    const orders = [];
    const deductions = [];
    const deliveries = [];
    const expenses = [];
    const xReads = [];
    const kdsHistoryTickets = [];
    const auditEntries = [];

    // Track stock item IDs for each branch — must match `si-${index}` format from INITIAL_STOCK_ITEMS
    const getStockItemId = (menuItemId: string, locationId: string) => {
        const index = STOCK_ITEMS_LIST.findIndex(s => s.menuItemId === menuItemId && s.locationId === locationId);
        return index >= 0 ? `si-${index}` : null;
    };

    // Helper to format time for audit logs
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    };

    // We'll generate data for each of the last 7 days (not including today)
    for (let d = 6; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(10, 0, 0, 0); // Start of business day

        const dayName = date.toLocaleDateString('en-PH', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

        for (const branch of branches) {
            const branchLabel = branch === 'tag' ? 'TAG' : 'PGL';
            let dailyGrossSales = 0;
            let dailyDiscounts = 0;
            let dailyVat = 0;
            let dailyPax = 0;
            let dailyVoids = 0;
            let dailyDiscountCount = 0;
            let dailyPayments = { cash: 0, gcash: 0, card: 0 };
            let orderCounter = 0;

            // Generate 5-15 orders per branch per day
            const orderCount = Math.floor(Math.random() * 11) + 5;
            
            for (let i = 0; i < orderCount; i++) {
                orderCounter++;
                const orderDate = new Date(date);
                // Random time between 11 AM and 10 PM
                orderDate.setHours(11 + Math.floor(Math.random() * 11));
                orderDate.setMinutes(Math.floor(Math.random() * 60));
                
                const orderId = nanoid();
                const isTakeout = Math.random() < 0.25; // 25% takeout
                const orderStatusRoll = Math.random();
                let orderStatus: 'paid' | 'cancelled' | 'pending_payment' | 'open';
                
                // Distribution: 75% paid, 10% cancelled/voided, 10% pending, 5% open
                if (orderStatusRoll < 0.75) {
                    orderStatus = 'paid';
                } else if (orderStatusRoll < 0.85) {
                    orderStatus = 'cancelled';
                } else if (orderStatusRoll < 0.95) {
                    orderStatus = 'pending_payment';
                } else {
                    orderStatus = 'open';
                }

                const isVoided = orderStatus === 'cancelled';
                const pax = isTakeout ? 1 : Math.floor(Math.random() * 6) + 1;
                
                // Select a package if dine-in (70% chance)
                const pkg = !isTakeout && Math.random() < 0.7 
                    ? menuItems.filter(m => m.category === 'packages')[Math.floor(Math.random() * 3)] 
                    : null;
                
                const items = [];
                let subtotal = 0;
                const customerName = isTakeout 
                    ? ['Maria', 'Juan', 'Pedro', 'Ana', 'Jose', 'Carmen'][Math.floor(Math.random() * 6)]
                    : '';

                // Add package if selected
                if (pkg) {
                    items.push({
                        id: nanoid(),
                        menuItemId: pkg.id,
                        menuItemName: pkg.name,
                        quantity: pax,
                        unitPrice: pkg.price,
                        weight: null,
                        status: isVoided ? 'cancelled' : 'served',
                        sentAt: orderDate.toISOString(),
                        tag: 'PKG',
                        notes: ''
                    });
                    subtotal += pkg.price * pax;
                }

                // Add random items (2-6 items)
                const itemChoices = menuItems.filter(m => m.category !== 'packages');
                const itemCount = Math.floor(Math.random() * 5) + 2;
                for (let j = 0; j < itemCount; j++) {
                    const item = itemChoices[Math.floor(Math.random() * itemChoices.length)];
                    const qty = item.isWeightBased ? 1 : Math.floor(Math.random() * 3) + 1;
                    const weight = item.isWeightBased ? (Math.floor(Math.random() * 400) + 150) : null;
                    const isFree = item.category === 'meats' && pkg && Math.random() < 0.7;
                    const price = isFree ? 0 : (item.isWeightBased 
                        ? Math.round((weight || 0) * (item.pricePerGram || 0.65)) 
                        : item.price);
                    
                    const orderItem = {
                        id: nanoid(),
                        menuItemId: item.id,
                        menuItemName: item.name,
                        quantity: qty,
                        unitPrice: price,
                        weight,
                        status: isVoided ? 'cancelled' : 'served',
                        sentAt: orderDate.toISOString(),
                        tag: isFree ? 'FREE' : null,
                        notes: ''
                    };
                    items.push(orderItem);
                    
                    if (!isVoided && !isFree) {
                        subtotal += price * qty;
                    }

                    // Stock deductions for inventory-tracked items
                    if (item.trackInventory && !isFree && !isVoided) {
                        const stockItemId = getStockItemId(item.id, branch);
                        if (stockItemId) {
                            deductions.push({
                                id: nanoid(),
                                stockItemId,
                                qty: weight || qty,
                                tableId: isTakeout ? 'takeout' : `${branch.toUpperCase()}-T${(orderCounter % 8) + 1}`,
                                orderId,
                                timestamp: orderDate.toISOString(),
                                updatedAt: orderDate.toISOString()
                            });
                        }
                    }
                }

                // Random discount (15% chance for eligible orders)
                let discountType: 'none' | 'senior' | 'pwd' | 'promo' = 'none';
                let discountAmount = 0;
                let discountPax = 0;
                
                if (!isVoided && Math.random() < 0.15 && subtotal > 0) {
                    const discountRoll = Math.random();
                    if (discountRoll < 0.4) {
                        discountType = 'senior';
                        discountPax = Math.min(Math.floor(Math.random() * pax) + 1, pax);
                        discountAmount = Math.round((subtotal * (discountPax / pax) / 1.12) * 0.20);
                        dailyDiscountCount++;
                    } else if (discountRoll < 0.7) {
                        discountType = 'pwd';
                        discountPax = Math.min(Math.floor(Math.random() * pax) + 1, pax);
                        discountAmount = Math.round((subtotal * (discountPax / pax) / 1.12) * 0.20);
                        dailyDiscountCount++;
                    } else {
                        discountType = 'promo';
                        discountAmount = Math.round(subtotal * 0.15);
                        dailyDiscountCount++;
                    }
                }

                const vat = Math.round((subtotal - discountAmount) - (subtotal - discountAmount) / 1.12);
                const total = subtotal - discountAmount;

                // Determine payment method
                let paymentMethod: 'cash' | 'gcash' | 'card' = 'cash';
                const methodRoll = Math.random();
                if (methodRoll < 0.5) paymentMethod = 'cash';
                else if (methodRoll < 0.8) paymentMethod = 'gcash';
                else paymentMethod = 'card';

                const payments = (orderStatus === 'paid' || orderStatus === 'pending_payment') && total > 0
                    ? [{ method: paymentMethod, amount: total }]
                    : [];

                const tableNum = (orderCounter % 8) + 1;
                const tableId = isTakeout ? null : `${branch.toUpperCase()}-T${tableNum}`;

                const order = {
                    id: orderId,
                    locationId: branch,
                    orderType: isTakeout ? 'takeout' : 'dine-in',
                    customerName: isTakeout ? customerName : '',
                    tableId,
                    tableNumber: isTakeout ? null : tableNum,
                    packageName: pkg?.name || null,
                    packageId: pkg?.id || null,
                    pax,
                    items,
                    status: orderStatus,
                    discountType,
                    discountPax,
                    discountIds: discountType === 'senior' || discountType === 'pwd' 
                        ? Array.from({ length: discountPax }, () => `ID-${Math.floor(Math.random() * 1000000)}`)
                        : [],
                    subtotal,
                    discountAmount,
                    vatAmount: vat,
                    total,
                    payments,
                    createdAt: orderDate.toISOString(),
                    closedAt: orderStatus === 'paid' 
                        ? new Date(orderDate.getTime() + 45 * 60000).toISOString() 
                        : null,
                    billPrinted: orderStatus === 'paid',
                    notes: '',
                    cancelReason: isVoided ? ['mistake', 'walkout', 'write_off'][Math.floor(Math.random() * 3)] : undefined,
                    closedBy: orderStatus === 'paid' ? ['Maria Santos', 'Juan Reyes', 'Pedro Cruz', 'Ana Reyes'][Math.floor(Math.random() * 4)] : undefined,
                    takeoutStatus: isTakeout
                        ? (orderStatus === 'paid' ? 'picked_up' : orderStatus === 'open' ? 'preparing' : 'ready')
                        : undefined,
                    updatedAt: orderDate.toISOString()
                };
                
                orders.push(order);

                // Create KDS history for non-voided orders with items
                if (!isVoided && items.length > 0) {
                    kdsHistoryTickets.push({
                        id: nanoid(),
                        orderId,
                        locationId: branch,
                        tableNumber: isTakeout ? null : tableNum,
                        customerName: isTakeout ? customerName : undefined,
                        items: items.map(item => ({
                            id: item.id,
                            menuItemName: item.menuItemName,
                            quantity: item.quantity,
                            status: 'served',
                            weight: item.weight,
                            category: menuItems.find(m => m.id === item.menuItemId)?.category || 'dishes',
                            notes: item.notes
                        })),
                        createdAt: orderDate.toISOString(),
                        bumpedAt: new Date(orderDate.getTime() + 20 * 60000).toISOString(),
                        bumpedBy: 'Kitchen Staff',
                        updatedAt: new Date(orderDate.getTime() + 20 * 60000).toISOString()
                    });
                }

                // Add audit log entries for key events
                const tableLabel = isTakeout ? `Takeout (${customerName})` : `T${tableNum}`;
                
                // Table opened audit
                auditEntries.push({
                    id: nanoid(),
                    isoTimestamp: orderDate.toISOString(),
                    timestamp: formatTime(orderDate),
                    user: ['Maria Santos', 'Juan Reyes', 'Pedro Cruz', 'Ana Reyes'][Math.floor(Math.random() * 4)],
                    role: 'staff',
                    action: 'order' as const,
                    description: `Opened ${tableLabel}${pkg ? ` — ${pkg.name}` : ''} · ${pax} pax`,
                    branch: branchLabel,
                });

                // Item charged audit for first item
                if (items.length > 0 && items[0].tag !== 'PKG') {
                    const firstItem = items[0];
                    const qtyStr = firstItem.weight ? `${firstItem.weight}g` : `${firstItem.quantity}×`;
                    auditEntries.push({
                        id: nanoid(),
                        isoTimestamp: new Date(orderDate.getTime() + 2 * 60000).toISOString(),
                        timestamp: formatTime(new Date(orderDate.getTime() + 2 * 60000)),
                        user: ['Maria Santos', 'Juan Reyes', 'Pedro Cruz', 'Ana Reyes'][Math.floor(Math.random() * 4)],
                        role: 'staff',
                        action: 'order' as const,
                        description: `Charged ${qtyStr} ${firstItem.menuItemName} → ${tableLabel}`,
                        branch: branchLabel,
                    });
                }

                // Discount applied audit
                if (discountType !== 'none') {
                    auditEntries.push({
                        id: nanoid(),
                        isoTimestamp: new Date(orderDate.getTime() + 30 * 60000).toISOString(),
                        timestamp: formatTime(new Date(orderDate.getTime() + 30 * 60000)),
                        user: ['Juan Reyes', 'Manager'][Math.floor(Math.random() * 2)],
                        role: 'manager',
                        action: 'payment' as const,
                        description: `Discount applied on ${tableLabel} — ${discountType} (−₱${discountAmount.toFixed(2)})`,
                        branch: branchLabel,
                    });
                }

                // Table closed or voided audit
                if (orderStatus === 'paid') {
                    const closedAt = new Date(orderDate.getTime() + 45 * 60000);
                    const durationSeconds = 45 * 60;
                    auditEntries.push({
                        id: nanoid(),
                        isoTimestamp: closedAt.toISOString(),
                        timestamp: formatTime(closedAt),
                        user: ['Maria Santos', 'Juan Reyes'][Math.floor(Math.random() * 2)],
                        role: 'staff',
                        action: 'payment' as const,
                        description: `Checkout ${tableLabel} — ₱${total.toFixed(2)} (${paymentMethod}) [${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s]`,
                        branch: branchLabel,
                    });
                } else if (isVoided) {
                    const voidedAt = new Date(orderDate.getTime() + 15 * 60000);
                    auditEntries.push({
                        id: nanoid(),
                        isoTimestamp: voidedAt.toISOString(),
                        timestamp: formatTime(voidedAt),
                        user: 'Juan Reyes',
                        role: 'manager',
                        action: 'payment' as const,
                        description: `VOIDED: ${tableLabel} — ₱${total.toFixed(2)} (mistake)`,
                        branch: branchLabel,
                    });
                }

                // Update daily totals
                if (isVoided) {
                    dailyVoids++;
                } else if (orderStatus === 'paid') {
                    dailyGrossSales += subtotal;
                    dailyDiscounts += discountAmount;
                    dailyVat += vat;
                    dailyPax += pax;
                    if (payments.length > 0) {
                        dailyPayments[paymentMethod] += total;
                    }
                }
            }

            // Generate X-Read for the day
            const xReadTime = new Date(date.getTime() + 14 * 3600000); // Around midnight
            xReads.push({
                id: nanoid(),
                timestamp: xReadTime.toISOString(),
                grossSales: dailyGrossSales,
                discounts: dailyDiscounts,
                netSales: dailyGrossSales - dailyDiscounts,
                vatAmount: dailyVat,
                totalPax: dailyPax,
                cash: dailyPayments.cash,
                gcash: dailyPayments.gcash,
                card: dailyPayments.card,
                voidCount: dailyVoids,
                discountCount: dailyDiscountCount,
                generatedBy: 'Manager',
                updatedAt: xReadTime.toISOString()
            });

            // Add X-Read generated audit
            auditEntries.push({
                id: nanoid(),
                isoTimestamp: xReadTime.toISOString(),
                timestamp: formatTime(xReadTime),
                user: 'Manager',
                role: 'manager',
                action: 'admin' as const,
                description: `X-Read generated for ${dayName} — ₱${(dailyGrossSales - dailyDiscounts).toFixed(2)} (${orderCounter} orders)`,
                branch: branchLabel,
            });

            // Generate Deliveries every 2-3 days
            if (d % 3 === 0 || d % 2 === 0) {
                const meatItems = STOCK_ITEMS_LIST.filter(s => s.category === 'Meats' && s.locationId === branch);
                if (meatItems.length > 0) {
                    const item = meatItems[Math.floor(Math.random() * meatItems.length)];
                    const stockItemId = getStockItemId(item.menuItemId, branch);
                    if (stockItemId) {
                        const qty = 5000 + Math.floor(Math.random() * 10000);
                        const amount = 3000 + Math.floor(Math.random() * 7000);
                        const deliveryTime = new Date(date.getTime() + 8 * 3600000); // 8 AM
                        const suppliers = ['Metro Meat Co.', 'Prime Cuts Trading', 'Fresh Farm Supply', 'Golden Meat Suppliers'];
                        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
                        
                        const delId = nanoid();
                        deliveries.push({
                            id: delId,
                            stockItemId,
                            itemName: item.name,
                            qty,
                            unit: 'g',
                            supplier,
                            notes: `Regular restocking - ${dayName}`,
                            receivedAt: deliveryTime.toISOString(),
                            batchNo: `B-${d}-${branch.toUpperCase()}-${Math.floor(Math.random() * 100)}`,
                            expiryDate: new Date(date.getTime() + 7 * 86400000).toISOString().split('T')[0],
                            usedQty: Math.floor(qty * 0.3),
                            depleted: false,
                            updatedAt: deliveryTime.toISOString()
                        });

                        // Delivery expense
                        expenses.push({
                            id: nanoid(),
                            category: 'Meat Procurement',
                            amount,
                            description: `Restock ${item.name} — ${qty.toLocaleString()}g`,
                            paidBy: 'Petty Cash',
                            locationId: branch,
                            createdBy: 'Manager',
                            createdAt: deliveryTime.toISOString(),
                            updatedAt: deliveryTime.toISOString()
                        });

                        // Delivery received audit
                        auditEntries.push({
                            id: nanoid(),
                            isoTimestamp: deliveryTime.toISOString(),
                            timestamp: formatTime(deliveryTime),
                            user: 'Pedro Cruz',
                            role: 'kitchen',
                            action: 'stock' as const,
                            description: `Received ${qty.toLocaleString()}g ${item.name} — ${supplier}`,
                            branch: branchLabel,
                        });
                    }
                }
            }

            // Generate operational expenses (not every day)
            if (Math.random() < 0.4) {
                const expenseTime = new Date(date.getTime() + 9 * 3600000);
                const expenseTypes = [
                    { category: 'Produce & Sides', amount: 500 + Math.floor(Math.random() * 1500), desc: 'Morning market run for vegetables' },
                    { category: 'Utilities', amount: 200 + Math.floor(Math.random() * 300), desc: 'Electricity partial payment' },
                    { category: 'Petty Cash', amount: 150 + Math.floor(Math.random() * 400), desc: 'Dish soap, trash bags, cleaning agents' },
                    { category: 'Miscellaneous', amount: 500 + Math.floor(Math.random() * 2000), desc: 'Grill maintenance and parts' },
                    { category: 'Labor Budget', amount: 300 + Math.floor(Math.random() * 500), desc: 'Employee meal allowance' }
                ];
                const expense = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
                
                expenses.push({
                    id: nanoid(),
                    category: expense.category,
                    amount: expense.amount,
                    description: expense.desc,
                    paidBy: ['Petty Cash', 'GCash', 'Card'][Math.floor(Math.random() * 3)],
                    locationId: branch,
                    createdBy: 'Manager',
                    createdAt: expenseTime.toISOString(),
                    updatedAt: expenseTime.toISOString()
                });

                // Expense logged audit
                auditEntries.push({
                    id: nanoid(),
                    isoTimestamp: expenseTime.toISOString(),
                    timestamp: formatTime(expenseTime),
                    user: 'Manager',
                    role: 'manager',
                    action: 'expense' as const,
                    description: `Expense: ${expense.category} — ₱${expense.amount.toFixed(2)} (${expense.desc})`,
                    branch: branchLabel,
                });
            }

            // Stock count audit (once per day)
            const countTime = new Date(date.getTime() + 13 * 3600000); // 11 PM
            auditEntries.push({
                id: nanoid(),
                isoTimestamp: countTime.toISOString(),
                timestamp: formatTime(countTime),
                user: 'Pedro Cruz',
                role: 'kitchen',
                action: 'stock' as const,
                description: 'Stock count submitted — Evening session',
                branch: branchLabel,
            });
        }
    }

    // Generate waste entries across the 7 days
    const wasteEntries = [];
    const wasteReasons = ['Dropped / Spilled', 'Expired', 'Unusable (damaged)', 'Overcooked', 'Trimming (bone/fat)', 'Other'];
    for (let d = 6; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);

        for (const branch of branches) {
            // 1-3 waste entries per branch per day
            const wasteCount = Math.floor(Math.random() * 3) + 1;
            for (let w = 0; w < wasteCount; w++) {
                const meatItems = STOCK_ITEMS_LIST.filter(s => s.category === 'Meats' && s.locationId === branch);
                if (meatItems.length === 0) continue;
                const item = meatItems[Math.floor(Math.random() * meatItems.length)];
                const stockItemId = getStockItemId(item.menuItemId, branch);
                if (!stockItemId) continue;

                const wasteTime = new Date(date);
                wasteTime.setHours(14 + Math.floor(Math.random() * 8));
                wasteTime.setMinutes(Math.floor(Math.random() * 60));

                wasteEntries.push({
                    id: nanoid(),
                    stockItemId,
                    itemName: item.name,
                    qty: 50 + Math.floor(Math.random() * 300),
                    unit: 'g',
                    reason: wasteReasons[Math.floor(Math.random() * wasteReasons.length)],
                    loggedBy: ['Maria Santos', 'Pedro Cruz', 'Ana Reyes'][Math.floor(Math.random() * 3)],
                    loggedAt: wasteTime.toISOString(),
                    updatedAt: wasteTime.toISOString(),
                });
            }
        }
    }

    // Generate utility readings as audit log entries (one per day for the past 7 days)
    // Stored in audit_logs with description='EOD Utility Reading' and meta=JSON({electricity,gas})
    const utilityAuditEntries: LogEntry[] = [];
    for (let d = 6; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(22, 0, 0, 0);
        const electricity = 80 + Math.floor(Math.random() * 60); // 80-140 kWh
        const gas = 8 + Math.floor(Math.random() * 12);          // 8-20 kg

        utilityAuditEntries.push({
            id: nanoid(),
            isoTimestamp: date.toISOString(),
            timestamp: date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            user: 'Manager',
            role: 'manager',
            action: 'admin',
            description: 'EOD Utility Reading',
            branch: 'TAG',
            meta: JSON.stringify({ electricity, gas }),
        });
    }

    // Insert all data into RxDB
    // JSON round-trip strips undefined values that would fail schema validation
    const clean = <T>(arr: T[]): T[] => JSON.parse(JSON.stringify(arr));
    await Promise.all([
        db.orders.bulkInsert(clean(orders)),
        db.deductions.bulkInsert(clean(deductions)),
        db.deliveries.bulkInsert(clean(deliveries)),
        db.expenses.bulkInsert(clean(expenses)),
        db.x_reads.bulkInsert(clean(xReads)),
        db.kds_tickets.bulkInsert(clean(kdsHistoryTickets)),
        db.waste.bulkInsert(clean(wasteEntries)),
    ]);

    // Insert audit log entries (including utility readings) into RxDB
    const allAuditEntries = [...auditEntries, ...utilityAuditEntries];
    const auditDocsWithUpdatedAt = allAuditEntries.map(entry => ({
        ...entry,
        updatedAt: entry.isoTimestamp,
    }));
    await db.audit_logs.bulkInsert(clean(auditDocsWithUpdatedAt));

    console.log(`[RxDB] Seeding history complete:`);
    console.log(`  - ${orders.length} orders (${orders.filter(o => o.status === 'cancelled').length} voided)`);
    console.log(`  - ${deductions.length} stock deductions`);
    console.log(`  - ${xReads.length} X-Read reports`);
    console.log(`  - ${deliveries.length} deliveries`);
    console.log(`  - ${expenses.length} expenses`);
    console.log(`  - ${wasteEntries.length} waste entries`);
    console.log(`  - ${utilityAuditEntries.length} utility readings (in audit_logs)`);
    console.log(`  - ${kdsHistoryTickets.length} KDS history entries`);
    console.log(`  - ${auditEntries.length} audit log entries`);
}
