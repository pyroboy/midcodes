// Database model schemas and types

export interface InventoryItem {
	id: string;
	name: string;
	sku: string;
	quantity: number;
	price: number;
	supplier_id: string;
	category: string;
	created_at: string;
	updated_at: string;
}

export interface Supplier {
	id: string;
	name: string;
	contact_email: string;
	contact_phone?: string;
	address?: string;
	performance_score: number;
	created_at: string;
	updated_at: string;
}

export interface SupplierPerformanceData {
	supplier_id: string;
	supplier_name: string;
	total_orders: number;
	on_time_deliveries: number;
	quality_score: number;
	performance_score: number;
	average_delivery_days: number;
}

export interface InventoryReport {
	id: string;
	name: string;
	type: 'low_stock' | 'supplier_performance' | 'sales_summary';
	data: any;
	generated_at: string;
	generated_by: string;
}

export interface LowStockItem {
	id: string;
	name: string;
	sku: string;
	current_quantity: number;
	minimum_quantity: number;
	reorder_quantity: number;
	supplier_name: string;
}

export interface SalesSummaryData {
	period: string;
	total_revenue: number;
	total_orders: number;
	top_selling_items: Array<{
		item_name: string;
		quantity_sold: number;
		revenue: number;
	}>;
}

export interface FastMover {
	id: string;
	sku: string;
	name: string;
	movement_score: number;
	total_sales: number;
	avg_daily_sales: number;
	category?: string;
}

export interface SlowMover {
	id: string;
	sku: string;
	name: string;
	days_since_last_sale: number;
	current_stock: number;
	last_sale_date?: string;
	category?: string;
}

export interface ReorderItem {
	id: string;
	sku: string;
	name: string;
	current_quantity: number;
	reorder_level: number;
	suggested_order_quantity: number;
	supplier_name: string;
	supplier_id: string;
	cost_per_unit?: number;
}
