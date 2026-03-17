// src/components/booking/PainDisplaySection.tsx

import React, { useState, useEffect, useRef } from "react";
import { Zap } from "lucide-react";
// Assuming LevelIndicator is now in ui folder as per your update
import { LevelIndicator } from "./LevelIndicator"; // Corrected path if it's still local
// import { LevelIndicator } from "@/components/ui/LevelIndicator"; // Use this if it moved
import { cn } from "@/lib/utils";

interface PainInfoProps {
  painLevel: number;
  painReason?: string;
}

export const PainDisplaySection: React.FC<PainInfoProps> = ({
  painLevel,
  painReason,
}) => {
  // --- State ---
  const [showPainLevelLabel, setShowPainLevelLabel] = useState(!painReason);
  const intervalDuration = 7000; // 7 seconds
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // --- Effect for text alternation ---
  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (painReason) {
      setShowPainLevelLabel(false); // Start showing reason
      timeoutIdRef.current = setTimeout(() => {
        setShowPainLevelLabel(true); // Switch back to label
      }, intervalDuration);
    } else {
      setShowPainLevelLabel(true); // Always show label if no reason
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [painReason, intervalDuration]);

  // --- Determine indicator state based on whether the reason is showing ---
  const shouldMinimizeIndicator = painReason ? !showPainLevelLabel : false;

  return (
    // Use min-h on the root if you want to guarantee a minimum overall height,
    // but the main fix is the wrapper below.
    <div className={cn("space-y-1 flex flex-col")}>
      {/* Row for Label/Reason */}
      <div className="flex justify-between items-center text-xs flex-grow">
        {/* Container for alternating Label/Reason */}
        <div
          className={cn(
            "relative flex-grow mr-2 flex items-center min-h-10" // Keep min-h for text area stability
          )}
          aria-live="polite"
        >
          {/* Pain Level Label */}
          <span
            key="pain-label"
            className={cn(
              "absolute inset-0 flex items-center",
              "text-sm font-medium text-muted-foreground",
              "transition-opacity duration-500 ease-in-out",
              showPainLevelLabel
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            )}
          >
            <Zap
              size={14}
              className="mr-1 inline-block text-amber-500 flex-shrink-0"
            />
            Est. Pain Level:
          </span>

          {/* Pain Reason */}
          {painReason && (
            <p
              key="pain-reason"
              className={cn(
                "absolute inset-0 flex items-center",
                "text-amber-600 dark:text-amber-400 text-left",
                "leading-tight",
                "transition-opacity duration-500 ease-in-out",
                !showPainLevelLabel
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              )}
              title={painReason}
            >
              {painReason}
            </p>
          )}
        </div>
      </div>

      {/* --- Level Indicator Container (Fixed Height Wrapper) --- */}
      {/* Apply fixed height (h-6 = 1.5rem) to accommodate the non-minimized state */}
      {/* Use flex items-center to vertically center the indicator within this space */}
      <div
        className={cn(
          "flex-shrink-0",
          "h-6", // <-- KEY CHANGE: Fixed height for the wrapper
          "flex items-center" // <-- KEY CHANGE: Center indicator vertically
        )}
      >
        {/* The LevelIndicator will now be centered within the h-6 space */}
        {/* Its internal height/margin changes won't affect the wrapper's height */}
        <LevelIndicator
          level={painLevel}
          ariaLabel="Estimated Pain Level"
          minimized={shouldMinimizeIndicator}
        />
      </div>
    </div>
  );
};