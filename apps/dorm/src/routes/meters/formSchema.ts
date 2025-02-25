import { z } from 'zod';

// Enums as defined in the database schema
export const utilityTypeEnum = z.enum([
  'ELECTRICITY',
  'WATER',
  'INTERNET'
]);

export const meterStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'MAINTENANCE'
]);

export const locationTypeEnum = z.enum([
  'PROPERTY',
  'FLOOR',
  'RENTAL_UNIT'
]);

// Helper function to ensure correct location ID is set based on location_type
const validateLocationConstraint = (data: any) => {
  const { location_type, property_id, floor_id, rental_unit_id } = data;
  
  switch (location_type) {
    case 'PROPERTY':
      return property_id != null;
    case 'FLOOR':
      return floor_id != null && rental_unit_id == null;
      return floor_id != null;
    case 'RENTAL_UNIT':
      return rental_unit_id != null;
      return rental_unit_id != null;
    default:
      return false;
  }
};

// Base meter schema with proper types
export const meterSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  location_type: locationTypeEnum,
  property_id: z.number().nullable(),
  floor_id: z.number().nullable(),
  rental_unit_id: z.number().nullable(),
  type: utilityTypeEnum,
  status: meterStatusEnum.default('ACTIVE'),
  initial_reading: z.number()
    .min(0, 'Initial reading must be 0 or greater')
    .default(0),
  unit_rate: z.number()
    .min(0, 'Unit rate must be 0 or greater')
    .default(0),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional()
}).refine(validateLocationConstraint, {
  message: "Location selection must match the selected location type",
  message: "Required location ID must be set based on the location type",
  path: ["location_type"]
});

// Schema for creating/updating a meter (without timestamps)
export const meterFormSchema = baseMeterSchema.refine(validateLocationConstraint, {
  message: "Required location ID must be set based on the location type",
  path: ["location_type"]
});

// Type exports
export type MeterFormData = z.infer<typeof meterSchema>;

// Form value types
export type FormValue = string | number | null | undefined;
export type FormSelectValue = string | null | undefined;
export type MeterSchema = typeof meterSchema;
export type MeterFormSchema = typeof meterFormSchema;
export type MeterFormData = z.infer<typeof meterFormSchema>;
export type MeterQueryParams = z.infer<typeof meterQuerySchema>;
export type ReadingFormData = z.infer<typeof readingSchema>;

// Location selection interface for UI
export interface LocationSelection {
  type: z.infer<typeof locationTypeEnum>;
  property_id?: number;
  floor_id?: number;
  rental_unit_id?: number;
}

// Display interface for UI
export interface MeterDisplay {
  id: number;
  name: string;
  type: z.infer<typeof utilityTypeEnum>;
  status: z.infer<typeof meterStatusEnum>;
  location: {
    type: z.infer<typeof locationTypeEnum>;
    details: string;
  };
  latest_reading?: {
    value: number;
    date: string;
  };
  created_at: string;
}