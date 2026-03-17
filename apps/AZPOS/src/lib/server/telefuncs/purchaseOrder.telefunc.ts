// Custom context getter for our custom telefunc server
function getContext(): { user?: import('$lib/types/auth.schema').AuthUser; request?: Request } {
	return global.telefuncContext || { user: undefined, request: undefined };
}
import {
	createPurchaseOrderSchema,
	updatePurchaseOrderSchema,
	purchaseOrderFiltersSchema,
	receiveItemsSchema,
	approvePurchaseOrderSchema,
	type PurchaseOrder,
	type PurchaseOrderFilters,
	type PurchaseOrderStats,
	type PaginatedPurchaseOrders
} from '$lib/types/purchaseOrder.schema';
import { createSupabaseClient } from '$lib/server/db';

// Telefunc to get paginated purchase orders with filters
export async function onGetPurchaseOrders(
	filters?: PurchaseOrderFilters
): Promise<PaginatedPurchaseOrders> {
	console.log('📦 [TELEFUNC - onGetPurchaseOrders] Starting query with filters:', filters);
	const { user } = getContext();
	if (!user) throw new Error('Not authenticated');
	console.log('👤 [TELEFUNC - onGetPurchaseOrders] User authenticated:', user.id);

	const supabase = createSupabaseClient();
	const validatedFilters = filters ? purchaseOrderFiltersSchema.parse(filters) : {};
	console.log('✅ [TELEFUNC - onGetPurchaseOrders] Validated filters:', validatedFilters);

	const page = validatedFilters.page || 1;
	const limit = validatedFilters.limit || 20;
	const offset = (page - 1) * limit;

	let query = supabase.from('purchase_orders').select(
		`
      *,
      supplier:suppliers(id, name, email)
    `,
		{ count: 'exact' }
	);
	console.log('🔍 [TELEFUNC - onGetPurchaseOrders] Query created, applying filters...');

	// Apply filters
	if (validatedFilters.supplier_id) {
		query = query.eq('supplier_id', validatedFilters.supplier_id);
	}

	if (validatedFilters.status && validatedFilters.status !== 'all') {
		query = query.eq('status', validatedFilters.status);
	} else if (validatedFilters.statuses && validatedFilters.statuses.length > 0) {
		query = query.in('status', validatedFilters.statuses);
	}

	if (validatedFilters.date_from) {
		query = query.gte('order_date', validatedFilters.date_from);
	}

	if (validatedFilters.date_to) {
		query = query.lte('order_date', validatedFilters.date_to);
	}

	if (validatedFilters.search) {
		query = query.or(
			`po_number.ilike.%${validatedFilters.search}%,suppliers.name.ilike.%${validatedFilters.search}%`
		);
	}

	if (validatedFilters.created_by) {
		query = query.eq('created_by', validatedFilters.created_by);
	}

	// Apply sorting
	const sortBy = validatedFilters.sort_by || 'order_date';
	const sortOrder = validatedFilters.sort_order || 'desc';

	switch (sortBy) {
		case 'supplier':
			// Order by supplier name using the alias
			query = query.order('supplier(name)', { ascending: sortOrder === 'asc' });
			break;
		default:
			query = query.order(sortBy, { ascending: sortOrder === 'asc' });
	}

	// Apply pagination
	query = query.range(offset, offset + limit - 1);

	console.log('🔍 [TELEFUNC - onGetPurchaseOrders] Executing Supabase query...');
	const { data: purchaseOrders, error, count } = await query;
	if (error) {
		console.error('❌ [TELEFUNC - onGetPurchaseOrders] Database error:', error);
		throw error;
	}
	console.log(' [TELEFUNC - onGetPurchaseOrders] Query results - Count:', count, 'Items:', purchaseOrders?.length);

	const totalPages = Math.ceil((count || 0) / limit);

	const result = {
		purchase_orders:
			purchaseOrders?.map((po) => ({
				id: po.id,
				po_number: po.po_number,
				supplier_id: po.supplier_id,
				status: po.status,
				order_date: po.order_date,
				expected_delivery_date: po.expected_delivery_date,
				total_amount: po.total_amount,
				tax_amount: po.tax_amount,
				shipping_cost: po.shipping_cost || 0, // Add missing field from database
				notes: po.notes,
				items: po.items || [], // Add missing field (items relationship)
				created_by: po.created_by,
				created_at: po.created_at,
				updated_at: po.updated_at
			})) || [],
		pagination: {
			page,
			limit,
			total: count || 0,
			total_pages: totalPages,
			has_more: page < totalPages
		}
	};
	console.log('🎯 [TELEFUNC - onGetPurchaseOrders] Returning result with', result.purchase_orders.length, 'purchase orders');
	return result;
}

