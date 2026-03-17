import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingFormData } from "@/types/bookings";

interface StyleDescriptionTextareaProps {
  show: boolean;
  formData: Pick<BookingFormData, "styleDescription">;
  handleInputChange: (field: keyof BookingFormData, value: string) => void;
}

const StyleDescriptionTextarea: React.FC<StyleDescriptionTextareaProps> = ({ show, formData, handleInputChange }) => {
  if (!show) return null;
  return (
    <div className="space-y-1.5 animate-in fade-in duration-300 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-8">
      <Label htmlFor="styleDescription">Style Description (Required for Combination/Other/Custom)</Label>
      <Textarea
        id="styleDescription"
        placeholder="Please describe the style mix, custom idea, or details for 'Other' here. e.g., 'Mix of Neo-Trad lines and Watercolor shading', 'Like artist X's style', 'Geometric patterns combined with realism'."
        value={formData.styleDescription || ""}
        onChange={(e) => handleInputChange("styleDescription", e.target.value)}
        rows={4}
        required={show}
      />
      <p className="text-xs text-muted-foreground pt-1">
        Explain the combination, custom elements, or provide more detail.
      </p>
    </div>
  );
};

export default StyleDescriptionTextarea;
