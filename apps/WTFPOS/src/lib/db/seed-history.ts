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
    const zReads = [];
    const shifts = [];
    const transferEvents = [];
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
            let dailyPayments = { cash: 0, gcash: 0, maya: 0, card: 0 };
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

                    // Stock deductions for inventory-tracked items (including FREE — kitchen still weighs them)
                    if (item.trackInventory && !isVoided) {
                        const stockItemId = getStockItemId(item.id, branch);
                        if (stockItemId) {
                            deductions.push({
                                id: nanoid(),
                                locationId: branch,
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
                let paymentMethod: 'cash' | 'gcash' | 'maya' | 'card' = 'cash';
                const methodRoll = Math.random();
                if (methodRoll < 0.45) paymentMethod = 'cash';
                else if (methodRoll < 0.7) paymentMethod = 'gcash';
                else if (methodRoll < 0.85) paymentMethod = 'maya';
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
            const dailyVoidAmount = orders
                .filter(o => o.locationId === branch && o.status === 'cancelled' && new Date(o.createdAt).toDateString() === date.toDateString())
                .reduce((s, o) => s + (o.total ?? 0), 0);

            const xReadTime = new Date(date.getTime() + 14 * 3600000); // Around 2 PM
            xReads.push({
                id: nanoid(),
                type: 'x-read' as const,
                locationId: branch,
                timestamp: xReadTime.toISOString(),
                grossSales: dailyGrossSales,
                discounts: dailyDiscounts,
                netSales: dailyGrossSales - dailyDiscounts,
                vatAmount: dailyVat,
                totalPax: dailyPax,
                cash: dailyPayments.cash,
                gcash: dailyPayments.gcash,
                maya: dailyPayments.maya,
                card: dailyPayments.card,
                voidCount: dailyVoids,
                voidAmount: dailyVoidAmount,
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

            // Generate Z-Read (EOD close) for past days (not today)
            if (d > 0) {
                const cashExpensesDay = expenses
                    .filter(e => e.locationId === branch && e.paidBy === 'Cash from Register' && new Date(e.createdAt).toDateString() === date.toDateString())
                    .reduce((s, e) => s + e.amount, 0);
                const openingFloat = 10000 + Math.floor(Math.random() * 5000);
                const expectedClosing = openingFloat + dailyPayments.cash - cashExpensesDay;
                // Slight variance: ±200
                const variance = Math.floor(Math.random() * 401) - 200;
                const actualClosing = expectedClosing + variance;

                const zReadTime = new Date(date.getTime() + 14 * 3600000 + 3600000); // 1 hour after X-Read
                const dateStr2 = date.toISOString().slice(0, 10);

                zReads.push({
                    id: nanoid(),
                    type: 'z-read' as const,
                    locationId: branch,
                    date: dateStr2,
                    grossSales: dailyGrossSales,
                    discounts: dailyDiscounts,
                    netSales: dailyGrossSales - dailyDiscounts,
                    vatAmount: dailyVat,
                    totalPax: dailyPax,
                    cash: dailyPayments.cash,
                    gcash: dailyPayments.gcash,
                    maya: dailyPayments.maya,
                    card: dailyPayments.card,
                    submittedAt: zReadTime.toISOString(),
                    submittedBy: ['Juan Reyes', 'Maria Santos'][Math.floor(Math.random() * 2)],
                    cashExpenses: cashExpensesDay,
                    openingCash: openingFloat,
                    closingActual: actualClosing,
                    cashVariance: variance,
                    updatedAt: zReadTime.toISOString()
                });

                // Closed shift for this day
                shifts.push({
                    id: nanoid(),
                    locationId: branch,
                    cashierName: ['Maria Santos', 'Juan Reyes', 'Ana Reyes'][Math.floor(Math.random() * 3)],
                    openingFloat,
                    startedAt: new Date(date.getTime() + 0.5 * 3600000).toISOString(), // 10:30 AM
                    endedAt: zReadTime.toISOString(),
                    closingCash: actualClosing,
                    status: 'closed',
                    updatedAt: zReadTime.toISOString()
                });
            } else {
                // Today: active shift (no Z-Read)
                const openingFloat = 10000 + Math.floor(Math.random() * 5000);
                shifts.push({
                    id: nanoid(),
                    locationId: branch,
                    cashierName: ['Maria Santos', 'Juan Reyes', 'Ana Reyes'][Math.floor(Math.random() * 3)],
                    openingFloat,
                    startedAt: new Date(date.getTime() + 0.5 * 3600000).toISOString(),
                    endedAt: null,
                    closingCash: null,
                    status: 'active',
                    updatedAt: new Date().toISOString()
                });
            }

            // Generate warehouse→branch transfers (every other day)
            if (d % 2 === 0) {
                const transferTime = new Date(date.getTime() + 7 * 3600000); // 5 PM
                const meatCuts = STOCK_ITEMS_LIST.filter(s => s.category === 'Meats' && s.locationId === 'wh-tag');
                const selectedCuts = meatCuts.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));

                for (const cut of selectedCuts) {
                    const whStockId = getStockItemId(cut.menuItemId, 'wh-tag');
                    const branchStockId = getStockItemId(cut.menuItemId, branch);
                    if (!whStockId || !branchStockId) continue;

                    const tfrQty = 2000 + Math.floor(Math.random() * 6000);

                    // Outbound: warehouse deduction
                    transferEvents.push({
                        id: nanoid(),
                        locationId: 'wh-tag',
                        stockItemId: whStockId,
                        itemName: cut.name,
                        type: 'deduct' as const,
                        qty: tfrQty,
                        unit: 'g',
                        reason: `Transfer to ${branch} — ${dayName} dispatch`,
                        loggedBy: 'Noel R.',
                        loggedAt: transferTime.toISOString(),
                        updatedAt: transferTime.toISOString(),
                    });

                    // Inbound: branch delivery
                    deliveries.push({
                        id: nanoid(),
                        locationId: branch,
                        stockItemId: branchStockId,
                        itemName: cut.name,
                        qty: tfrQty,
                        unit: 'g',
                        supplier: 'Transfer from wh-tag',
                        notes: `${dayName} dispatch from warehouse`,
                        receivedAt: new Date(transferTime.getTime() + 30 * 60000).toISOString(),
                        batchNo: `TFR-${d}-${branch.toUpperCase()}-${nanoid(4)}`,
                        expiryDate: new Date(date.getTime() + 5 * 86400000).toISOString().split('T')[0],
                        usedQty: 0,
                        depleted: false,
                        updatedAt: new Date(transferTime.getTime() + 30 * 60000).toISOString(),
                    });
                }
            }

            // Generate Deliveries — 3-5 meat cuts delivered per day
            {
                const meatItems = STOCK_ITEMS_LIST.filter(s => s.category === 'Meats' && s.locationId === branch);
                const deliveryCount = 3 + Math.floor(Math.random() * 3); // 3-5 cuts per day
                const shuffledMeats = [...meatItems].sort(() => Math.random() - 0.5).slice(0, deliveryCount);
                const suppliers = ['Metro Meat Co.', 'Prime Cuts Trading', 'Fresh Farm Supply', 'Golden Meat Suppliers'];
                const supplier = suppliers[d % suppliers.length];
                let totalDeliveryExpense = 0;

                for (let mi = 0; mi < shuffledMeats.length; mi++) {
                    const item = shuffledMeats[mi];
                    const stockItemId = getStockItemId(item.menuItemId, branch);
                    if (!stockItemId) continue;

                    const qty = 3000 + Math.floor(Math.random() * 8000);
                    const deliveryTime = new Date(date.getTime() + (7 + mi * 0.5) * 3600000); // staggered morning
                    const costPerKg = item.menuItemId.includes('beef') ? 550 : item.menuItemId.includes('chicken') ? 180 : 320;
                    const amount = Math.round((qty / 1000) * costPerKg);
                    totalDeliveryExpense += amount;

                    deliveries.push({
                        id: nanoid(),
                        locationId: branch,
                        stockItemId,
                        itemName: item.name,
                        qty,
                        unit: 'g',
                        supplier,
                        notes: `Regular restocking - ${dayName}`,
                        receivedAt: deliveryTime.toISOString(),
                        batchNo: `B-${d}-${branch.toUpperCase()}-${mi}-${Math.floor(Math.random() * 100)}`,
                        expiryDate: new Date(date.getTime() + 7 * 86400000).toISOString().split('T')[0],
                        usedQty: Math.floor(qty * (0.2 + Math.random() * 0.4)),
                        depleted: false,
                        updatedAt: deliveryTime.toISOString()
                    });
                }

                // Single consolidated delivery expense per day
                const deliveryExpTime = new Date(date.getTime() + 8 * 3600000);
                expenses.push({
                    id: nanoid(),
                    category: 'Meat & Protein',
                    amount: totalDeliveryExpense,
                    description: `Restock ${shuffledMeats.length} meat cuts — ${supplier}`,
                    paidBy: 'Cash from Register',
                    locationId: branch,
                    createdBy: 'Manager',
                    createdAt: deliveryExpTime.toISOString(),
                    updatedAt: deliveryExpTime.toISOString()
                });

                // Delivery received audit
                auditEntries.push({
                    id: nanoid(),
                    isoTimestamp: deliveryExpTime.toISOString(),
                    timestamp: formatTime(deliveryExpTime),
                    user: 'Pedro Cruz',
                    role: 'kitchen',
                    action: 'stock' as const,
                    description: `Received ${shuffledMeats.length} meat cuts from ${supplier}`,
                    branch: branchLabel,
                });
            }

            // Generate 2-4 operational expenses per branch per day across diverse categories
            const dailyExpenseCount = 2 + Math.floor(Math.random() * 3);
            const allExpenseTypes = [
                { category: 'Sides & Supplies', amount: 500 + Math.floor(Math.random() * 1500), desc: 'Morning market run for vegetables & kimchi' },
                { category: 'Electricity', amount: 200 + Math.floor(Math.random() * 400), desc: 'Daily electricity estimate' },
                { category: 'Gas / LPG', amount: 150 + Math.floor(Math.random() * 350), desc: 'LPG usage for grill stations' },
                { category: 'Water', amount: 80 + Math.floor(Math.random() * 120), desc: 'Daily water usage' },
                { category: 'Other / Miscellaneous', amount: 150 + Math.floor(Math.random() * 400), desc: 'Dish soap, trash bags, cleaning agents' },
                { category: 'Repairs & Maintenance', amount: 500 + Math.floor(Math.random() * 2000), desc: 'Grill maintenance and parts' },
                { category: 'Staff Meals', amount: 300 + Math.floor(Math.random() * 500), desc: 'Employee meal allowance' },
                { category: 'Daily Wages', amount: 3000 + Math.floor(Math.random() * 2000), desc: 'Daily labor budget' },
                { category: 'Transport / Delivery', amount: 200 + Math.floor(Math.random() * 500), desc: 'Grab/delivery runs for supplies' },
                { category: 'Rent', amount: Math.round(80000 / 30), desc: 'Daily rent prorate' },
                { category: 'Internet', amount: 100, desc: 'Monthly internet prorate' },
                { category: 'Marketing / Promos', amount: 300 + Math.floor(Math.random() * 700), desc: 'FB ads / flyer printing' },
            ];
            const shuffled = allExpenseTypes.sort(() => Math.random() - 0.5);
            for (let ei = 0; ei < dailyExpenseCount; ei++) {
                const expense = shuffled[ei % shuffled.length];
                const expenseTime = new Date(date.getTime() + (8 + ei) * 3600000);
                expenses.push({
                    id: nanoid(),
                    category: expense.category,
                    amount: expense.amount,
                    description: expense.desc,
                    paidBy: ['Cash from Register', 'GCash', 'Maya', 'Personal Cash'][Math.floor(Math.random() * 4)],
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
                    locationId: branch,
                    stockItemId,
                    itemName: item.name,
                    type: 'waste' as const,
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

    // Generate utility readings as audit log entries (one per day per branch for the past 7 days)
    // Stored in audit_logs with description='EOD Utility Reading' and meta=JSON({electricity,gas,water})
    const utilityAuditEntries: LogEntry[] = [];
    for (let d = 6; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(22, 0, 0, 0);

        for (const branch of branches) {
            // Cumulative meter readings (increase day over day)
            const baseElec = branch === 'tag' ? 5000 : 4200;
            const baseGas = branch === 'tag' ? 300 : 250;
            const baseWater = branch === 'tag' ? 800 : 650;
            const dayOffset = 6 - d; // 0 for oldest day, 6 for today
            const electricity = baseElec + dayOffset * (80 + Math.floor(Math.random() * 60));  // ~80-140 kWh/day
            const gas = baseGas + dayOffset * (8 + Math.floor(Math.random() * 12));             // ~8-20 kg/day
            const water = baseWater + dayOffset * (2 + Math.floor(Math.random() * 4));          // ~2-6 m³/day

            utilityAuditEntries.push({
                id: nanoid(),
                locationId: branch,
                isoTimestamp: date.toISOString(),
                timestamp: date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
                user: 'Manager',
                role: 'manager',
                action: 'admin',
                description: 'EOD Utility Reading',
                branch: branch === 'tag' ? 'TAG' : 'PGL',
                meta: JSON.stringify({ electricity, gas, water }),
            });
        }
    }

    // Insert all data into RxDB
    // JSON round-trip strips undefined values that would fail schema validation
    const clean = <T>(arr: T[]): T[] => JSON.parse(JSON.stringify(arr));
    const allReadings = [...xReads, ...zReads];
    const allStockEvents = [...wasteEntries, ...transferEvents];
    await Promise.all([
        db.orders.bulkInsert(clean(orders)),
        db.deductions.bulkInsert(clean(deductions)),
        db.deliveries.bulkInsert(clean(deliveries)),
        db.expenses.bulkInsert(clean(expenses)),
        db.readings.bulkInsert(clean(allReadings)),
        db.kds_tickets.bulkInsert(clean(kdsHistoryTickets)),
        db.stock_events.bulkInsert(clean(allStockEvents)),
        db.shifts.bulkInsert(clean(shifts)),
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
    console.log(`  - ${zReads.length} Z-Read reports`);
    console.log(`  - ${shifts.length} shifts`);
    console.log(`  - ${deliveries.length} deliveries (${deliveries.filter(d => d.supplier === 'Transfer from wh-tag').length} transfers)`);
    console.log(`  - ${expenses.length} expenses`);
    console.log(`  - ${wasteEntries.length} waste entries`);
    console.log(`  - ${transferEvents.length} transfer stock events`);
    console.log(`  - ${utilityAuditEntries.length} utility readings (in audit_logs)`);
    console.log(`  - ${kdsHistoryTickets.length} KDS history entries`);
    console.log(`  - ${auditEntries.length} audit log entries`);
}