// Telefunc to get purchase order by ID
export async function onGetPurchaseOrderById(poId: string): Promise<PurchaseOrder | null> {
	const { user } = getContext();
	if (!user) throw new Error('Not authenticated');

	const supabase = createSupabaseClient();

	const { data: po, error } = await supabase
		.from('purchase_orders')
		.select(
			`
      *,
      supplier:suppliers(id, name, email, phone),
      created_by_user:users!purchase_orders_created_by_fkey(full_name),
      approved_by_user:users!purchase_orders_approved_by_fkey(full_name)
    `
		)
		.eq('id', poId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null;
		throw error;
	}

	return {
		id: po.id,
		po_number: po.po_number,
		supplier_id: po.supplier_id,
		status: po.status,
		order_date: po.order_date,
		expected_delivery_date: po.expected_delivery_date,
		total_amount: po.total_amount,
		tax_amount: po.tax_amount,
		shipping_cost: po.shipping_cost,
		notes: po.notes,
		items: po.items,
		created_by: po.created_by,
		created_at: po.created_at,
		updated_at: po.updated_at
	};
}

// Telefunc to create a new purchase order
export async function onCreatePurchaseOrder(poData: unknown): Promise<PurchaseOrder> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = createPurchaseOrderSchema.parse(poData);
	const supabase = createSupabaseClient();

	// Generate PO number
	const { count } = await supabase
		.from('purchase_orders')
		.select('*', { count: 'exact', head: true });

	const poNumber = `PO-${String((count || 0) + 1).padStart(6, '0')}`;

	// Calculate totals
	const subtotal = validatedData.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);
	const taxAmount = subtotal * 0.1; // 10% tax - should be configurable
	const totalAmount = subtotal + taxAmount;

	const { data: newPO, error } = await supabase
		.from('purchase_orders')
		.insert({
			po_number: poNumber,
			supplier_id: validatedData.supplier_id,
			status: 'draft',
			order_date: new Date().toISOString(),
			expected_delivery_date: validatedData.expected_delivery_date,
			subtotal,
			tax_amount: taxAmount,
			total_amount: totalAmount,
			notes: validatedData.notes,
			items: validatedData.items,
			created_by: user.id,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.select()
		.single();

	if (error) throw error;

	return {
		id: newPO.id,
		po_number: newPO.po_number,
		supplier_id: newPO.supplier_id,
		status: newPO.status,
		order_date: newPO.order_date,
		expected_delivery_date: newPO.expected_delivery_date,
		total_amount: newPO.total_amount,
		tax_amount: newPO.tax_amount,
		shipping_cost: newPO.shipping_cost,
		notes: newPO.notes,
		items: newPO.items,
		created_by: newPO.created_by,
		created_at: newPO.created_at,
		updated_at: newPO.updated_at
	};
}

// Telefunc to update a purchase order
export async function onUpdatePurchaseOrder(poId: string, poData: unknown): Promise<PurchaseOrder> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = updatePurchaseOrderSchema.parse(poData);
	const supabase = createSupabaseClient();

	// Recalculate totals if items are updated
	let updatePayload: Record<string, unknown> = {
		...validatedData,
		updated_at: new Date().toISOString()
	};

	if (validatedData.items) {
		const subtotal = validatedData.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);
		const taxAmount = subtotal * 0.1;
		const totalAmount = subtotal + taxAmount;

		updatePayload = {
			...updatePayload,
			subtotal,
			tax_amount: taxAmount,
			total_amount: totalAmount
		};
	}

	const { data: updatedPO, error } = await supabase
		.from('purchase_orders')
		.update(updatePayload)
		.eq('id', poId)
		.select()
		.single();

	if (error) throw error;

	return {
		id: updatedPO.id,
		po_number: updatedPO.po_number,
		supplier_id: updatedPO.supplier_id,
		status: updatedPO.status,
		order_date: updatedPO.order_date,
		expected_delivery_date: updatedPO.expected_delivery_date,
		tax_amount: updatedPO.tax_amount,
		total_amount: updatedPO.total_amount,
		notes: updatedPO.notes,
		items: updatedPO.items,
		created_by: updatedPO.created_by,
		shipping_cost: updatedPO.shipping_cost,
		created_at: updatedPO.created_at,
		updated_at: updatedPO.updated_at
	};
}

// Telefunc to approve/reject purchase order
export async function onApprovePurchaseOrder(approvalData: unknown): Promise<PurchaseOrder> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = approvePurchaseOrderSchema.parse(approvalData);
	const supabase = createSupabaseClient();

	const status = validatedData.approved ? 'approved' : 'cancelled';
	const updatePayload: Record<string, unknown> = {
		status,
		approved_by: user.id,
		approved_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};

	if (validatedData.notes) {
		updatePayload.notes = validatedData.notes;
	}

	const { data: updatedPO, error } = await supabase
		.from('purchase_orders')
		.update(updatePayload)
		.eq('id', validatedData.purchase_order_id)
		.select()
		.single();

	if (error) throw error;

	return {
		id: updatedPO.id,
		po_number: updatedPO.po_number,
		supplier_id: updatedPO.supplier_id,
		status: updatedPO.status,
		order_date: updatedPO.order_date,
		expected_delivery_date: updatedPO.expected_delivery_date,
		tax_amount: updatedPO.tax_amount,
		total_amount: updatedPO.total_amount,
		notes: updatedPO.notes,
		items: updatedPO.items,
		created_by: updatedPO.created_by,
		shipping_cost: updatedPO.shipping_cost,
				created_at: updatedPO.created_at,
		updated_at: updatedPO.updated_at
	};
}

