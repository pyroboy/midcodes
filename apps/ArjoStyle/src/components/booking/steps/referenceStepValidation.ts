import { BookingFormData } from "@/types/bookings";
import { STYLE_OPTIONS_REQUIRING_DESCRIPTION } from "./TattooStyleOptions";

/**
 * Checks if all required fields for the Reference step are filled out.
 * - A style is selected
 * - If the selected style requires a description, it is filled
 * - The style carousel must have been touched (carouselTouched)
 */
export function isReferenceStepComplete(formData: BookingFormData): boolean {
  if (!formData.carouselTouched) return false;
  // if (!formData.referenceImages?.length) return false;
  if (!formData.primaryTattooStyle) return false;
  if (
    STYLE_OPTIONS_REQUIRING_DESCRIPTION.includes(
      formData.primaryTattooStyle || ""
    ) &&
    !formData.styleDescription?.trim()
  ) {
    return false;
  }
  return true;
}
