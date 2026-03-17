import { getContext } from 'telefunc';
import {
	createReceivingSessionSchema,
	updateReceivingSessionSchema,
	updateReceivingItemSchema,
	completeReceivingSessionSchema,
	type ReceivingSession,
	type ReceivingItem
} from '$lib/types/receiving.schema';
import type { PurchaseOrderItem } from '$lib/types/purchaseOrder.schema';
import { createSupabaseClient } from '$lib/server/db';

// Telefunc to create a new receiving session
export async function onCreateReceivingSession(
	sessionData: unknown
): Promise<ReceivingSession> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = createReceivingSessionSchema.parse(sessionData);
	const supabase = createSupabaseClient();

	// Verify purchase order exists
	const { data: po, error: poError } = await supabase
		.from('purchase_orders')
		.select('id, status, items')
		.eq('id', validatedData.purchase_order_id)
		.single();

	if (poError || !po) {
		throw new Error('Purchase order not found');
	}

	// Check if PO is in a receivable status
	if (!['approved', 'ordered', 'partially_received'].includes(po.status)) {
		throw new Error('Purchase order is not in a receivable status');
	}

	const now = new Date().toISOString();

	// Create receiving session
	const { data: newSession, error: sessionError } = await supabase
		.from('receiving_sessions')
		.insert({
			purchase_order_id: validatedData.purchase_order_id,
			carrier: validatedData.carrier,
			tracking_number: validatedData.tracking_number,
			package_condition: validatedData.package_condition,
			photos: validatedData.photos,
			notes: validatedData.notes,
			created_at: now,
			updated_at: now
		})
		.select()
		.single();

	if (sessionError) throw sessionError;

	// Create receiving items based on PO items
	const receivingItems = po.items.map((item: PurchaseOrderItem) => ({
		receiving_session_id: newSession.id,
		product_id: item.product_id,
		quantity_expected: item.quantity_ordered,
		quantity_received: item.quantity_received || 0,
		created_at: now
	}));

	if (receivingItems.length > 0) {
		const { error: itemsError } = await supabase.from('receiving_items').insert(receivingItems);
		if (itemsError) throw itemsError;
	}

	return {
		id: newSession.id,
		purchase_order_id: newSession.purchase_order_id,
		status: newSession.status,
		carrier: newSession.carrier,
		tracking_number: newSession.tracking_number,
		package_condition: newSession.package_condition,
		photos: newSession.photos,
		received_by: newSession.received_by,
		received_at: newSession.received_at,
		notes: newSession.notes,
		created_at: newSession.created_at,
		updated_at: newSession.updated_at
	};
}

// Telefunc to get receiving session by ID
export async function onGetReceivingSession(sessionId: string): Promise<ReceivingSession | null> {
	const { user } = getContext();
	if (!user) throw new Error('Not authenticated');

	const supabase = createSupabaseClient();

	const { data: session, error } = await supabase
		.from('receiving_sessions')
		.select('*')
		.eq('id', sessionId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null; // No rows returned
		throw error;
	}

	return {
		id: session.id,
		purchase_order_id: session.purchase_order_id,
		status: session.status,
		carrier: session.carrier,
		tracking_number: session.tracking_number,
		package_condition: session.package_condition,
		photos: session.photos,
		received_by: session.received_by,
		received_at: session.received_at,
		notes: session.notes,
		created_at: session.created_at,
		updated_at: session.updated_at
	};
}

// Telefunc to get receiving items for a session
export async function onGetReceivingItems(sessionId: string): Promise<ReceivingItem[]> {
	const { user } = getContext();
	if (!user) throw new Error('Not authenticated');

	const supabase = createSupabaseClient();

	const { data: items, error } = await supabase
		.from('receiving_items')
		.select(
			`*,
			product:products(id, name, sku, requires_batch_tracking)`
		)
		.eq('receiving_session_id', sessionId);

	if (error) throw error;

	return items.map((item: ReceivingItem) => ({
		id: item.id,
		receiving_session_id: item.receiving_session_id,
		product_id: item.product_id,
		quantity_expected: item.quantity_expected,
		quantity_received: item.quantity_received,
		variance: item.variance,
		batch_number: item.batch_number,
		expiration_date: item.expiration_date,
		condition: item.condition,
		notes: item.notes,
		created_at: item.created_at,
		product: item.product
	}));
}

// Telefunc to update a receiving session
export async function onUpdateReceivingSession(
	sessionId: string,
	sessionData: unknown
): Promise<ReceivingSession> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = updateReceivingSessionSchema.parse(sessionData);
	const supabase = createSupabaseClient();

	const now = new Date().toISOString();

	const { data: updatedSession, error } = await supabase
		.from('receiving_sessions')
		.update({
			...validatedData,
			updated_at: now
		})
		.eq('id', sessionId)
		.select()
		.single();

	if (error) throw error;

	return {
		id: updatedSession.id,
		purchase_order_id: updatedSession.purchase_order_id,
		status: updatedSession.status,
		carrier: updatedSession.carrier,
		tracking_number: updatedSession.tracking_number,
		package_condition: updatedSession.package_condition,
		photos: updatedSession.photos,
		received_by: updatedSession.received_by,
		received_at: updatedSession.received_at,
		notes: updatedSession.notes,
		created_at: updatedSession.created_at,
		updated_at: updatedSession.updated_at
	};
}

