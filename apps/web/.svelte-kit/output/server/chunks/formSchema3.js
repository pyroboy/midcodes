import { z } from "zod";
const floorStatusEnum = z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]);
const deleteFloorSchema = z.object({
  id: z.coerce.number({
    required_error: "Floor ID is required",
    invalid_type_error: "Invalid floor ID"
  }).positive("Invalid floor ID")
});
const floorSchema = z.object({
  id: z.number().optional(),
  property_id: z.coerce.number({
    required_error: "Property selection is required",
    invalid_type_error: "Property must be selected"
  }).min(1, "Property must be selected"),
  floor_number: z.coerce.number({
    required_error: "Floor number is required",
    invalid_type_error: "Floor number must be a valid number"
  }).int("Floor number must be an integer").min(1, "Floor number must be greater than 0"),
  wing: z.string().optional(),
  status: floorStatusEnum.default("ACTIVE")
});
export {
  floorStatusEnum as a,
  deleteFloorSchema as d,
  floorSchema as f
};
