// src/components/admin/DetailItem.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { displayOrDefault } from "@/lib/formatters"; // Import from new location

interface DetailItemProps {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  isBlock?: boolean;
  className?: string;
}

export const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  children,
  isBlock,
  className,
}) => (
  <div
    className={cn(
      "text-sm",
      isBlock
        ? "flex flex-col items-start mt-1"
        : "flex justify-between items-start gap-2",
      className
    )}
  >
    <span
      className={cn(
        "text-muted-foreground whitespace-nowrap flex-shrink-0",
        isBlock ? "mb-0.5 text-xs uppercase font-medium" : ""
      )}
    >
      {label}
      {!isBlock ? ":" : ""}
    </span>
    <div
      className={cn(
        "font-medium",
        isBlock
          ? "mt-0 text-left w-full whitespace-pre-wrap bg-muted/30 p-2 rounded text-sm"
          : "text-right break-words ml-auto"
      )}
    >
      {children ? children : displayOrDefault(value)}
    </div>
  </div>
);
