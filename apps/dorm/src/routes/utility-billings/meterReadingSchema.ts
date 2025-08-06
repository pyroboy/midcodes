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

// Schema for a single meter reading with business rules
export const meterReadingSchema = z.object({
  meter_id: z.number().positive('Meter is required'),
  reading: z.number()
    .positive('Reading must be a positive number')
    .max(999999999, 'Reading value is too high (max 999,999,999)')
    .refine((val) => Number.isFinite(val) && val >= 0, {
      message: 'Reading must be a valid positive number'
    }),
  reading_date: z.string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: 'Invalid date format'
    })
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return date >= oneYearAgo && date <= oneMonthFromNow;
    }, {
      message: 'Reading date must be within the last year and not more than 1 month in the future'
    }),
  previous_reading: z.number().optional().nullable()
})
.refine((data) => {
  // Business rule: Current reading must be >= previous reading
  if (data.previous_reading !== undefined && data.previous_reading !== null) {
    return data.reading >= data.previous_reading;
  }
  return true;
}, {
  message: 'Current reading must be greater than or equal to previous reading',
  path: ['reading']
});

// Schema for batch meter readings with comprehensive validation
export const batchReadingsSchema = z.object({
  readings_json: z
    .string()
    .min(1, 'Readings data is required')
    .refine(
      (val) => {
        try {
          const parsed = JSON.parse(val);
          if (!Array.isArray(parsed)) {
            console.error('Parsed readings is not an array:', parsed);
            return false;
          }
          if (parsed.length === 0) {
            console.error('No readings provided in array');
            return false;
          }
          
          // Validate each reading with detailed logging
          const validationResults = parsed.map((reading, index) => {
            const validation = meterReadingSchema.safeParse(reading);
            if (!validation.success) {
              console.error(`Reading ${index} validation failed:`, validation.error.errors, 'Reading data:', reading);
            }
            return validation.success;
          });
          
          const allValid = validationResults.every(Boolean);
          console.log('All readings valid:', allValid, 'Results:', validationResults);
          return allValid;
        } catch (error) {
          console.error('JSON parsing error:', error, 'Value:', val);
          return false;
        }
      },
      { message: 'Invalid readings data. Please check that all readings have valid meter IDs, positive numbers, and correct dates.' }
    ),
  reading_date: z.string()
    .min(1, 'Reading date is required')
    .refine(val => {
      const parsed = Date.parse(val);
      const isValid = !isNaN(parsed);
      if (!isValid) {
        console.error('Invalid date format:', val);
      }
      return isValid;
    }, {
      message: 'Invalid date format. Please use YYYY-MM-DD format.'
    })
    .refine(val => {
      const date = new Date(val + 'T00:00:00'); // Ensure local timezone
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const isInRange = date >= oneYearAgo && date <= oneMonthFromNow;
      if (!isInRange) {
        console.error('Date out of range:', val, 'Parsed:', date, 'Range:', oneYearAgo, 'to', oneMonthFromNow);
      }
      return isInRange;
    }, {
      message: 'Reading date must be within the last year and not more than 1 month in the future'
    }),
  cost_per_unit: z.coerce.number()
    .positive('Cost per unit must be a positive number')
    .max(1000, 'Cost per unit is too high (max ₱1,000)')
    .min(0.01, 'Cost per unit must be at least ₱0.01'),
  type: z.enum(['WATER', 'ELECTRICITY', 'GAS', 'INTERNET', 'CABLE', 'OTHER']).optional()
})
.refine((data) => {
  // Additional business rule: Check for reasonable consumption limits across all readings
  try {
    const readings = JSON.parse(data.readings_json);
    const invalidReadings: string[] = [];
    
    const allValid = readings.every((reading: any) => {
      if (reading.previous_reading !== undefined && reading.previous_reading !== null) {
        const consumption = reading.reading - reading.previous_reading;
        // Flag unusually high consumption (adjust threshold as needed)
        if (consumption > 50000) {
          invalidReadings.push(`Meter ID ${reading.meter_id}: ${consumption} units`);
          return false;
        }
        if (consumption < 0) {
          invalidReadings.push(`Meter ID ${reading.meter_id}: negative consumption (${consumption})`);
          return false;
        }
      }
      return true;
    });
    
    if (!allValid) {
      console.error('Consumption validation failed for readings:', invalidReadings);
    }
    
    return allValid;
  } catch (error) {
    console.error('Error validating consumption:', error);
    return false;
  }
}, {
  message: 'One or more readings show invalid consumption. Please verify the readings.',
  path: ['readings_json']
});

export type MeterReadingSchema = typeof meterReadingSchema;
export type BatchReadingsSchema = typeof batchReadingsSchema;