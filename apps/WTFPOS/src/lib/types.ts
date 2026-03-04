// ─── Floor Layout ─────────────────────────────────────────────────────────────

export type TableZone = 'main';
export type TableStatus = 'available' | 'occupied' | 'warning' | 'critical' | 'billing' | 'maintenance';
export interface Table {
	id: string;
	locationId: string; // Changed from branchId
	number: number;
	label: string;
	zone: TableZone;
	capacity: number;
	x: number;
	y: number;
	width?: number;
	height?: number;
	shape?: 'rect' | 'circle';
	status: TableStatus;
	sessionStartedAt: string | null;
	elapsedSeconds: number | null;
	currentOrderId: string | null;
	billTotal: number | null;
}

// ─── Locations ──────────────────────────────────────────────────────────────
export type LocationType = 'retail' | 'warehouse';

export interface Location {
	id: string;
	name: string;
	type: LocationType;
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
	trackInventory?: boolean; // Tier 3: Toggle whether this item deducts from Stock
	isRetail?: boolean;       // Tier 4: For barcode scanning
	meats?: string[];      // IDs of meat MenuItems included in this package
	autoSides?: string[];  // IDs of side MenuItems auto-included with this package
}

// ─── Takeout ─────────────────────────────────────────────────────────────────

export type TakeoutStatus = 'new' | 'preparing' | 'ready' | 'picked_up';

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
	notes?: string;
}

export type DiscountType = 'none' | 'senior' | 'pwd' | 'promo' | 'comp' | 'service_recovery';
export type OrderType = 'dine-in' | 'takeout';
export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'maya';

export interface Payment {
	method: PaymentMethod;
	amount: number;
}

// ─── Split Bill ──────────────────────────────────────────────────────────────

export type SplitType = 'equal' | 'by-item';

export interface SubBill {
	id: string;
	label: string;           // "Guest 1", "Guest 2", etc.
	itemIds: string[];        // OrderItem IDs assigned to this sub-bill
	subtotal: number;
	discountAmount: number;
	vatAmount: number;
	total: number;
	payment: Payment | null;  // null = unpaid
	paidAt: string | null;
}

export interface Order {
	id: string;
	locationId: string;     // Changed from branchId
	orderType: OrderType;      // 'dine-in' or 'takeout'
	customerName?: string;     // for takeout: customer name/alias
	tableId: string | null;    // null for takeout orders
	tableNumber: number | null; // null for takeout orders
	packageName: string | null;
	packageId: string | null;  // tracks active package for table card indicator
	pax: number;               // number of diners
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
	billPrinted: boolean;
	notes?: string;
	cancelReason?: 'mistake' | 'walkout' | 'write_off';
	closedBy?: string;              // staff who finalized the payment
	originalPax?: number;           // tracks original pax before mid-service changes
	leftoverPenaltyAmount?: number; // penalty for AYCE leftover waste
	pendingPaymentMethod?: PaymentMethod; // method held for delayed e-wallet confirmation
	takeoutStatus?: TakeoutStatus;  // only for takeout orders
	splitType?: SplitType;
	subBills?: SubBill[];
	printStatus?: 'pending' | 'printing' | 'success' | 'failed'; // Tier 4
}

// ─── KDS ──────────────────────────────────────────────────────────────────────

export interface KdsTicketItem {
	id: string;
	menuItemName: string;
	quantity: number;
	status: OrderItemStatus;
	weight?: number;
	category: MenuCategory;
	notes?: string;
}

export interface KdsTicket {
	orderId: string;
	tableNumber: number | null;    // null for takeout orders
	customerName?: string;         // for takeout orders
	items: KdsTicketItem[];
	createdAt: string;
	printStatus?: 'pending' | 'success' | 'failed'; // Tier 4
}
