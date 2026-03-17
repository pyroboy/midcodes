
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AutoPartsFilterProps {
  isAutoParts: boolean;
  onAutoPartsChange: (value: boolean) => void;
}

export const AutoPartsFilter = ({
  isAutoParts,
  onAutoPartsChange,
}: AutoPartsFilterProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-parts" className="text-sm font-medium">
            Automotive Parts Only
          </Label>
          <p className="text-xs text-muted-foreground">
            Filter to show only automotive parts
          </p>
        </div>
        <Switch
          id="auto-parts"
          checked={isAutoParts}
          onCheckedChange={onAutoPartsChange}
        />
      </div>
    </div>
  );
};
