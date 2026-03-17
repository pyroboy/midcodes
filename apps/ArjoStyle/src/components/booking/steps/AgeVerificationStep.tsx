import React from "react";
import { BookingFormData } from "@/types/bookings";

interface AgeVerificationStepProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const AgeVerificationStep: React.FC<AgeVerificationStepProps> = ({
  formData,
  updateFormData,
}) => {
  // Component logic remains the same if any existed

  return (
    // Use responsive padding and spacing
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Use responsive text size, margin, and max-width */}
      <div className="text-center mb-6 sm:mb-8 max-w-2xl mx-auto">
        {/* Title remains the same */}

   
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.6em] uppercase  mb-3 sm:mb-4">
       Tattoo Booking 
        </h2>
        {/* --- MODIFIED PARAGRAPH with bigger, responsive text --- */}
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
          {/* ^^^ Updated text size classes here ^^^ */}
          Welcome! This booking process will guide you in getting your custom tattoo. Since tattooing is a permanent procedure, you must be at least 18 years old. By continuing, you confirm that you meet this age requirement and understand the lasting nature of the service.
        </p>
      </div>

      {/* Add other elements here if needed, applying responsive classes */}
    </div>
  );
};