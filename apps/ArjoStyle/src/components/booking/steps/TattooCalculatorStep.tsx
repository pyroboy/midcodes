import React, { useCallback, useMemo } from "react"; // <-- Import hooks
import TattooCalculator from "@/components/booking/TattooCalculator"; // Ensure path is correct
import { BookingFormData } from "@/types/bookings";
import { BodyPartMappings } from "@/types/mapping";
interface TattooCalculatorStepProps {
  formData: BookingFormData; // Use the specific type
  updateFormData: (data: Partial<BookingFormData>) => void; // Use the specific type
  liveBodyPartMappings: BodyPartMappings | null | undefined;
}

// Define the type for the data structure expected from TattooCalculator's onChange event.
// Ensure this matches exactly what TattooCalculator provides.
type CalculatorOnChangeData = {
  size: number; // Assuming size is always defined when onChange is called
  isColor: boolean;
  complexity: number;
  selectedCategory: string;
  placementIndex: number;
  currentPlacement: string; // Matches the prop definition in TattooCalculator
  isCoverUp: boolean;
  pricing: {
    basePriceRaw: number;
    complexityPrice: number;
    placementPrice: number;
    colorPrice: number;
    coverUpPrice: number;
    total: number;
  };
  estimatedDurationMinutes: number;
  estimatedSessions: number;
  painLevel: number;
  painReason?: string;
  visualComplexityScore: number;
  sizeSliderTouched: boolean;
  placementSliderTouched: boolean;
};

export const TattooCalculatorStep: React.FC<TattooCalculatorStepProps> = ({
  formData,
  updateFormData,
  liveBodyPartMappings,
}) => {
  // --- Stabilize onChange ---
  // Memoize the intermediate handler using useCallback.
  // Its only dependency is updateFormData, which is already stable from BookingModal.
  const handleCalculatorChange = useCallback(
    (calculatorData: CalculatorOnChangeData) => {
      // console.log("Calculator data changed:", calculatorData); // Optional debug log
      updateFormData(calculatorData); // Pass the received data up
    },
    [updateFormData] // Dependency array includes the stable updateFormData function
  );

  // --- Stabilize initialValues ---
  // Memoize the initial values object using useMemo.
  // It only recalculates if the specific formData fields change.
  const initialCalculatorValues = useMemo(
    () => ({
      // Ensure the fields match the type definition in TattooCalculatorProps
      // Provide defaults if formData values can be null/undefined but TattooCalculator expects defined values initially
      size: formData.size ?? 0, // Provide a default (e.g., 0 or based on logic) if null
      isColor: formData.isColor,
      selectedCategory: formData.selectedCategory ?? "", // Provide default if null
      placementIndex: formData.placementIndex,
      isCoverUp: formData.isCoverUp,
      sizeSliderTouched: formData.sizeSliderTouched,
      placementSliderTouched: formData.placementSliderTouched,
    }),
    [
      // List all the fields from formData used above as dependencies
      formData.size,
      formData.isColor,
      formData.selectedCategory,
      formData.placementIndex,
      formData.isCoverUp,
      formData.sizeSliderTouched,
      formData.placementSliderTouched,
    ]
  );

  return (
    <TattooCalculator
      bodyPartMappings={liveBodyPartMappings}
      initialValues={initialCalculatorValues} // Pass the memoized object
      onChange={handleCalculatorChange} // Pass the memoized function
    />
  );
};

// No changes needed in TattooCalculator.tsx itself for this stabilization.
// The existing TattooCalculator.tsx code remains the same.
