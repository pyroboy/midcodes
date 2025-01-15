import { z } from "zod";
const utilityBillingTypeEnum = {
  enum: {
    WATER: "WATER",
    ELECTRICITY: "ELECTRICITY",
    GAS: "GAS",
    INTERNET: "INTERNET",
    CABLE: "CABLE",
    OTHER: "OTHER"
  }
};
const utilityBillingSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  type: z.enum(Object.values(utilityBillingTypeEnum.enum)),
  cost_per_unit: z.coerce.number().positive(),
  org_id: z.string().uuid()
});
const meterBillingSchema = z.object({
  meter_id: z.number(),
  meter_name: z.string(),
  start_reading: z.number(),
  end_reading: z.number(),
  consumption: z.number(),
  total_cost: z.number(),
  tenant_count: z.coerce.number(),
  per_tenant_cost: z.number()
});
const utilityBillingCreationSchema = utilityBillingSchema.extend({
  meter_billings: z.array(meterBillingSchema)
});
export {
  utilityBillingTypeEnum as a,
  utilityBillingCreationSchema as u
};
