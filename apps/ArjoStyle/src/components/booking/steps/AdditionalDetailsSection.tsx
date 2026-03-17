import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdditionalDetailsSectionProps {
  formData: {
    primaryTattooStyle?: string;
    specificRequirements?: string;
    mustHaveElements?: string;
    colorPreferences?: string;
    placementNotes?: string;
  };
  handleInputChange: (field: string, value: string | number) => void;
}

const AdditionalDetailsSection: React.FC<AdditionalDetailsSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-6">
        {/* Other Detail Fields */}
        <div className="space-y-1.5">
          <Label htmlFor="specificRequirements">
            Specific Requirements / Overall Idea
          </Label>
          <Textarea
            id="specificRequirements"
            placeholder="Describe the main subject matter (e.g., lion, flower, abstract shape), concept, and any specific details unrelated to style..."
            value={formData.specificRequirements || ""}
            onChange={(e) =>
              handleInputChange("specificRequirements", e.target.value)
            }
            rows={4}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mustHaveElements">Must-Have Elements</Label>
          <Input
            id="mustHaveElements"
            placeholder="e.g., Specific flower type, a meaningful date/quote, a particular symbol"
            value={formData.mustHaveElements || ""}
            onChange={(e) =>
              handleInputChange("mustHaveElements", e.target.value)
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="colorPreferences">Color Preferences</Label>
          <Input
            id="colorPreferences"
            placeholder="e.g., Black and grey only, vibrant blues and purples, pops of red"
            value={formData.colorPreferences || ""}
            onChange={(e) =>
              handleInputChange("colorPreferences", e.target.value)
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="placementNotes">Placement Notes</Label>
          <Textarea
            id="placementNotes"
            placeholder="Any specific notes about placement? e.g., 'Avoid stretch marks on stomach', 'Integrate with existing tattoo on left shoulder', 'Curve with muscle flow'"
            value={formData.placementNotes || ""}
            onChange={(e) =>
              handleInputChange("placementNotes", e.target.value)
            }
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetailsSection;
