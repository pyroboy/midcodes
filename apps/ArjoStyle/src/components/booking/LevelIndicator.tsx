// src/components/ui/LevelIndicator.tsx
import React from "react";
import { cn } from "@/lib/utils"; // Assuming cn utility path

// Define props
interface LevelIndicatorProps {
  level: number;
  colorStops?: { level: number; colorClass: string }[];
  ariaLabel: string;
  showDivisions?: boolean;
  className?: string;
  minimized?: boolean;
}

// Export the component
export const LevelIndicator: React.FC<LevelIndicatorProps> = ({
  level,
  colorStops,
  ariaLabel,
  showDivisions = false, // Default showDivisions to false
  className,
  minimized = false, // Default minimized to false
}) => {
  // Validate level (1-10)
  const validLevel = Math.max(1, Math.min(10, level || 1));
  // Calculate fill percentage
  const percentage = validLevel * 10;

  // Default color stops if none provided
  const defaultPainColors: { level: number; colorClass: string }[] = [
    { level: 3, colorClass: "bg-green-500" },
    { level: 5, colorClass: "bg-yellow-400" },
    { level: 7, colorClass: "bg-orange-500" },
    { level: 10, colorClass: "bg-red-600" },
  ];

  // Function to get the correct color class based on level and stops
  const getActiveColor = (
    lvl: number,
    stops: { level: number; colorClass: string }[]
  ): string => {
    const sortedStops = [...stops].sort((a, b) => a.level - b.level);
    for (const stop of sortedStops) {
      if (lvl <= stop.level) return stop.colorClass;
    }
    return sortedStops[sortedStops.length - 1]?.colorClass || "bg-muted"; // Fallback
  };

  // Determine which color stops to use
  const colors = colorStops || defaultPainColors;

  return (
    <div
      className={cn(
        "w-full bg-muted rounded-full overflow-hidden relative",
        // Apply height/margin based on minimized state
        minimized ? "h-1.5 my-1" : "h-2.5 my-1.5",
        className // Apply additional classes
      )}
      title={`${ariaLabel}: ${validLevel}/10`} // Tooltip
    >
      {/* Filled portion of the bar */}
      <div
        className={cn(
          "h-full rounded-l-full",
          percentage >= 100 ? "rounded-r-full" : "", // Round right end if 100%
          "transition-all duration-400 ease-out", // Animate width change
          getActiveColor(validLevel, colors) // Apply dynamic color
        )}
        style={{ width: `${percentage}%` }}
        // Accessibility attributes
        role="meter"
        aria-valuenow={validLevel}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-label={ariaLabel}
      />

      {/* --- Division Lines --- */}
      {/* REVISED: Render divisions *only* based on showDivisions prop */}
      {showDivisions && (
        <>
          {/* These lines will automatically adjust height based on parent's height (h-1.5 or h-2.5) */}
          <div className="absolute inset-y-0 left-[33.33%] w-px bg-background/50 dark:bg-background/30 opacity-80"></div>
          <div className="absolute inset-y-0 left-[66.66%] w-px bg-background/50 dark:bg-background/30 opacity-80"></div>
        </>
      )}
    </div>
  );
};

// Optional: export default LevelIndicator;