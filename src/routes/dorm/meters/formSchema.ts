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
  'ROOM'
]);

// Helper function to ensure only one location ID is set based on location_type
const validateLocationConstraint = (data: any) => {
  const { location_type, property_id, floor_id, rooms_id } = data;
  
  switch (location_type) {
    case 'PROPERTY':
      return property_id != null && floor_id == null && rooms_id == null;
    case 'FLOOR':
      return floor_id != null && property_id == null && rooms_id == null;
    case 'ROOM':
      return rooms_id != null && property_id == null && floor_id == null;
    default:
      return false;
  }
};

// Base meter schema without timestamps
const baseMeterSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  location_type: locationTypeEnum,
  property_id: z.number().nullable(),
  floor_id: z.number().nullable(),
  rooms_id: z.number().nullable(),
  type: utilityTypeEnum,
  is_active: z.boolean().default(true),
  status: meterStatusEnum.default('ACTIVE'),
  initial_reading: z.number().min(0, 'Initial reading must be 0 or greater').default(0),
  unit_rate: z.number().min(0, 'Unit rate must be 0 or greater').default(0),
  notes: z.string().nullable().optional()
});

// Full meter schema with timestamps
export const meterSchema = baseMeterSchema.extend({
  created_at: z.date().optional()
}).refine(validateLocationConstraint, {
  message: "Only one location ID should be set based on the location type",
  path: ["location_type"]
});

// Schema for creating/updating a meter (without timestamps)
export const meterFormSchema = baseMeterSchema.refine(validateLocationConstraint, {
  message: "Only one location ID should be set based on the location type",
  path: ["location_type"]
});

// Query schema for GET /meters endpoint
export const meterQuerySchema = z.object({
  location_type: locationTypeEnum.optional(),
  property_id: z.number().optional(),
  floor_id: z.number().optional(),
  rooms_id: z.number().optional(),
  status: meterStatusEnum.optional(),
  type: utilityTypeEnum.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

// Schema for creating a new reading
export const readingSchema = z.object({
  meter_id: z.number(),
  reading: z.number().min(0, 'Reading must be 0 or greater'),
  reading_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  created_at: z.date().optional()
});

// Type exports
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
  rooms_id?: number;
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
