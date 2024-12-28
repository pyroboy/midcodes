import { z } from 'zod';

export const locationStatusEnum = z.enum(['VACANT', 'OCCUPIED', 'RESERVED']);
export const propertyStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const maintenanceStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const leaseStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED']);
export const leaseTypeEnum = z.enum(['BEDSPACER', 'PRIVATEROOM']);

export const propertyBasicSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Property name is required')
});

export const floorBasicSchema = z.object({
  id: z.number(),
  property_id: z.number(),
  floor_number: z.number(),
  wing: z.string().optional()
});

const baseRoomSchema = z.object({
  id: z.number(),
  property_id: z.number({
    required_error: 'Property selection is required',
    invalid_type_error: 'Property must be selected'
  }),
  floor_id: z.number({
    required_error: 'Floor selection is required',
    invalid_type_error: 'Floor must be selected'
  }),
  name: z.string().min(1, 'Room name is required').max(100, 'Room name is too long'),
  number: z.coerce.number({
    required_error: 'Room number is required',
    invalid_type_error: 'Room number must be a valid number'
  }).min(1, 'Room number must be positive'),
  room_status: locationStatusEnum.default('VACANT'),
  capacity: z.coerce.number({
    required_error: 'Capacity is required',
    invalid_type_error: 'Capacity must be a valid number'
  }).min(1, 'Capacity must be at least 1'),
  base_rate: z.coerce.number({
    required_error: 'Base rate is required',
    invalid_type_error: 'Base rate must be a valid number'
  }).min(0, 'Base rate cannot be negative'),
  type: z.string().min(1, 'Room type is required'),
  amenities: z.array(z.string()).default([]),
  property: propertyBasicSchema,
  floor: floorBasicSchema,
});

export const roomSchema = baseRoomSchema.superRefine((data, ctx) => {
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

export type Room = z.infer<typeof roomSchema>;