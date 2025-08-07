import { z } from 'zod';

// Property status enum matching the database

export const propertyStatus = z.enum(['ACTIVE', 'INACTIVE']);
export const propertyType = z.enum(['DORMITORY', 'APARTMENT', 'BOARDING_HOUSE']);

// Form schema for property
export const propertySchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, 'Property name is required'),
	address: z.string().min(1, 'Address is required'),
	type: propertyType.default('DORMITORY'),
	status: propertyStatus.default('ACTIVE'),
	created_at: z.string().datetime().optional(),
	updated_at: z.string().datetime().optional()
});

// Type for the form data
export type PropertyFormData = z.infer<typeof propertySchema>;

// Base property interface
export interface Property {
	id: number;
	name: string;
	address: string;
	status: z.infer<typeof propertyStatus>;
	type: z.infer<typeof propertyType>;
	created_at: string;
	updated_at: string | null;
}

// Type for property data
export type PropertyData = Property;

// Helper function to validate property data
export function validateProperty(data: unknown): PropertyFormData {
	return propertySchema.parse(data);
}

// Helper function to prepare data for insert/update
export function preparePropertyData(
	data: PropertyFormData
): Omit<PropertyFormData, 'id' | 'created_at' | 'updated_at'> {
	const { id, created_at, updated_at, ...propertyData } = data;
	return propertyData;
}
