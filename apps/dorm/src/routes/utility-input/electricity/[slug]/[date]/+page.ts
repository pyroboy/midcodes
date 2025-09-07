// Type definitions for the utility input electricity route
// Route: /utility-input/electricity/[slug]/[date]

export interface PageData {
	meters: ElectricityMeter[];
	property: {
		id: number;
		name: string;
		slug: string;
	} | null;
	date: string;
	errors: string[];
	form: any;
	currentServerDate: string;
}

export interface ElectricityMeter {
	id: number;
	name: string;
	location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
	property_id: number;
	floor_id: number | null;
	rental_unit_id: number | null;
	type: 'ELECTRICITY';
	initial_reading: number;
	is_active: boolean;
	notes: string | null;
	created_at: string;
	latest_reading?: {
		value: number;
		date: string;
	};
	property?: {
		name: string;
	};
	floor?: {
		floor_number: number;
		wing?: string;
	};
	rental_unit?: {
		number: string;
	};
}
