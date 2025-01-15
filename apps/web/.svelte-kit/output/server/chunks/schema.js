import { z } from "zod";
z.object({
  id: z.number().optional(),
  meter_id: z.number(),
  reading: z.number().multipleOf(0.01),
  reading_date: z.string(),
  created_at: z.string()
});
function readingFormSchema(previousReadings, latestOverallReadingDate) {
  return z.object({
    reading_date: z.string().min(1, "Reading date is required").refine((date) => {
      const inputDate = new Date(date);
      const lastDate = new Date(latestOverallReadingDate);
      return inputDate >= lastDate;
    }, {
      message: `Reading date must be on or after ${latestOverallReadingDate}`
    }),
    meter_type: z.enum(["ELECTRICITY", "WATER", "INTERNET"]),
    location_type: z.enum(["PROPERTY", "FLOOR", "RENTAL_UNIT"]),
    readings: z.array(
      z.object({
        meter_id: z.number(),
        reading_value: z.number().min(0, "Reading value must be greater than or equal to 0").multipleOf(0.01, "Reading value must have at most 2 decimal places").superRefine((val, ctx) => {
          const path = ctx.path;
          const meterId = path[1];
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
export {
  readingFormSchema as r
};
