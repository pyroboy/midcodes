// Types module not present in this app; using broad types instead
// import type { InventoryItem, Supplier, SupplierPerformanceData, LowStockItem, SalesSummaryData } from '$lib/schemas/models';

// Export functions for generating inventory reports

export function exportLowStockReport(data: any[]): string {
	const headers = ['SKU', 'Name', 'Current Qty', 'Min Qty', 'Reorder Qty', 'Supplier'];
	const rows = data.map((item) => [
		item.sku,
		item.name,
		item.current_quantity.toString(),
		item.minimum_quantity.toString(),
		item.reorder_quantity.toString(),
		item.supplier_name
	]);

	return generateCSV([headers, ...rows]);
}

export function exportSupplierPerformanceReport(data: any[]): string {
	const headers = [
		'Supplier',
		'Total Orders',
		'On-Time Deliveries',
		'Quality Score',
		'Performance Score',
		'Avg Delivery Days'
	];
	const rows = data.map((supplier) => [
		supplier.supplier_name,
		supplier.total_orders.toString(),
		supplier.on_time_deliveries.toString(),
		supplier.quality_score.toFixed(2),
		supplier.performance_score.toFixed(2),
		supplier.average_delivery_days.toFixed(1)
	]);

	return generateCSV([headers, ...rows]);
}

export function exportSalesSummaryReport(data: any): string {
	const headers = ['Period', 'Total Revenue', 'Total Orders'];
	const summaryRows = [[data.period, data.total_revenue.toFixed(2), data.total_orders.toString()]];

	const itemHeaders = ['Item Name', 'Quantity Sold', 'Revenue'];
	const itemRows = data.top_selling_items.map((item: any) => [
		item.item_name,
		item.quantity_sold.toString(),
		item.revenue.toFixed(2)
	]);

	// Combine summary and detailed data
	const allRows = [
		headers,
		...summaryRows,
		[], // Empty row separator
		['Top Selling Items:'],
		itemHeaders,
		...itemRows
	];

	return generateCSV(allRows);
}

function generateCSV(rows: string[][]): string {
	return rows
		.map((row) =>
			row
				.map((cell) =>
					cell.includes(',') || cell.includes('"') || cell.includes('\n')
						? `"${cell.replace(/"/g, '""')}"`
						: cell
				)
				.join(',')
		)
		.join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

// Additional exports for compatibility
export function exportFastMovers(data: any[]): string {
	const headers = ['SKU', 'Name', 'Movement Score', 'Total Sales', 'Avg Daily Sales'];
	const rows = data.map((item) => [
		item.sku || '',
		item.name || '',
		item.movement_score?.toFixed(2) || '0',
		item.total_sales?.toString() || '0',
		item.avg_daily_sales?.toFixed(2) || '0'
	]);

	return generateCSV([headers, ...rows]);
}

export function exportSlowMovers(data: any[]): string {
	const headers = ['SKU', 'Name', 'Days Since Last Sale', 'Current Stock', 'Last Sale Date'];
	const rows = data.map((item) => [
		item.sku || '',
		item.name || '',
		item.days_since_last_sale?.toString() || 'N/A',
		item.current_stock?.toString() || '0',
		item.last_sale_date || 'N/A'
	]);

	return generateCSV([headers, ...rows]);
}

export function exportReorderReport(data: any[]): string {
	const headers = [
		'SKU',
		'Name',
		'Current Qty',
		'Reorder Level',
		'Suggested Order Qty',
		'Supplier'
	];
	const rows = data.map((item) => [
		item.sku || '',
		item.name || '',
		item.current_quantity?.toString() || '0',
		item.reorder_level?.toString() || '0',
		item.suggested_order_quantity?.toString() || '0',
		item.supplier_name || 'N/A'
	]);

	return generateCSV([headers, ...rows]);
}
