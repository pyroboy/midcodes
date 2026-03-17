
import React, { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FilterSectionProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export const FilterSection = ({
  title,
  children,
  isOpen,
  onToggle,
}: FilterSectionProps) => {
  return (
    <div className="mb-5 border-b border-border pb-5 last:border-0 last:pb-0 last:mb-0">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={onToggle}
      >
        <Label className="font-medium">{title}</Label>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
};
