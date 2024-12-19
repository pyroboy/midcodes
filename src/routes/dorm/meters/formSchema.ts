import { z } from 'zod';

export const utilityTypeEnum = z.enum([
  'WATER',
  'ELECTRICITY',
  'GAS'
]);

export const meterStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'MAINTENANCE'
]);

export const meterSchema = z.object({
  id: z.number().optional(),
  room_id: z.number(),
  type: utilityTypeEnum,
  name: z.string().min(1, 'Name is required'),
  initial_reading: z.number().min(0, 'Initial reading must be 0 or greater'),
  unit_rate: z.number().min(0, 'Unit rate must be 0 or greater'),
  notes: z.string().optional().nullable(),
  status: meterStatusEnum.default('ACTIVE'),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid().optional().nullable()
});

export type MeterSchema = typeof meterSchema;
