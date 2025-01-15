import { z } from "zod";
const utilityTypeEnum = z.enum([
  "ELECTRICITY",
  "WATER",
  "INTERNET"
]);
const meterStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE"
]);
const locationTypeEnum = z.enum([
  "PROPERTY",
  "FLOOR",
  "RENTAL_UNIT"
]);
const validateLocationConstraint = (data) => {
  const { location_type, property_id, floor_id, rental_unit_id } = data;
  switch (location_type) {
    case "PROPERTY":
      return property_id != null && floor_id == null && rental_unit_id == null;
    case "FLOOR":
      return floor_id != null && property_id == null && rental_unit_id == null;
    case "RENTAL_UNIT":
      return rental_unit_id != null && property_id == null && floor_id == null;
    default:
      return false;
  }
};
const baseMeterSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  location_type: locationTypeEnum,
  property_id: z.number().nullable(),
  floor_id: z.number().nullable(),
  rental_unit_id: z.number().nullable(),
  type: utilityTypeEnum,
  is_active: z.boolean().default(true),
  status: meterStatusEnum.default("ACTIVE"),
  initial_reading: z.number().min(0, "Initial reading must be 0 or greater").default(0),
  unit_rate: z.number().min(0, "Unit rate must be 0 or greater").default(0),
  notes: z.string().nullable().optional()
});
const meterSchema = baseMeterSchema.extend({
  created_at: z.date().optional()
}).refine(validateLocationConstraint, {
  message: "Only one location ID should be set based on the location type",
  path: ["location_type"]
});
const meterFormSchema = baseMeterSchema.refine(validateLocationConstraint, {
  message: "Only one location ID should be set based on the location type",
  path: ["location_type"]
});
z.object({
  location_type: locationTypeEnum.optional(),
  property_id: z.number().optional(),
  floor_id: z.number().optional(),
  rental_unit_id: z.number().optional(),
  status: meterStatusEnum.optional(),
  type: utilityTypeEnum.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});
z.object({
  meter_id: z.number(),
  reading: z.number().min(0, "Reading must be 0 or greater"),
  reading_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  created_at: z.date().optional()
});
export {
  meterFormSchema as a,
  meterSchema as b,
  meterStatusEnum as m,
  utilityTypeEnum as u
};
