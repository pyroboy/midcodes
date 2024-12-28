import { z } from 'zod';

// Status Enums
export const locationStatusEnum = z.enum(['VACANT', 'OCCUPIED', 'RESERVED']);
export const propertyStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const maintenanceStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const leaseStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED']);
export const leaseTypeEnum = z.enum(['BEDSPACER', 'PRIVATEROOM']);

// Property Schema
export const propertyBasicSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Property name is required')
});

// Floor Schema
export const floorBasicSchema = z.object({
  id: z.number(),
  property_id: z.number(),
  floor_number: z.number(),
  wing: z.string().optional()
});

// Base Room Schema without refinement
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
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  
  // Nested relations
  property: propertyBasicSchema,
  floor: floorBasicSchema,
  
  // Optional extended information
  current_lease: z.object({
    id: z.number(),
    status: leaseStatusEnum,
    type: leaseTypeEnum,
    start_date: z.string(),
    end_date: z.string(),
    rent_amount: z.number(),
    security_deposit: z.number()
  }).optional(),
  
  maintenance_status: z.object({
    has_pending: z.boolean().default(false),
    last_maintenance: z.object({
      id: z.number(),
      title: z.string(),
      status: maintenanceStatusEnum,
      completed_at: z.string().optional()
    }).optional()
  }).optional(),

  occupancy_history: z.array(z.object({
    start_date: z.string(),
    end_date: z.string().optional(),
    status: locationStatusEnum,
    lease_id: z.number().optional()
  })).optional()
});

// Room Schema with refinement
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

// Room Search/Filter Parameters Schema
export const roomFilterSchema = z.object({
  property_id: z.number().optional(),
  floor_id: z.number().optional(),
  status: locationStatusEnum.optional(),
  type: z.string().optional(),
  min_capacity: z.number().optional(),
  max_capacity: z.number().optional(),
  min_rate: z.number().optional(),
  max_rate: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  available_from: z.string().optional(),
  available_to: z.string().optional()
});

// Room Update Schema - Using baseRoomSchema to allow partial
export const roomUpdateSchema = baseRoomSchema.partial().extend({
  id: z.number()
});

// Room Creation Result Schema - Using baseRoomSchema to allow extend
export const roomCreationResultSchema = baseRoomSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string().optional()
});

// Type exports
export type Property = z.infer<typeof propertyBasicSchema>;
export type Floor = z.infer<typeof floorBasicSchema>;
export type Room = z.infer<typeof roomSchema>;
export type RoomFilter = z.infer<typeof roomFilterSchema>;
export type RoomUpdate = z.infer<typeof roomUpdateSchema>;
export type RoomCreationResult = z.infer<typeof roomCreationResultSchema>;

// Schema type exports
export type PropertySchema = typeof propertyBasicSchema;
export type FloorSchema = typeof floorBasicSchema;
export type RoomSchema = typeof roomSchema;
export type RoomFilterSchema = typeof roomFilterSchema;
export type RoomUpdateSchema = typeof roomUpdateSchema;
export type RoomCreationResultSchema = typeof roomCreationResultSchema;