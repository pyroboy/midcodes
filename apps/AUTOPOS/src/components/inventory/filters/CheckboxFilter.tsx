
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CheckboxFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onChange: (value: string) => void;
  maxHeight?: string;
}

export const CheckboxFilter = ({
  title,
  options,
  selectedValues,
  onChange,
  maxHeight = "150px",
}: CheckboxFilterProps) => {
  return (
    <div className="mb-6">
      <Label className="text-sm font-medium">{title}</Label>
      <ScrollArea className={`mt-2 pr-4`} style={{ maxHeight }}>
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`${title.toLowerCase()}-${option}`}
                checked={selectedValues.includes(option)}
                onCheckedChange={() => onChange(option)}
              />
              <Label
                htmlFor={`${title.toLowerCase()}-${option}`}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
