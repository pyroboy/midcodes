
import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface PriceRangeFilterProps {
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
}

export const PriceRangeFilter = ({
  priceRange,
  onPriceRangeChange,
  minPrice,
  maxPrice,
}: PriceRangeFilterProps) => {
  return (
    <div className="mb-6">
      <Label className="text-sm font-medium">Price Range</Label>
      <div className="mt-4">
        <Slider
          defaultValue={priceRange}
          min={minPrice}
          max={maxPrice}
          step={100}
          onValueChange={(value) => onPriceRangeChange(value as [number, number])}
          className="mb-2"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>${priceRange[0].toLocaleString()}</span>
          <span>${priceRange[1].toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
