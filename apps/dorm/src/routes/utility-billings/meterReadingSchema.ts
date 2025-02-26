import { z } from 'zod';

export const utilityBillingTypeEnum = {
  enum: {
    WATER: 'WATER',
    ELECTRICITY: 'ELECTRICITY',
    GAS: 'GAS',
    INTERNET: 'INTERNET',
    CABLE: 'CABLE',
    OTHER: 'OTHER'
  }
} as const;

export const utilityBillingSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  type: z.enum(Object.values(utilityBillingTypeEnum.enum) as [string, ...string[]]),
  cost_per_unit: z.coerce.number().positive(),
  org_id: z.string().uuid(),
  property_id: z.string(), // Add property_id to the schema
});

export const meterBillingSchema = z.object({
  meter_id: z.number(),
  meter_name: z.string(),
  start_reading: z.number(),
  end_reading: z.number(),
  consumption: z.number(),
  total_cost: z.number(),
  tenant_count: z.coerce.number(),
  per_tenant_cost: z.number(),
});

export const utilityBillingCreationSchema = utilityBillingSchema.extend({
  meter_billings: z.array(meterBillingSchema),
});

// Schema for a single meter reading
export const meterReadingSchema = z.object({
  meter_id: z.number().positive('Meter is required'),
  reading: z.number().positive('Reading must be a positive number'),
  reading_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  })
});

// Schema for batch meter readings
export const batchReadingsSchema = z.object({
  readings: z.array(meterReadingSchema).min(1, 'At least one reading is required')
});

export type MeterReadingSchema = typeof meterReadingSchema;
export type BatchReadingsSchema = typeof batchReadingsSchema;