import { z } from 'zod';

export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

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
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at: string;
  updated_at: string | null;
}

// Extended type with property relation
export interface Rental_unit {
  id: number;
  number: string;
}

export interface FloorWithProperty extends Floor {
  property: {
    id: number;
    name: string;
  };
  rental_unit: Rental_unit[];
}
