import { z } from 'zod';

export const locationStatusEnum = z.enum(['VACANT', 'OCCUPIED', 'RESERVED']);
export const propertyStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const roomSchema = z.object({
  id: z.number().optional(),
  property_id: z.number(),
  floor_id: z.number(),
  name: z.string().min(1, 'Room name is required'),
  number: z.number().min(1, 'Room number is required'),
  room_status: locationStatusEnum.default('VACANT'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  base_rate: z.number().min(0, 'Rate must be 0 or greater'),
  type: z.string().min(1, 'Room type is required'),
  amenities: z.array(z.string()).default([])
});

export type RoomSchema = typeof roomSchema;

export type Room = z.infer<typeof roomSchema>;
