import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AgeVerificationStep } from "./steps/AgeVerificationStep";
import { TattooCalculatorStep } from "./steps/TattooCalculatorStep";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { ReferenceStep } from "./steps/ReferenceStep";
import { SchedulingStep } from "./steps/SchedulingStep";
import { ReviewStep } from "./steps/ReviewStep";
import { cn } from "@/lib/utils";
import { TattooPreviewInfo } from "./TattooPreviewInfo"; // <-- IMPORTED
import { BookingFormData } from "@/types/bookings";
import { initialFormData } from "@/data/bookingInitialData";
import { BodyPartMappings } from "@/types/mapping";
import { defaultMappings } from "@/data/defaultMappings"; // Ensure path is correct
import { isReferenceStepComplete } from "./steps/referenceStepValidation"; // NEW IMPORT

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: "age-verification", title: "Age Verification" },
  { id: "tattoo-calculator", title: "Tattoo Estimate" },

  { id: "references", title: "References & Details" },
  { id: "personal-info", title: "Personal Info" },
  { id: "scheduling", title: "Scheduling" },
  { id: "review", title: "Review & Submit" },
];

// Updated Initial State

export const BookingModal: React.FC<BookingModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  // Define min and max heights for the preview component
  const MIN_PREVIEW_HEIGHT = 80; // Equivalent to minimized height (4rem + 1rem)
  const MAX_PREVIEW_HEIGHT = 288; // Equivalent to expanded height (72 = 18rem)
  const SCROLL_TRANSITION_RANGE = 150; // Pixels of scroll over which transition occurs
  const SMOOTHING_FACTOR = 0.6; // Adjust: Lower = slower/smoother, Higher = faster/jumpier (try 0.1 to 0.4)
  const [liveBodyPartMappings, setLiveBodyPartMappings] =
    useState<BodyPartMappings>(() =>
      JSON.parse(JSON.stringify(defaultMappings))
    );
  const [editMode, setEditMode] = useState(false); // Manage editMode state here
  const [referenceGuideSeen, setReferenceGuideSeen] = useState(false);

  const markReferenceGuideAsSeen = useCallback(() => {
    console.log("Marking reference guide as seen.");
    setReferenceGuideSeen(true);
  }, []);
  // Replace binary state with continuous height state
  const [previewHeight, setPreviewHeight] = useState(MAX_PREVIEW_HEIGHT);
  const [scrollableNode, setScrollableNode] = useState<HTMLDivElement | null>(
    null
  );

  // Add debounce delay and threshold for height changes
  const lastHeightRef = useRef(MAX_PREVIEW_HEIGHT);

  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollableContentCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node !== null) {
        console.log("Scrollable content node attached via callback ref.");
        setScrollableNode(node);
      } else {
        console.log("Scrollable content node detached.");
        setScrollableNode(null);
      }
    },
    []
  );

  const isLastStep = currentStepIndex === steps.length - 1;

  // Refs for the smoothing animation
  const targetHeightRef = useRef(MAX_PREVIEW_HEIGHT); // Stores the latest calculated target
  const animationFrameRef = useRef<number | null>(null); // Stores the rAF ID

  const handleMappingUpdate = useCallback(
    (
      category: string,
      placement: string,
      update: Partial<BodyPartMappings>
    ) => {
      // Type of 'update' changed
      if (!editMode) return; // Only allow updates in edit mode

      setLiveBodyPartMappings((prevMappings) => {
        // Deep clone to avoid direct state mutation
        const newMappings = JSON.parse(JSON.stringify(prevMappings));

        // Ensure the category exists in the new mappings
        if (!newMappings[category]) {
          console.warn(
            `Category "${category}" not found while updating mapping. Initializing.`
          );
          newMappings[category] = {};
        }

        // Ensure the specific placement exists within the category
        if (!newMappings[category][placement]) {
          // Try to get default data for this placement
          const defaultPlacementData = defaultMappings[category]?.[placement];
          if (defaultPlacementData) {
            console.warn(
              `Placement "${placement}" in category "${category}" not found. Initializing from defaults.`
            );
            // Deep clone the default data to avoid shared references
            newMappings[category][placement] = JSON.parse(
              JSON.stringify(defaultPlacementData)
            );
          } else {
            // If no default exists, we cannot safely create/update it. Log error and abort.
            console.error(
              `Cannot update mapping: Default data for "${category}" -> "${placement}" not found.`
            );
            return prevMappings; // Return the previous state without changes
          }
        }

        // Merge the partial update into the specific placement's data object
        // The existing placement data is spread first, then the update overrides specific fields
        newMappings[category][placement] = {
          ...newMappings[category][placement], // Current data for this placement
          ...update, // Apply the partial changes
        };

        // Return the updated mappings object
        return newMappings;
      });
    },
    [editMode] // Dependency array includes editMode
    // Note: defaultMappings is stable, usually doesn't need to be in deps unless it could change at runtime
  );

  const smoothUpdateHeight = useCallback(() => {
    // Get current state height and target height from ref
    // Use functional update form of setPreviewHeight to ensure we have the latest state value
    let currentHeight = 0; // Will be set inside setPreviewHeight
    setPreviewHeight((prevHeight) => {
      currentHeight = prevHeight;
      const target = targetHeightRef.current;
      const difference = target - currentHeight;

      // Stop the loop if we're already very close to the target
      if (Math.abs(difference) < 0.5) {
        // Use a small threshold (e.g., 0.5 pixels)
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        // Return the final rounded target height to snap cleanly
        return Math.round(target);
      }

      // Calculate the next height, moving part of the way to the target
      const nextHeight = currentHeight + difference * SMOOTHING_FACTOR;

      // Continue the animation loop for the next frame
      // Ensure we only request a new frame if one isn't already pending for this loop instance
      if (animationFrameRef.current !== null) {
        // Check necessary if rAF could be cancelled elsewhere
        animationFrameRef.current = requestAnimationFrame(smoothUpdateHeight);
      }

      // Return the calculated intermediate height (keep it float for now)
      return nextHeight;
    });
  }, [SMOOTHING_FACTOR /* setPreviewHeight is stable */]);

  // --- Scroll Handler - Calculates Target and Starts Animation (Refined) ---
  const handleScroll = useCallback(() => {
    const node = scrollableNode;
    // Only run on step 1
    if (!node || currentStepIndex !== 1) {
      // If scrolling stops on a different step, cancel any pending animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        // Optionally reset target height if needed when leaving the step
        // targetHeightRef.current = MAX_PREVIEW_HEIGHT;
      }
      return;
    }

    // Calculate the target based on current scroll
    const { scrollTop } = node;
    let newTargetHeight: number;

    // Determine Target Height (same logic as before)
    if (scrollTop <= 0) {
      newTargetHeight = MAX_PREVIEW_HEIGHT;
    } else if (scrollTop >= SCROLL_TRANSITION_RANGE) {
      newTargetHeight = MIN_PREVIEW_HEIGHT;
    } else {
      const scrollProgress = scrollTop / SCROLL_TRANSITION_RANGE;
      const interpolatedHeight =
        MAX_PREVIEW_HEIGHT -
        scrollProgress * (MAX_PREVIEW_HEIGHT - MIN_PREVIEW_HEIGHT);
      // Keep target as float for potentially smoother calculation within the loop
      newTargetHeight = interpolatedHeight;
    }

    // Update the target height ref
    targetHeightRef.current = newTargetHeight;

    // Start the smoothing animation loop if it's not already running.
    // This ensures that even small changes to the target will keep the
    // animation loop going until the target is reached.
    if (animationFrameRef.current === null) {
      console.log("Starting animation loop from handleScroll"); // Add log for debugging
      animationFrameRef.current = requestAnimationFrame(smoothUpdateHeight);
    }
    // No need for an 'else' block, the running loop will pick up the new targetHeightRef.value automatically on its next iteration.
  }, [
    scrollableNode,
    currentStepIndex,
    smoothUpdateHeight,
    MAX_PREVIEW_HEIGHT, // Add constants as dependencies
    MIN_PREVIEW_HEIGHT,
    SCROLL_TRANSITION_RANGE,
  ]);

  useEffect(() => {
    // Clean up the animation frame when the component unmounts
    // or when the dependencies for the scroll handler change in a way
    // that requires a reset.
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs on unmount

  const scrollToTop = useCallback(() => {
    if (scrollableNode) {
      if (scrollableNode.scrollTop !== 0) {
        console.log("Executing scrollableNode.scrollTop = 0");
        scrollableNode.scrollTop = 0;
      }
    } else {
      console.warn("scrollToTop called but scrollableNode is null");
    }
  }, [scrollableNode]);

  const resetModalState = useCallback(() => {
    console.log("Resetting modal state.");
    setFormData(initialFormData);
    setCurrentStepIndex(0);
    setIsTransitioning(false);
    setPreviewHeight(MAX_PREVIEW_HEIGHT); // Reset to fully expanded
    lastHeightRef.current = MAX_PREVIEW_HEIGHT; // Reset the height reference
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    // if (scrollableNode) {
    //   scrollableNode.scrollTop = 0;
    // }
  }, [MAX_PREVIEW_HEIGHT]);

  const changeStep = (newIndex: number) => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    setIsTransitioning(true);

    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentStepIndex(newIndex);
      requestAnimationFrame(() => {
        scrollToTop();
        setIsTransitioning(false);
      });
      transitionTimeoutRef.current = null;
    }, 150);
  };

  const isStepComplete = useCallback(
    (index: number, data: BookingFormData): boolean => {
      const isNonEmptyString = (value: string | null | undefined): boolean =>
        !!value?.trim();
      const isValidEmail = (email: string | null | undefined): boolean =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

      // --- Helper function to check if date is 18+ years ago ---
      function isEighteenOrOlder(
        dateOfBirth: string | Date | null | undefined
      ): boolean {
        if (!dateOfBirth) return false;
        let dob: Date | null = null;
        if (typeof dateOfBirth === "string") {
          const parsed = new Date(dateOfBirth);
          if (!isNaN(parsed.getTime())) dob = parsed;
        } else if (dateOfBirth instanceof Date) {
          dob = dateOfBirth;
        }
        if (!dob) return false;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        return age >= 18;
      }

      switch (index) {
        case 0: // Age Verification
          return true;
        case 1: // Tattoo Estimate
          return (
            data.size !== null &&
            data.size > 0 &&
            !!data.currentPlacement &&
            data.placementSliderTouched &&
            data.sizeSliderTouched
          );
        case 2: // References
          return isReferenceStepComplete(data);
        case 3: // Personal Info
          return (
            isNonEmptyString(data.name) &&
            isValidEmail(data.email) &&
            isNonEmptyString(data.phone) &&
            isEighteenOrOlder(data.dateOfBirth)
          );
        case 4: // Scheduling
          return (
            data.appointmentDate instanceof Date &&
            isNonEmptyString(data.appointmentTime)
          );
        case 5: // Review
          return true;
        default:
          return false;
      }
    },
    []
  );

  // --- Max Allowed Step ---
  const maxAllowedStep = useMemo(() => {
    let allowedIndex = 0;
    while (
      allowedIndex < steps.length - 1 &&
      isStepComplete(allowedIndex, formData)
    ) {
      allowedIndex++;
    }
    return allowedIndex;
  }, [formData, isStepComplete]);

  const canProceedFromCurrentStep = useMemo(() => {
    return isStepComplete(currentStepIndex, formData);
  }, [currentStepIndex, formData, isStepComplete]);

  const handleNext = () => {
    if (canProceedFromCurrentStep && currentStepIndex < steps.length - 1) {
      changeStep(currentStepIndex + 1);
    } else {
      console.warn(
        "Cannot proceed to next step. Requirements not met for step:",
        currentStepIndex,
        "Data:",
        formData
      );
    }
  };

  const handlePrevious = () => {
    // Check if we are on the first step (index 0)
    if (currentStepIndex === 0) {
      // Call the function passed via props to close the modal
      onOpenChange(false);
      // Optional: You might want to reset the state when closing,
      // although the parent component might handle this or it might reset on re-open.
      // resetModalState(); // Uncomment if you want to reset state immediately on close
    } else if (currentStepIndex > 0) {
      // If not on the first step, proceed to the previous step
      changeStep(currentStepIndex - 1);
    }
    // No need to check for isTransitioning here, as the button's disabled prop handles it
  };

  const togglePreviewHeight = useCallback(() => {
    // Only allow toggling on the relevant step (e.g., step 1)
    // if (currentStepIndex !== 1) return;

    const currentTarget = targetHeightRef.current;
    const midPoint =
      MIN_PREVIEW_HEIGHT + (MAX_PREVIEW_HEIGHT - MIN_PREVIEW_HEIGHT) / 2;
    let newTarget: number;

    // Decide the new target based on the current target
    // If it's currently small or aiming small -> go MAX
    if (currentTarget < midPoint) {
      newTarget = MAX_PREVIEW_HEIGHT;
      scrollToTop();
      // Scroll the content area to the top when maximizing
      // scrollToTop();
    } else {
      // Otherwise (it's large or aiming large) -> go MIN
      newTarget = MIN_PREVIEW_HEIGHT;
      // Optional: scroll down slightly? Let's not for now.
    }

    console.log(
      `Toggling preview height. Current Target: ${currentTarget.toFixed(
        1
      )}, New Target: ${newTarget}`
    );

    // Update the target ref immediately
    targetHeightRef.current = newTarget;

    // Ensure the animation loop is running to animate to the new target
    if (animationFrameRef.current === null) {
      // If loop wasn't running, start it
      animationFrameRef.current = requestAnimationFrame(smoothUpdateHeight);
    }
    // If the loop *was* already running, it will pick up the new targetHeightRef.value automatically on its next iteration.
  }, [
    smoothUpdateHeight,
    scrollToTop /* Add other dependencies if needed, e.g., state used inside */,
  ]);

  const handleStepClick = (index: number) => {
    if (index !== currentStepIndex && index <= maxAllowedStep) {
      changeStep(index);
    } else {
      console.warn(
        `Step click blocked: index=${index}, maxAllowedStep=${maxAllowedStep}, currentStepIndex=${currentStepIndex}`
      );
    }
  };

  const updateFormData = useCallback((data: Partial<BookingFormData>) => {
    setFormData((prevData) => ({ ...prevData, ...data }));
  }, []);

  // --- Submit Success Handler ---
  const handleSubmitSuccess = useCallback(() => {
    console.log("Booking successful, triggering modal close.");
    resetModalState();
    onOpenChange(false);
  }, [onOpenChange, resetModalState]);

  // --- Effects ---

  useEffect(() => {
    const node = scrollableNode;
    if (open && node && currentStepIndex === 1) {
      // Only attach scroll listener on tattoo calculator step
      console.log("Attaching scroll listener (modal open and node exists).");
      node.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        console.log("Removing scroll listener (cleanup).");
        if (node) {
          node.removeEventListener("scroll", handleScroll);
        }
      };
    }
    return undefined;
  }, [open, scrollableNode, handleScroll, currentStepIndex]);
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentStepIndex === 1) {
      console.log(
        "Effect[currentStepIndex]: Entered Tattoo Calculator step (1). Setting preview to MAX height and scrolling top."
      );
      // Force preview height to max
      setPreviewHeight(MAX_PREVIEW_HEIGHT);
      // Ensure scroll position is at the top using the existing utility function
      // Wrap in rAF to ensure it happens after potential DOM updates related to the step change
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }
    // Optional: Handle logic for *leaving* step 1 if needed
    // else {
    //   console.log(`Effect[currentStepIndex]: Left step 1 (currently on ${currentStepIndex}).`);
    //   // Maybe ensure height is reset if leaving? Or let scroll listener removal handle it.
    // }
  }, [currentStepIndex, MAX_PREVIEW_HEIGHT, scrollToTop]); // Dependencies

  useEffect(() => {
    if (currentStepIndex !== 1) {
      setPreviewHeight(MIN_PREVIEW_HEIGHT);
      targetHeightRef.current = MIN_PREVIEW_HEIGHT;
    }
  }, [currentStepIndex]);

  // --- Render ---
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] gap-0 flex flex-col p-0 overflow-hidden bg-background border border-border shadow-[0_0_60px_rgba(255,255,255,0.1)]">
        <DialogHeader className="sticky top-0 bg-background z-20 p-4 sm:p-6 pb-0 flex-shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Left Image - Closer to text */}
            <img
              src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1744505507/usvdknljttntfwcjzujg.webp"
              alt="Logo"
              className="absolute left-1 sm:left-2 h-8 sm:h-12 w-auto"
            />

            {/* Centered Title */}
            <DialogTitle className="text-xl sm:text-4xl font-bold text-center leading-[1]">
              <span className="uppercase tracking-[0.25em]">
                <span className="text-[1.2em]">A</span>RJO
                <span className="text-[1.2em]">S</span>TYLE
              </span>
              <br />
              <span className="tracking-[0.6em] uppercase font-light">
                TATTOO
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>
        {/* Progress Bar Container */}
        <div className="sticky top-[calc(3.5rem+1px)] sm:top-[calc(4.5rem+1px)] bg-background w-full px-4 border-b z-10 flex-shrink-0 py-2">
          {/* Progress Bar */}
          <div className="relative flex w-full h-6 gap-1 items-center">
            {steps.map((step, index) => {
              const isClickable = index <= maxAllowedStep;
              const isCompleted =
                index < currentStepIndex && isStepComplete(index, formData);
              const isActive = index === currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable || isTransitioning}
                  className={cn(
                    "flex-1 h-3 relative focus:outline-none focus:ring-2 focus:ring-primary rounded-full duration-300 group",
                    "bg-muted/40", // Base
                    isClickable && "hover:bg-muted",
                    isCompleted && "bg-primary/50",
                    isActive && "bg-primary",
                    !isClickable && "opacity-50 cursor-not-allowed"
                  )}
                  title={
                    step.title +
                    (isClickable ? "" : " (Complete previous steps)")
                  }
                  aria-label={`Go to step ${index + 1}: ${step.title}${
                    isClickable ? "" : " - Disabled"
                  }`}
                />
              );
            })}
          </div>
          {/* Step Titles */}
          <div className="hidden sm:flex justify-between text-xs text-muted-foreground mt-1">
            {steps.map((step, index) => {
              const isClickable = index <= maxAllowedStep;
              return (
                <span
                  key={step.id}
                  className={cn(
                    "flex-1 text-center px-1 truncate transition-opacity",
                    !isClickable && "opacity-50"
                  )}
                >
                  {step.title}
                </span>
              );
            })}
          </div>
        </div>
        {/* Explicit Scrollable Content Area */}
        <div
          ref={scrollableContentCallbackRef} // <-- Attach the callback ref
          className="flex-grow overflow-y-auto"
        >
          {/* --- TATTOO PREVIEW INFO RENDERED HERE --- */}
          {currentStepIndex >= 1 && (
            <div className="sticky -webkit-sticky  translate-y-0 top-0 z-10 ">
              {" "}
              {/* z-10 is good for stacking */}
              {/* Content Layer - Interactive */}
              {/* Add relative positioning and pointer-events-auto */}
              {/* A higher z-index ensures it's above the absolute background */}
              <div className=" z-20 pointer-events-auto">
                <TattooPreviewInfo
                  modelId="default-human"
                  selectedStyle={formData.primaryTattooStyle}
                  selectedCategory={formData.selectedCategory}
                  currentPlacement={formData.currentPlacement}
                  isColor={formData.isColor}
                  size={formData.size ?? undefined}
                  estimatedPrice={formData.pricing.total}
                  estimatedDuration={formData.estimatedDurationMinutes}
                  painLevel={formData.painLevel ?? 4}
                  painReason={formData.painReason}
                  priceTierLevel={formData.visualComplexityScore ?? 1}
                  previewHeight={previewHeight}
                  onToggleExpand={togglePreviewHeight}
                  editMode={editMode}
                  liveMappings={liveBodyPartMappings}
                  onMappingUpdate={handleMappingUpdate}
                />
              </div>
            </div>
          )}
          {/* ------------------------------------------ */}
          {currentStepIndex >= 1 && (
            <div
              style={{ height: `${previewHeight + 4}px` }}
              aria-hidden="true"
            />
          )}
          {/* Main Step Content Area */}
          <div
            className={cn(
              "px-4 sm:px-6 pb-0 ", // Removed top padding here as preview container has padding
              isTransitioning ? "opacity-0 blur-sm" : "opacity-100 blur-0"
            )}
          >
            {/* Render step components based on currentStepIndex */}
            {currentStepIndex === 0 && (
              <AgeVerificationStep
                formData={formData}
                updateFormData={updateFormData}
                // Pass callback to confirm age if needed
              />
            )}
            {currentStepIndex === 1 && (
              <TattooCalculatorStep
                formData={formData}
                updateFormData={updateFormData}
                liveBodyPartMappings={liveBodyPartMappings}
                // No need to pass isPreviewMinimized down if TattooCalculator doesn't render TattooPreviewInfo anymore
              />
            )}
            {currentStepIndex === 2 && (
              <ReferenceStep
                formData={formData}
                updateFormData={updateFormData}
                // --- Pass Guide Props ---
                guideSeen={referenceGuideSeen}
                markGuideAsSeen={markReferenceGuideAsSeen}
              />
            )}
            {currentStepIndex === 3 && (
              <PersonalInfoStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStepIndex === 4 && (
              <SchedulingStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStepIndex === 5 && (
              <ReviewStep
                formData={formData}
                updateFormData={updateFormData}
                onSubmitSuccess={handleSubmitSuccess}
              />
            )}

            {/* Footer Buttons (Inside the step content padding area) */}
            <div className="flex justify-between pt-6 pb-6 mt-4 border-t border-border">
              {/* Previous Button */}
              <Button
                variant="outline"
                onClick={handlePrevious}
                // Remove 'currentStepIndex === 0' from disabled condition
                disabled={isTransitioning}
                className="flex items-center gap-2 text-sm sm:text-base"
                // Add aria-label for clarity on step 0
                aria-label={
                  currentStepIndex === 0 ? "Close Booking" : "Previous Step"
                }
              >
                <ChevronLeft className="h-4 w-4" />
                {/* Optionally change text on step 0 */}
                {currentStepIndex === 0 ? "Cancel" : "Previous"}
              </Button>

              {/* Next Button */}
              {!isLastStep && (
                <Button
                  onClick={handleNext}
                  disabled={isTransitioning || !canProceedFromCurrentStep}
                  className={cn(
                    // Base styles for layout, font size, padding etc.
                    "flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2",

                    // Conditional styling based on currentStepIndex
                    currentStepIndex === 0
                      ? "bg-[#ffaa00] font-bold hover:bg-yellow-600 text-black" // Pornhub-like style for step 0
                      : "bg-primary hover:bg-primary/90 text-primary-foreground", // Default style for other steps

                    // Conditional styling for disabled state (applies regardless of step)
                    !canProceedFromCurrentStep &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  title={
                    !canProceedFromCurrentStep
                      ? "Please complete the required fields for this step"
                      : "Go to next step"
                  }
                >
                  {currentStepIndex === 0 ? "I am 18 or Older - Enter" : "Next"}
                  {currentStepIndex !== 0 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {/* Submit button is rendered within ReviewStep */}
            </div>
          </div>
          {/* End Main Step Content Area */}
        </div>
        {/* End Explicit Scrollable Content Area */}
      </DialogContent>
    </Dialog>
  );
};
