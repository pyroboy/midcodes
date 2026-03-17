
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface StockStatusFilterProps {
  stockStatus: string[];
  onStockStatusChange: (value: string) => void;
}

export const StockStatusFilter = ({
  stockStatus,
  onStockStatusChange,
}: StockStatusFilterProps) => {
  const stockStatusOptions = ["In Stock", "Low Stock", "Out of Stock", "Discontinued"];
  
  return (
    <div className="mb-6">
      <Label className="text-sm font-medium">Stock Status</Label>
      <div className="mt-2 space-y-2">
        {stockStatusOptions.map((status) => (
          <div key={status} className="flex items-center space-x-2">
            <Checkbox
              id={`stock-${status}`}
              checked={stockStatus.includes(status)}
              onCheckedChange={() => onStockStatusChange(status)}
            />
            <Label
              htmlFor={`stock-${status}`}
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {status}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