// Telefunc to receive items from purchase order
export async function onReceiveItems(receiveData: unknown): Promise<PurchaseOrder> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = receiveItemsSchema.parse(receiveData);
	const supabase = createSupabaseClient();

	// Get current PO
	const { data: currentPO, error: fetchError } = await supabase
		.from('purchase_orders')
		.select('*')
		.eq('id', validatedData.purchase_order_id)
		.single();

	if (fetchError) throw fetchError;

	// Update received quantities
	const updatedItems = currentPO.items.map(
		(item: { product_id: string; quantity_received?: number; quantity_ordered: number }) => {
			const receivedItem = validatedData.items.find((ri) => ri.product_id === item.product_id);
			if (receivedItem) {
				return {
					...item,
					quantity_received: (item.quantity_received || 0) + receivedItem.quantity_received
				};
			}
			return item;
		}
	);

	// Determine new status
	const allReceived = updatedItems.every(
		(item: { quantity_received?: number; quantity_ordered: number }) =>
			(item.quantity_received || 0) >= item.quantity_ordered
	);
	const someReceived = updatedItems.some(
		(item: { quantity_received?: number }) => (item.quantity_received || 0) > 0
	);

	let newStatus = currentPO.status;
	if (allReceived) {
		newStatus = 'received';
	} else if (someReceived) {
		newStatus = 'partially_received';
	}

	// Update PO
	const { data: updatedPO, error } = await supabase
		.from('purchase_orders')
		.update({
			status: newStatus,
			items: updatedItems,
			actual_delivery_date: validatedData.received_date || new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.eq('id', validatedData.purchase_order_id)
		.select()
		.single();

	if (error) throw error;

	// Create inventory movements for received items
	for (const receivedItem of validatedData.items) {
		if (receivedItem.quantity_received > 0) {
			await supabase.from('inventory_movements').insert({
				product_id: receivedItem.product_id,
				movement_type: 'in',
				transaction_type: 'purchase',
				quantity: receivedItem.quantity_received,
				unit_cost: receivedItem.unit_cost,
				reference_id: validatedData.purchase_order_id,
				reference_type: 'purchase_order',
				notes: receivedItem.notes || `Received from PO ${currentPO.po_number}`,
				user_id: user.id,
				created_at: new Date().toISOString()
			});
		}
	}

	return {
		id: updatedPO.id,
		po_number: updatedPO.po_number,
		supplier_id: updatedPO.supplier_id,
		status: updatedPO.status,
		order_date: updatedPO.order_date,
		expected_delivery_date: updatedPO.expected_delivery_date,
		total_amount: updatedPO.total_amount,
		notes: updatedPO.notes,
		items: updatedPO.items,
		tax_amount: updatedPO.tax_amount,
		created_by: updatedPO.created_by,
		shipping_cost: updatedPO.shipping_cost,
		created_at: updatedPO.created_at,
		updated_at: updatedPO.updated_at
	};
}

// Telefunc to get purchase order statistics
export async function onGetPurchaseOrderStats(): Promise<PurchaseOrderStats> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const supabase = createSupabaseClient();

	const { data: orders, error } = await supabase
		.from('purchase_orders')
		.select('status, total_amount');

	if (error) throw error;

	const stats = orders?.reduce(
		(acc, order) => {
			acc.total_orders++;
			acc.total_value += order.total_amount;

			switch (order.status) {
				case 'draft':
					acc.draft_count++;
					break;
				case 'sent':
					acc.sent_count++;
					acc.sent_value += order.total_amount;
					break;
				case 'confirmed':
					acc.confirmed_count++;
					acc.confirmed_value += order.total_amount;
					break;
				case 'partially_received':
					acc.partially_received_count++;
					break;
				case 'received':
					acc.received_count++;
					acc.received_value += order.total_amount;
					break;
				case 'cancelled':
					acc.cancelled_count++;
					break;
			}

			return acc;
		},
		{
			total_orders: 0,
			draft_count: 0,
			sent_count: 0,
			confirmed_count: 0,
			partially_received_count: 0,
			received_count: 0,
			cancelled_count: 0,
			total_value: 0,
			sent_value: 0,
			confirmed_value: 0,
			received_value: 0,
			avg_order_value: 0
		}
	) || {
		total_orders: 0,
		draft_count: 0,
		sent_count: 0,
		confirmed_count: 0,
		partially_received_count: 0,
		received_count: 0,
		cancelled_count: 0,
		total_value: 0,
		sent_value: 0,
		confirmed_value: 0,
		received_value: 0,
		avg_order_value: 0
	};

	// Get suppliers count
	const { count: suppliersCount } = await supabase
		.from('suppliers')
		.select('*', { count: 'exact', head: true });

	return {
		...stats,
		avg_order_value: stats.total_orders > 0 ? stats.total_value / stats.total_orders : 0,
		suppliers_count: suppliersCount || 0
	};
}
