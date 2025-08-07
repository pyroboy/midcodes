export interface Property {
	id: number;
	name: string;
}

export interface Floor {
	id: number;
	property_id: number;
	floor_number: number;
	wing?: string;
	status: string;
}

export interface RentalUnit {
	id: number;
	name: string;
	type: string;
	number: number;
	capacity: number;
	base_rate: number;
	rental_unit_status: string;
	amenities: string[];
	property_id: number;
	floor_id: number;
	updated_at?: string;
}

export interface PageData {
	properties: Property[];
	floors: Floor[];
	rental_unit?: RentalUnit;
	form: any; // Replace with actual form type if available
}
