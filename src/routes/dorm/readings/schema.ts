import { z } from 'zod';

const readingSchema = z.object({
  meterId: z.number().int().positive(),
  readingValue: z.number().nonnegative(),
});

export const createSchema = (previousReadings: Record<number, { readingValue: number, readingDate: string }>, latestOverallReadingDate: string) => z.object({
  readingDate: z.string()
    .refine(date => new Date(date) >= new Date(latestOverallReadingDate), {
      message: `Reading date must be on or after the latest overall reading date (${latestOverallReadingDate})`
    }),
  meterType: z.string().min(1, "Meter type is required"),
  readings: z.array(readingSchema)
    .min(1, "At least one reading is required")
    .superRefine((readings, ctx) => {
      let allNonZeroEqual = true;
      let nonZeroReadings: { meterId: number, readingValue: number }[] = [];
      let zeroReadings: { meterId: number, readingValue: number }[] = [];

      readings.forEach((reading, index) => {
        const previousReading = previousReadings[reading.meterId];

        if (reading.readingValue === 0) {
          zeroReadings.push(reading);
        } else {
          nonZeroReadings.push(reading);
          if (previousReading) {
            if (reading.readingValue < previousReading.readingValue) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [index, 'readingValue'],
                message: `New reading for meter ${reading.meterId} must be greater than the previous reading of ${previousReading.readingValue}`
              });
            } else if (reading.readingValue !== previousReading.readingValue) {
              allNonZeroEqual = false;
            }
          }
        }
      });

      // Validate zero readings
      zeroReadings.forEach((reading, index) => {
        const previousReading = previousReadings[reading.meterId];
        if (previousReading && previousReading.readingValue !== 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'readingValue'],
            message: `Meter ${reading.meterId} has a previous non-zero reading of ${previousReading.readingValue}. New reading cannot be 0.`
          });
        }
      });

      // Check if all non-zero readings are equal to their previous readings
      if (nonZeroReadings.length > 0 && allNonZeroEqual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [],
          message: "At least one current reading must be different from its previous value"
        });
      }

      // Ensure that there's at least one non-zero reading if all readings are not zero
      if (nonZeroReadings.length === 0 && zeroReadings.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [],
          message: "At least one reading must be non-zero"
        });
      }
    }),
});

export type Schema = ReturnType<typeof createSchema>;