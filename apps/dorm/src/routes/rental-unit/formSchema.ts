import { z } from 'zod';

export const locationStatusEnum = z.enum(['VACANT', 'OCCUPIED', 'RESERVED']);
export const propertyStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const maintenanceStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const leaseStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED']);
export const rentalUnitTypeEnum = z.enum(['BEDSPACER', 'PRIVATEROOM']);

export const propertyBasicSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Property name is required').optional()
});

export type Property = z.infer<typeof propertyBasicSchema>;

export const floorBasicSchema = z.object({
  id: z.number(),
  property_id: z.number(),
  floor_number: z.number(),
  wing: z.string().optional()
});

export type Floor = z.infer<typeof floorBasicSchema>;

const baseRental_UnitSchema = z.object({
  id: z.number(),
  property_id: z.number({
    required_error: 'Property selection is required',
    invalid_type_error: 'Property must be selected'
  }).min(1, 'Please select a property'),
  floor_id: z.number({
    required_error: 'Floor selection is required',
    invalid_type_error: 'Floor must be selected'
  }).min(1, 'Please select a floor').optional(),
  name: z.string().min(1, 'Rental_unit name is required').max(100, 'Rental_unit name is too long'),
  number: z.coerce.number({
    required_error: 'Rental_unit number is required',
    invalid_type_error: 'Rental_unit number must be a valid number'
  }).min(1, 'Rental_unit number must be positive'),
  rental_unit_status: locationStatusEnum.default('VACANT'),
  capacity: z.coerce.number({
    required_error: 'Capacity is required',
    invalid_type_error: 'Capacity must be a valid number'
  }).min(1, 'Capacity must be at least 1'),
  base_rate: z.coerce.number({
    required_error: 'Base rate is required',
    invalid_type_error: 'Base rate must be a valid number'
  }).min(0, 'Base rate cannot be negative'),
  type: z.string().min(1, 'Rental_unit type is required'),
  amenities: z.array(z.string()).default([]),
  property: propertyBasicSchema.optional(),
  floor: floorBasicSchema.optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export const rental_unitSchema = baseRental_UnitSchema.superRefine((data, ctx) => {
  if (!data.property_id || !data.floor_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Property and Floor must be selected",
      path: ["floor_id"]
    });
    return false;
  }
  return true;
});

export type Rental_unit = z.infer<typeof rental_unitSchema>;