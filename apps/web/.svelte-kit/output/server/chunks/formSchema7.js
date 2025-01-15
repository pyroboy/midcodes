import { z } from "zod";
const PropertyStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE"
};
const PropertyType = {
  DORMITORY: "DORMITORY",
  APARTMENT: "APARTMENT",
  BOARDING_HOUSE: "BOARDING_HOUSE"
};
const propertySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  type: z.nativeEnum(PropertyType, {
    required_error: "Property type is required",
    invalid_type_error: "Invalid property type"
  }),
  status: z.nativeEnum(PropertyStatus).default("ACTIVE"),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});
function preparePropertyData(data) {
  const { id, created_at, updated_at, ...propertyData } = data;
  return propertyData;
}
export {
  PropertyType as P,
  preparePropertyData as a,
  PropertyStatus as b,
  propertySchema as p
};
