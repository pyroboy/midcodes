import { z } from 'zod';

export const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const floorSchema = z.object({
  id: z.number().optional(),
  property_id: z.number(),
  floor_number: z.number().int(),
  wing: z.string().optional(),
  status: floorStatusEnum
});

export type FloorSchema = typeof floorSchema;
