import { z } from 'zod';

// Status Enums - Keeping existing and adding relevant ones
export const locationStatusEnum = z.enum(['VACANT', 'OCCUPIED', 'RESERVED']);
export const propertyStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const maintenanceStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const leaseStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED']);
export const leaseTypeEnum = z.enum(['BEDSPACER', 'PRIVATEROOM']);

// Property Schema (needed for room relationships)
export const propertyBasicSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Property name is required')
});

// Floor Schema (needed for room relationships)
export const floorBasicSchema = z.object({
  id: z.number(),
  property_id: z.number(),
  floor_number: z.number(),
  wing: z.string().optional()
});

// Room Schema - Enhanced while maintaining existing structure
export const roomSchema = z.object({
  // Existing fields - maintaining current structure
  id: z.number(),
  property_id: z.number(),
  floor_id: z.number(),
  name: z.string().min(1, 'Room name is required'),
  number: z.number().min(1, 'Room number is required'),
  room_status: locationStatusEnum.default('VACANT'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  base_rate: z.number().min(0, 'Rate must be 0 or greater'),
  type: z.string().min(1, 'Room type is required'),
  amenities: z.array(z.string()).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  
  // Nested relations for detailed room information
  property: propertyBasicSchema,
  floor: floorBasicSchema,
  
  // Optional extended information that might be needed in room operations
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
  available_from: z.string().optional(), // date in ISO format
  available_to: z.string().optional() // date in ISO format
});

// Room Update Schema - For partial updates
export const roomUpdateSchema = roomSchema.partial().extend({
  id: z.number()
});

// Room Creation Result Schema
export const roomCreationResultSchema = roomSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string().optional()
});

// Export types
export type Property = z.infer<typeof propertyBasicSchema>;
export type Floor = z.infer<typeof floorBasicSchema>;
export type Room = z.infer<typeof roomSchema>;
export type RoomFilter = z.infer<typeof roomFilterSchema>;
export type RoomUpdate = z.infer<typeof roomUpdateSchema>;
export type RoomCreationResult = z.infer<typeof roomCreationResultSchema>;

// Schema type exports for form handling - maintaining existing exports
export type PropertySchema = typeof propertyBasicSchema;
export type FloorSchema = typeof floorBasicSchema;
export type RoomSchema = typeof roomSchema;
export type RoomFilterSchema = typeof roomFilterSchema;
export type RoomUpdateSchema = typeof roomUpdateSchema;
export type RoomCreationResultSchema = typeof roomCreationResultSchema;