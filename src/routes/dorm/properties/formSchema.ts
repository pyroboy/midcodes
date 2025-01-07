import { z } from 'zod';

// Property status enum matching the database
export const PropertyStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

// Property types
export const PropertyType = {
  DORMITORY: 'DORMITORY',
  APARTMENT: 'APARTMENT',
  BOARDING_HOUSE: 'BOARDING_HOUSE'
} as const;

// Form schema for property
export const propertySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  type: z.nativeEnum(PropertyType, {
    required_error: 'Property type is required',
    invalid_type_error: 'Invalid property type'
  }),
  status: z.nativeEnum(PropertyStatus).default('ACTIVE'),
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
  type: keyof typeof PropertyType;
  status: keyof typeof PropertyStatus;
  created_at: string;
  updated_at: string | null;
}

// Type for the property with counts
export interface PropertyWithCounts extends Property {
  floor_count: number;
  rental_unit_count: number;
}

// Helper function to validate property data
export function validateProperty(data: unknown): PropertyFormData {
  return propertySchema.parse(data);
}

// Helper function to prepare data for insert/update
export function preparePropertyData(data: PropertyFormData): Omit<PropertyFormData, 'id' | 'created_at' | 'updated_at'> {
  const { id, created_at, updated_at, ...propertyData } = data;
  return propertyData;
}
