import { z } from 'zod';

export type meter_location_type = 'PROPERTY' | 'FLOOR' | 'ROOM';
export type meter_status = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type utility_type = 'ELECTRICITY' | 'WATER' | 'INTERNET';

export interface Reading {
  id: number;
  meter_id: number;
  reading: number;
  reading_date: string;
  created_at: string;
}

export interface Meter {
  id: number;
  name: string;
  location_type: meter_location_type;
  property_id: number | null;
  floor_id: number | null;
  rooms_id: number | null;
  type: utility_type;
  is_active: boolean;
  status: meter_status;
  initial_reading: number;
  unit_rate: number;
  notes: string | null;
  created_at: string;
  room?: {
    id: number;
    number: string;
    floor: {
      id: number;
      floor_number: number;
      wing: string | null;
      property: {
        id: number;
        name: string;
      };
    };
  };
}

export const readingSchema = z.object({
  id: z.number().optional(),
  meter_id: z.number(),
  reading: z.number().multipleOf(0.01),
  reading_date: z.string(),
  created_at: z.string()
});

export function readingFormSchema(
  previousReadings: Record<number, Reading>,
  latestOverallReadingDate: string
) {
  return z.object({
    reading_date: z
      .string()
      .min(1, 'Reading date is required')
      .refine((date: string): boolean => {
        const inputDate = new Date(date);
        const lastDate = new Date(latestOverallReadingDate);
        return inputDate >= lastDate;
      }, {
        message: `Reading date must be on or after ${latestOverallReadingDate}`,
      }),
    meter_type: z.enum(['ELECTRICITY', 'WATER', 'INTERNET']),
    location_type: z.enum(['PROPERTY', 'FLOOR', 'ROOM']),
    readings: z.array(
      z.object({
        meter_id: z.number(),
        reading_value: z
          .number()
          .min(0, 'Reading value must be greater than or equal to 0')
          .multipleOf(0.01, 'Reading value must have at most 2 decimal places')
          .superRefine((val: number, ctx: z.RefinementCtx): void => {
            const path = ctx.path;
            const meterId = path[1] as number;
            const previousReading = previousReadings[meterId];

            if (previousReading && val < previousReading.reading) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Reading value must be greater than or equal to the previous reading (${previousReading.reading})`,
                path: ctx.path
              });
            }
          })
      })
    )
  });
}

export type ReadingSchema = z.infer<typeof readingSchema>;
export type ReadingFormSchema = z.infer<ReturnType<typeof readingFormSchema>>;