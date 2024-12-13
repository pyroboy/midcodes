import { z } from 'zod';

export const createSchema = (latestOverallReadingDate: string) => z.object({
  readingDate: z.string()
    .refine(
      (date) => {
        if (!date || date.trim() === "") {
          return true;  // Allow empty date
        }
        return new Date(date) >= new Date(latestOverallReadingDate);
      },
      {
        message: `Reading date must be on or after the previous date (${latestOverallReadingDate})`
      }
    )
    .refine(
      (date) => {
        if (date && date.trim() !== "") {
          return new Date(date) > new Date();
        }
        return true;  // Allow empty date
      },
      {
        message: "Reading date must be in the future."
      }
    ),
  meterType: z.string().min(1, "Meter type is required"),
  readings: z.array(z.object({
    meterId: z.number().int().positive(),
    readingValue: z.coerce.number().nonnegative(),
  })).min(1, "At least one reading is required"),
});

export type Schema = ReturnType<typeof createSchema>;
