export interface Reading {
	id: number;
	meter_id: number;
	reading_date: string;
	reading: number;
	rate_at_reading?: number | null; // Actual database field
	meter_name?: string | null;
	created_at?: string; // Added from actual database schema
	review_status?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
	// Calculated fields (not stored in database, computed for UI)
	consumption?: number | null; // Calculated: reading - previous_reading (from window function)
	cost?: number | null; // Calculated: consumption * rate_at_reading
	previous_reading_date?: string | null; // Date of the previous reading (for UI)
	days_diff?: number | null; // Days between readings for billing period (for UI)
	period?: string | null; // Billing period (e.g., "2025-04") (for UI)
	isMonthEnd?: boolean; // Reading near end of month (day >= 20) - indicates billing period completeness
	meters?: {
		id: number;
		name: string;
		type: string;
		property_id: number;
	} | null;
}

export interface Rental_unit {
	id: number;
	name: string;
	number: string;
}

export interface Meter {
	id: number;
	name: string;
	type: string;
	initial_reading: number;
	location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
	property_id: number | null;
	floor_id: number | null;
	rental_unit_id: number | null;
	rental_unit: Rental_unit | null;
	unit: { name: string } | null;
}

export interface Property {
	id: number;
	name: string;
}

export type ShareData = {
	tenant: Tenant;
	lease: { id: number; name: string };
	share: number;
};

// Defines the filters used for the utility billings page.
export type Filters = {
	property: Property | null;
	type: string | null;
	date: string;
	search: string;
};

// Structure for meter billings
export type MeterBilling = {
	meter_id: number;
	meter_name: string;
	start_reading: number;
	end_reading: number;
	consumption: number;
	total_cost: number;
	tenant_count: number;
	per_tenant_cost: number;
};

// Structure for each meter reading entry
export type MeterReadingEntry = {
	meterId: number;
	meterName: string;
	previousReading: number | null;
	previousDate: string | null;
	currentReading: number | null;
	consumption: number | null;
	cost: number | null;
	initialReading?: number | null;
	validationError?: string | null;
};

export type FilterChangeEvent = {
	property?: number | null;
	type: string | null;
	date: string;
	search: string;
};

export type Tenant = {
	id: number;
	full_name: string;
	tenant_status?: string;
};

export type Lease = {
	id: number;
	name: string;
	rental_unit_id: number;
	status: string;
	rental_unit?: {
		id: number;
		name: string;
		number: number;
		type: string;
		floor_id: number;
		property_id: number;
	} | null;
	roomName?: string;
	tenants: Tenant[] | null;
};

export type ReadingSaveEvent = {
	readings: Array<{
		meter_id: number;
		reading: number | null;
		reading_date: string;
		consumption?: number | null;
		cost?: number | null;
	}>;
	readingDate: string;
	costPerUnit: number;
};

export type ExportEvent = {
	format: string;
	fromDate: string;
	toDate: string;
};

// New types for the consumption chart
export type ChartData = {
	label: string;
	value: number;
	color: string;
};

export type ChartDataset = {
	labels: string[];
	values: number[];
	colors: string[];
};

export type ConsumptionByType = {
	[key: string]: number;
};

export type ConsumptionTrend = {
	date: string;
	consumption: number;
};

export type ChartProps = {
	readings: Reading[];
	meters: Meter[];
	selectedType: string | null;
};

// Grouped reading structure for the table
export interface GroupedReading {
	date: string;
	properties: PropertyGroup[];
	totalConsumption: number;
	totalCost: number;
}

export interface PropertyGroup {
	propertyId: number;
	propertyName: string;
	meters: MeterData[];
	totalConsumption: number;
	totalCost: number;
}

export interface MeterData {
	meterId: number;
	meterName: string;
	meterType: string;
	unit: string;
	currentReading: number | null;
	currentReadingDate: string | null;
	lastReading: number | null;
	lastReadingDate: string | null;
	consumption: number | null;
	costPerUnit: number | null;
	totalCost: number | null;
	daysDiff?: number | null; // Days between readings for billing period
	history: Reading[];
	// Location information for filtering leases
	property_id?: number | null;
	floor_id?: number | null;
	rental_unit_id?: number | null;
	location_type?: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT' | null;
}

// Reading group structure for previous readings
export interface ReadingGroup {
	date: string;
	readings: any[];
	monthName?: string;
}
