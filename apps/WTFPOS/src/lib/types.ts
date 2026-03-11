// ─── Floor Layout ─────────────────────────────────────────────────────────────

export type TableZone = 'main';
export type TableStatus = 'available' | 'occupied' | 'warning' | 'critical' | 'billing' | 'maintenance';

export type ChairType = 'individual' | 'lounge' | 'l-shape' | 'diner' | 'none';

export interface ChairSide {
	type: ChairType;
	count: number;       // used by 'individual' and 'diner'; ignored by 'lounge'/'l-shape'
	color?: string;      // hex
	opacity?: number;    // 0–1
}

export interface ChairConfig {
	top: ChairSide;
	bottom: ChairSide;
	left: ChairSide;
	right: ChairSide;
}

export type FloorElementType =
	| 'wall' | 'divider' | 'entrance' | 'exit'
	| 'furniture' | 'bar' | 'kitchen' | 'stairs' | 'label';

export type FloorElementShape = 'rect' | 'circle' | 'line';

export interface FloorElement {
	id: string;
	locationId: string;
	type: FloorElementType;
	shape: FloorElementShape;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
	color?: string;
	opacity?: number;
	label?: string;
	updatedAt: string;
}

export interface FloorCanvasConfig {
	id: string;         // = locationId (one config per branch)
	locationId: string;
	width: number;
	height: number;
	gridSize: number;   // default 20
	updatedAt: string;
}

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
	color?: string;           // table fill color (hex)
	opacity?: number;         // 0–1
	borderRadius?: number;    // px
	borderWidth?: number;     // stroke width (px)
	rotation?: number;        // degrees
	chairConfig?: ChairConfig | null;
	status: TableStatus;
	sessionStartedAt: string | null;
	elapsedSeconds: number | null;
	currentOrderId: string | null;
	billTotal: number | null;
	updatedAt: string;
}

// ─── Locations ──────────────────────────────────────────────────────────────
export type LocationType = 'retail' | 'warehouse';

export interface Location {
	id: string;
	name: string;
	type: LocationType;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export type MenuCategory = 'packages' | 'meats' | 'sides' | 'dishes' | 'drinks' | 'service';
export type MeatProtein = 'beef' | 'pork' | 'chicken' | 'seafood' | 'other';

export interface MenuItem {
	id: string;
	name: string;
	category: MenuCategory;
	protein?: MeatProtein;
	price: number;
	childPrice?: number;      // reduced package price for children ages 6–9
	isWeightBased: boolean;
	pricePerGram?: number;
	available: boolean;
	desc?: string;
	perks?: string;
	isFree?: boolean;
	trackInventory?: boolean; // Tier 3: Toggle whether this item deducts from Stock
	isRetail?: boolean;       // Tier 4: For barcode scanning
	meats?: string[];           // IDs of meat MenuItems included in this package
	autoSides?: string[];       // IDs of side MenuItems auto-included (qty 1 each)
	scaledAutoSides?: string[]; // IDs of sides scaled by ceil(pax/6) — e.g. ice tea pitchers
	image?: string;
	updatedAt: string;
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
	childUnitPrice?: number | null; // child price for package items (ages 6–9)
	weight: number | null;
	status: OrderItemStatus;
	sentAt: string | null;
	tag: 'PKG' | 'FREE' | null;
	notes?: string;
	addedAt?: string;
}

export interface DiscountEntry {
	pax: number;
	ids: string[];
	idPhotos: string[][];
	discountPax?: number;
	discountIds?: string[];
	discountIdPhotos?: string[];
	authorizedAt?: string;
	authorizedBy?: string;
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
	pax: number;               // number of diners (adults + children + free)
	childPax?: number;         // children ages 6–9 (reduced package price)
	freePax?: number;          // children under 5 (free)
	items: OrderItem[];
	status: 'open' | 'pending_payment' | 'paid' | 'cancelled';
	discountType: DiscountType;
	discountEntries?: Partial<Record<DiscountType, DiscountEntry>>;
	discountPax?: number;   // qualifying SC/PWD persons (defaults to pax if unset)
	discountIds?: string[]; // SC/PWD ID numbers, one per qualifying person
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
	scCount?: number;               // number of Senior Citizen pax (set at table open)
	pwdCount?: number;              // number of PWD pax (set at table open)
	pendingPaymentMethod?: PaymentMethod; // method held for delayed e-wallet confirmation
	takeoutStatus?: TakeoutStatus;  // only for takeout orders
	splitType?: SplitType;
	subBills?: SubBill[];
	printStatus?: 'pending' | 'printing' | 'success' | 'failed'; // Tier 4
	discountIdPhotos?: string[]; // one photo URL per SC/PWD qualifying person (index matches discountIds)
	updatedAt: string;
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
	id: string;
	orderId: string;
	locationId: string;
	tableNumber: number | null;    // null for takeout orders
	customerName?: string;         // for takeout orders
	items: KdsTicketItem[];
	createdAt: string;
	bumpedAt: string | null;       // null = active ticket, set = history
	bumpedBy: string | null;
	printStatus?: 'pending' | 'success' | 'failed'; // Tier 4
	updatedAt: string;
}

