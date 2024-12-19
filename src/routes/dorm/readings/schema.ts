import { z } from 'zod';

export interface Reading {
  id: number;
  meter_id: number;
  reading: number;
  reading_date: string;
  created_at: string;
}

export const readingSchema = z.object({
  id: z.number().optional(),
  meter_id: z.number(),
  reading: z.number(),
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
    readings: z.array(
      z.object({
        meter_id: z.number(),
        reading_value: z
          .number()
          .min(0, 'Reading value must be greater than or equal to 0')
          .transform((val: number): number => Math.round(val))
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
    ),
  });
}

export type ReadingSchema = z.infer<typeof readingSchema>;
export type ReadingFormSchema = z.infer<ReturnType<typeof readingFormSchema>>;