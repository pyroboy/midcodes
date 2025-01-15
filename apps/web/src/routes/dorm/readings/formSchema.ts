import { z } from 'zod';
import type { meter_location_type, utility_type } from './schema';

export const createSchema = (latestOverallReadingDate: string) => z.object({
  reading_date: z.string()
    .min(1, "Reading date is required")
    .refine(
      (date) => {
        if (!date || date.trim() === "") return true;
        const inputDate = new Date(date);
        const lastDate = new Date(latestOverallReadingDate);
        return inputDate >= lastDate;
      },
      {
        message: `Reading date must be on or after the previous date (${latestOverallReadingDate})`
      }
    )
    .refine(
      (date) => {
        if (!date || date.trim() === "") return true;
        return new Date(date) <= new Date();
      },
      {
        message: "Reading date cannot be in the future"
      }
    ),
  meter_type: z.custom<utility_type>()
    .refine((val) => ['ELECTRICITY', 'WATER', 'INTERNET'].includes(val), {
      message: "Invalid meter type"
    }),
  location_type: z.custom<meter_location_type>()
    .refine((val) => ['PROPERTY', 'FLOOR', 'RENTAL_UNIT'].includes(val), {
      message: "Invalid location type"
    }),
  readings: z.array(z.object({
    meter_id: z.number().int().positive(),
    reading_value: z.number()
      .nonnegative("Reading value must be greater than or equal to 0")
      .multipleOf(0.01, "Reading value must have at most 2 decimal places")
  })).min(1, "At least one reading is required"),
});

export type Schema = ReturnType<typeof createSchema>;
