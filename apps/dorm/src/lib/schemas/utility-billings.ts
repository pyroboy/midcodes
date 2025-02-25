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
  property_id: z.string().uuid(),
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
