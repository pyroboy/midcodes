import { z } from 'zod';

export const roomStatusEnum = z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']);

export const roomSchema = z.object({
  id: z.number().optional(),
  property_id: z.number(),
  floor_id: z.number(),
  room_number: z.string().min(1, 'Room number is required'),
  room_status: roomStatusEnum,
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  rate: z.number().min(0, 'Rate must be 0 or greater'),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional()
});

export type RoomSchema = typeof roomSchema;
