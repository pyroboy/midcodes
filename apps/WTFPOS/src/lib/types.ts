// ─── Floor Layout ─────────────────────────────────────────────────────────────

export type TableZone = 'main' | 'vip' | 'bar';
export type TableStatus = 'available' | 'occupied' | 'warning' | 'critical';

export interface Table {
	id: string;
	number: number;
	label: string;
	zone: TableZone;
	capacity: number;
	status: TableStatus;
	sessionStartedAt: string | null;
	remainingSeconds: number | null;
	currentOrderId: string | null;
	billTotal: number | null;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export type MenuCategory = 'packages' | 'meats' | 'sides' | 'dishes' | 'drinks';

export interface MenuItem {
	id: string;
	name: string;
	category: MenuCategory;
	price: number;
	isWeightBased: boolean;
	pricePerGram?: number;
	available: boolean;
	desc?: string;
	perks?: string;
	isFree?: boolean;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderItemStatus = 'pending' | 'cooking' | 'served' | 'cancelled';

export interface OrderItem {
	id: string;
	menuItemId: string;
	menuItemName: string;
	quantity: number;
	unitPrice: number;
	weight: number | null;
	status: OrderItemStatus;
	sentAt: string | null;
	tag: 'PKG' | 'FREE' | null;
}

export type DiscountType = 'none' | 'senior' | 'pwd' | 'promo';
export type PaymentMethod = 'cash' | 'card' | 'gcash';

export interface Payment {
	method: PaymentMethod;
	amount: number;
}

export interface Order {
	id: string;
	tableId: string;
	tableNumber: number;
	packageName: string | null;
	items: OrderItem[];
	status: 'open' | 'pending_payment' | 'paid' | 'cancelled';
	discountType: DiscountType;
	subtotal: number;
	discountAmount: number;
	vatAmount: number;
	total: number;
	payments: Payment[];
	createdAt: string;
	closedAt: string | null;
}

// ─── KDS ──────────────────────────────────────────────────────────────────────

export interface KdsTicketItem {
	id: string;
	menuItemName: string;
	quantity: number;
	status: OrderItemStatus;
	weight?: number;
	category: MenuCategory;
}

export interface KdsTicket {
	orderId: string;
	tableNumber: number;
	items: KdsTicketItem[];
	createdAt: string;
}
