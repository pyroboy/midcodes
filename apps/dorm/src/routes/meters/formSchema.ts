import { z } from 'zod';

// Enums as defined in the database schema
export const utilityTypeEnum = z.enum(['ELECTRICITY', 'WATER', 'INTERNET']);

export const locationTypeEnum = z.enum(['PROPERTY', 'FLOOR', 'RENTAL_UNIT']);

export const meterStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

// Define interfaces for the data structures
export interface Property {
  id: number;
  name: string;
  address: string;
  type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface Floor {
  id: number;
  property_id: number;
  floor_number: number;
  wing: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  property?: Property;
}

export interface RentalUnit {
  id: number;
  name: string;
  number: number;
  floor?: Floor;
  property_id: number;
  floor_id: number;
}

// Extended Session types
export interface UserJWTPayload {
  [key: string]: any;
}

export interface Session {
  [key: string]: any;
}

export interface User {
  [key: string]: any;
}

// Updated PageData interface
export interface PageData {
  session: Session | null | undefined;
  user: User | null | undefined;
  decodedToken: UserJWTPayload | undefined;
  properties?: Property[];
  floors?: Floor[];
  rental_units?: RentalUnit[];
  form?: any;
  [key: string]: any;
}

// Helper function to validate location constraints
const validateLocationConstraint = (data: {
  location_type?: z.infer<typeof locationTypeEnum>;
  property_id?: number | null;
  floor_id?: number | null;
  rental_unit_id?: number | null;
}) => {
  const { location_type, property_id, floor_id, rental_unit_id } = data;
  
  switch (location_type) {
    case 'PROPERTY':
      return property_id != null && floor_id == null && rental_unit_id == null;
    case 'FLOOR':
      return floor_id != null && rental_unit_id == null;
    case 'RENTAL_UNIT':
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
  path: ["location_type"]
});

// Type exports
export type MeterFormData = z.infer<typeof meterSchema>;

// Form value types
export type FormValue = string | number | null | undefined;
export type FormSelectValue = string | null | undefined;