import { z } from 'zod/v3';

export type FloorSchema = z.infer<typeof floorSchema>;

export interface Floor {
	id: number;
	property_id: number;
	floor_number: number;
	wing: string | null;
	status: string;
	created_at: string;
	updated_at: string | null;
}

export interface Property {
	id: number;
	name: string;
	address: string;
	type: string;
	status: string;
	created_at: string;
	updated_at: string | null;
}
export type FloorWithProperty = Floor & {
	property: Property | null;
	rental_unit: {
		id: number;
		number: string;
		leases: {
			id: number;
			status: string;
			lease_tenants: {
				tenant_id: number;
			}[];
		}[];
	}[];
};

export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const deleteFloorSchema = z.object({
	id: z.coerce
		.number({
			required_error: 'Floor ID is required',
			invalid_type_error: 'Invalid floor ID'
		})
		.positive('Invalid floor ID')
});

export type DeleteFloorSchema = typeof deleteFloorSchema;

export const floorSchema = z.object({
	id: z.number().optional(),
	property_id: z.coerce
		.number({
			required_error: 'A property must be associated with the floor.',
			invalid_type_error: 'Invalid property ID.'
		})
		.min(1, 'A property must be associated with the floor.'),
	floor_number: z.coerce
		.number({
			required_error: 'Floor number is required',
			invalid_type_error: 'Floor number must be a valid number'
		})
		.int('Floor number must be an integer')
		.min(1, 'Floor number must be greater than 0')
		.max(100, 'Floor number cannot exceed 100'),
	wing: z
		.string()
		.trim()
		.min(1, 'Wing name is required if provided')
		.max(50, 'Wing name cannot exceed 50 characters')
		.regex(/^[A-Za-z0-9\s-]+$/, 'Wing name can only contain letters, numbers, spaces, and hyphens')
		.optional()
		.nullable(),
	status: floorStatusEnum.default('ACTIVE')
});
