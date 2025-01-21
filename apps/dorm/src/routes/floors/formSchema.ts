import { z } from 'zod';

export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const deleteFloorSchema = z.object({
  id: z.coerce.number({
    required_error: 'Floor ID is required',
    invalid_type_error: 'Invalid floor ID'
  }).positive('Invalid floor ID')
});

export type DeleteFloorSchema = typeof deleteFloorSchema

export const floorSchema = z.object({
  id: z.number().optional(),
  property_id: z.coerce.number({
    required_error: 'Property selection is required',
    invalid_type_error: 'Property must be selected'
  }).min(1, 'Property must be selected'),
  floor_number: z.coerce.number({
    required_error: 'Floor number is required',
    invalid_type_error: 'Floor number must be a valid number'
  }).int('Floor number must be an integer')
    .min(1, 'Floor number must be greater than 0'),
  wing: z.string().optional(),
  status: floorStatusEnum.default('ACTIVE')
});

export type FloorSchema = typeof floorSchema;

// Database types
export interface Floor {
  id: number;
  property_id: number;
  floor_number: number;
  wing: string | null;
  status: z.infer<typeof floorStatusEnum>;
  created_at: string;
  updated_at: string | null;
}

// Extended type with property relation
export interface Rental_unit {
  id: number;
  number: string;
}


export interface Property {
  id: number;
  name: string;
}
export interface FloorWithProperty extends Floor {
  property: Property;
  rental_unit: Rental_unit[];
}