// Telefunc to update a receiving item
export async function onUpdateReceivingItem(
	itemId: string,
	itemData: unknown
): Promise<ReceivingItem> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = updateReceivingItemSchema.parse(itemData);
	const supabase = createSupabaseClient();

	const { data: updatedItem, error } = await supabase
		.from('receiving_items')
		.update(validatedData)
		.eq('id', itemId)
		.select(
			`*,
			product:products(id, name, sku, requires_batch_tracking)`
		)
		.single();

	if (error) throw error;

	return {
		id: updatedItem.id,
		receiving_session_id: updatedItem.receiving_session_id,
		product_id: updatedItem.product_id,
		quantity_expected: updatedItem.quantity_expected,
		quantity_received: updatedItem.quantity_received,
		variance: updatedItem.variance,
		batch_number: updatedItem.batch_number,
		expiration_date: updatedItem.expiration_date,
		condition: updatedItem.condition,
		notes: updatedItem.notes,
		created_at: updatedItem.created_at
	};
}

// Telefunc to complete a receiving session
export async function onCompleteReceivingSession(receiveData: unknown): Promise<ReceivingSession> {
	const { user } = getContext();
	if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
		throw new Error('Not authorized - admin/manager access required');
	}

	const validatedData = completeReceivingSessionSchema.parse(receiveData);
	const supabase = createSupabaseClient();

	// Get current receiving session
	const { data: session, error: sessionError } = await supabase
		.from('receiving_sessions')
		.select(
			`*,
			purchase_order:purchase_orders(id, po_number, status, items)`
		)
		.eq('id', validatedData.receiving_session_id)
		.single();

	if (sessionError) throw sessionError;

	// Get receiving items
	const { data: receivingItems, error: itemsError } = await supabase
		.from('receiving_items')
		.select('*')
		.eq('receiving_session_id', validatedData.receiving_session_id);

	if (itemsError) throw itemsError;

	// Update received quantities in receiving items
	const updatedReceivingItems: ReceivingItem[] = [];
	for (const item of receivingItems) {
		const receivedItem = validatedData.items.find((ri) => ri.product_id === item.product_id);
		if (receivedItem) {
			const updatedItem = {
				...item,
				quantity_received: receivedItem.quantity_received,
				batch_number: receivedItem.batch_number,
				expiration_date: receivedItem.expiry_date,
				variance: receivedItem.quantity_received - item.quantity_expected
			};
			updatedReceivingItems.push(updatedItem);

			// Update in database
			await supabase
				.from('receiving_items')
				.update({
					quantity_received: receivedItem.quantity_received,
					batch_number: receivedItem.batch_number,
					expiration_date: receivedItem.expiry_date,
					variance: receivedItem.quantity_received - item.quantity_expected
				})
				.eq('id', item.id);
		}
	}

	// Update purchase order items
	const updatedPOItems = session.purchase_order.items.map((item: PurchaseOrderItem) => {
		const receivingItem = updatedReceivingItems.find((ri) => ri.product_id === item.product_id);
		if (receivingItem) {
			return {
				...item,
				quantity_received: (item.quantity_received || 0) + receivingItem.quantity_received
			};
		}
		return item;
	});

	// Determine new PO status
	const allReceived = updatedPOItems.every(
		(item: PurchaseOrderItem) => (item.quantity_received || 0) >= item.quantity_ordered
	);
	const someReceived = updatedPOItems.some((item: PurchaseOrderItem) => (item.quantity_received || 0) > 0);

	let newPOStatus = session.purchase_order.status;
	if (allReceived) {
		newPOStatus = 'received';
	} else if (someReceived) {
		newPOStatus = 'partially_received';
	}

	// Update purchase order
	const now = validatedData.received_date || new Date().toISOString();
	const { error: poError } = await supabase
		.from('purchase_orders')
		.update({
			status: newPOStatus,
			items: updatedPOItems,
			actual_delivery_date: now,
			updated_at: now
		})
		.eq('id', session.purchase_order.id)
		.select()
		.single();

	if (poError) throw poError;

	// Create inventory movements for received items
	for (const receivedItem of validatedData.items) {
		if (receivedItem.quantity_received > 0) {
			await supabase.from('inventory_movements').insert({
				product_id: receivedItem.product_id,
				movement_type: 'in',
				transaction_type: 'purchase',
				quantity: receivedItem.quantity_received,
				unit_cost: receivedItem.unit_cost,
				reference_id: session.purchase_order.id,
				reference_type: 'purchase_order',
				notes: receivedItem.notes || `Received from PO ${session.purchase_order.po_number}`,
				user_id: user.id,
				created_at: now
			});
		}
	}

	// Update receiving session status to completed
	const { data: updatedSession, error: sessionUpdateError } = await supabase
		.from('receiving_sessions')
		.update({
			status: 'completed',
			received_by: user.id,
			received_at: now,
			notes: validatedData.notes,
			updated_at: now
		})
		.eq('id', validatedData.receiving_session_id)
		.select()
		.single();

	if (sessionUpdateError) throw sessionUpdateError;

	return {
		id: updatedSession.id,
		purchase_order_id: updatedSession.purchase_order_id,
		status: updatedSession.status,
		carrier: updatedSession.carrier,
		tracking_number: updatedSession.tracking_number,
		package_condition: updatedSession.package_condition,
		photos: updatedSession.photos,
		received_by: updatedSession.received_by,
		received_at: updatedSession.received_at,
		notes: updatedSession.notes,
		created_at: updatedSession.created_at,
		updated_at: updatedSession.updated_at
	};
}
