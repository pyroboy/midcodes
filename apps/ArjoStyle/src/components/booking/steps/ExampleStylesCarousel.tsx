// src/components/booking/steps/ExampleStylesCarousel.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { BookingFormData } from "@/types/bookings";
import { motion, AnimatePresence } from "framer-motion";

import { STYLE_OPTIONS_REQUIRING_DESCRIPTION } from "./TattooStyleOptions";
const positiveModulo = (n: number, m: number): number => ((n % m) + m) % m;
interface ExampleStylesCarouselProps {
  styles: { name: string; exampleImage: string }[];
  currentStyle: string; // The *actual selected* style from form data
  onSelectStyle: (style: string) => void; // Callback to update the selected style in the parent/form
  formData: BookingFormData; // Needed for AdditionalDetailsSection and reading carouselTouched
  updateFormData: (data: Partial<BookingFormData>) => void; // Needed for AdditionalDetailsSection and setting carouselTouched
}
const ExampleStylesCarousel: React.FC<ExampleStylesCarouselProps> = ({
  styles,
  currentStyle,
  onSelectStyle,
  formData,
  updateFormData,
}) => {
  // Initialize based on the *actual* selected style if available, otherwise default to 0
  const initialIndex = currentStyle
    ? styles.findIndex((s) => s.name === currentStyle)
    : 0;
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const [isDragging, setIsDragging] = useState(false);
  const interactionChangedIndexRef = useRef(false);
  const isInitialMount = useRef(true);
  const dragStartRef = useRef<number | null>(null);
  const lastSwipeTriggerXRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const HOLD_DELAY_MS = 350;
  const SCROLL_INTERVAL_MS = 150;
  const SWIPE_THRESHOLD = 60; // Effect to sync internal currentIndex if external currentStyle changes

  const isStyleDescriptionRequired =
    STYLE_OPTIONS_REQUIRING_DESCRIPTION.includes(
      formData.primaryTattooStyle || ""
    );
  const isStyleDescriptionEmpty = !(formData.styleDescription || "").trim();

  const showGlow = isStyleDescriptionRequired && isStyleDescriptionEmpty; // Only glow if required, empty AND carousel touched

  useEffect(() => {
    const newIndex = styles.findIndex((s) => s.name === currentStyle);
    if (newIndex >= 0) {
      setCurrentIndex(newIndex);
    } // Only run when currentStyle or styles array changes
  }, [currentStyle, styles]); // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (buttonScrollTimeoutRef.current)
        clearTimeout(buttonScrollTimeoutRef.current);
      if (buttonScrollIntervalRef.current)
        clearInterval(buttonScrollIntervalRef.current);
    };
  }, []); // Function to potentially mark the carousel as touched (only once)
  const markCarouselTouched = useCallback(() => {
    if (!formData.carouselTouched) {
      updateFormData({ carouselTouched: true });
    }
  }, [formData.carouselTouched, updateFormData]); // *** Effect to SYNC PARENT/FORM STATE TO visual state (currentIndex) ***
  useEffect(() => {
    // Prevent running on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newlyCenteredStyle = styles[currentIndex]?.name; // If the visually centered style exists and is different from the parent's state, update the parent
    if (newlyCenteredStyle && newlyCenteredStyle !== currentStyle) {
      // console.log(`Effect updating parent: ${newlyCenteredStyle}`);
      // *** THIS IS WHERE THE UPDATE SHOULD HAPPEN ***
      // updateFormData({ primaryTattooStyle: newlyCenteredStyle });
      // OR, preferably, call the dedicated callback if it handles the update:
      onSelectStyle(newlyCenteredStyle);
    } // Dependency: runs whenever the visual index changes OR the parent state changes
  }, [currentIndex, styles, onSelectStyle, currentStyle, updateFormData]); // Added updateFormData if used directly
  const stopButtonAutoScroll = useCallback(
    (triggerSelectionUpdate: boolean = true) => {
      let wasScrolling = false;
      if (buttonScrollTimeoutRef.current) {
        clearTimeout(buttonScrollTimeoutRef.current);
        buttonScrollTimeoutRef.current = null;
      }
      if (buttonScrollIntervalRef.current) {
        clearInterval(buttonScrollIntervalRef.current);
        buttonScrollIntervalRef.current = null;
        wasScrolling = true; // Auto-scroll was active
      } // If interaction changed the index (either single click or finished scroll), // and we intend to trigger the update, call onSelectStyle
      if (triggerSelectionUpdate && interactionChangedIndexRef.current) {
        onSelectStyle(styles[currentIndex].name);
        interactionChangedIndexRef.current = false; // Reset flag
        updateFormData({ primaryTattooStyle: styles[currentIndex].name });
      } // If it was *only* an interval scroll (hold), ensure selection is updated // The simple click case is handled by the flag check above.
      else if (triggerSelectionUpdate && wasScrolling) {
        onSelectStyle(styles[currentIndex].name);
      }
    },
    [currentIndex, styles, onSelectStyle, updateFormData] // Added updateFormData dependency
  );
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || !containerRef.current) return;
      markCarouselTouched(); // Mark touched on first interaction
      stopButtonAutoScroll(false); // Stop any button scroll, but don't trigger update yet
      setIsDragging(true);
      interactionChangedIndexRef.current = false; // Reset drag change flag
      const startX = e.clientX;
      dragStartRef.current = startX;
      lastSwipeTriggerXRef.current = startX;
      containerRef.current.style.cursor = "grabbing";
      containerRef.current.style.userSelect = "none";
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [markCarouselTouched, stopButtonAutoScroll] // Removed internal form update logic
  );
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (
        !isDragging ||
        dragStartRef.current === null ||
        lastSwipeTriggerXRef.current === null
      ) {
        return;
      }
      const currentX = e.clientX;
      const dragSinceLastTrigger = currentX - lastSwipeTriggerXRef.current;
      if (Math.abs(dragSinceLastTrigger) >= SWIPE_THRESHOLD) {
        const direction = -Math.sign(dragSinceLastTrigger);
        setCurrentIndex((prevIndex) =>
          positiveModulo(prevIndex + direction, styles.length)
        );
        interactionChangedIndexRef.current = true; // Mark that drag changed the index
        lastSwipeTriggerXRef.current = currentX;
      }
    },
    [isDragging, styles.length, SWIPE_THRESHOLD]
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !containerRef.current) return;
      const endX = e.clientX;
      const dragDistance =
        dragStartRef.current !== null
          ? Math.abs(endX - dragStartRef.current)
          : 0;
      const isTap = dragDistance < 10; // Define tap threshold
      setIsDragging(false);
      dragStartRef.current = null;
      lastSwipeTriggerXRef.current = null;
      containerRef.current.style.cursor = "grab";
      containerRef.current.style.userSelect = "";
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (error) {
        /* ignore */
      } // If the drag actually changed the index, finalize the selection
      if (!isTap && interactionChangedIndexRef.current) {
        onSelectStyle(styles[currentIndex].name);
      } // If it was a tap, the onClick handler on the item itself will trigger selection // Reset the flag regardless
      interactionChangedIndexRef.current = false;
    },
    [isDragging, onSelectStyle, currentIndex, styles] // Added dependencies
  );
  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isDragging) {
        // Treat leaving while dragging as ending the drag
        handlePointerUp(e);
      }
    },
    [isDragging, handlePointerUp]
  );
  const handleButtonPointerDown = useCallback(
    (direction: number) => {
      markCarouselTouched(); // Mark touched on first interaction
      stopButtonAutoScroll(false); // Stop previous scroll without triggering update yet
      interactionChangedIndexRef.current = true; // Assume a click changes index
      setCurrentIndex((prevIndex) =>
        positiveModulo(prevIndex + direction, styles.length)
      ); // Start hold-to-scroll logic
      buttonScrollTimeoutRef.current = setTimeout(() => {
        buttonScrollIntervalRef.current = setInterval(() => {
          setCurrentIndex((prevIndex) =>
            positiveModulo(prevIndex + direction, styles.length)
          );
          interactionChangedIndexRef.current = true; // Ensure flag stays true during scroll
        }, SCROLL_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    [markCarouselTouched, stopButtonAutoScroll, styles.length]
  );
  const handleButtonPointerUpOrLeave = useCallback(() => {
    // Stop auto scroll AND trigger selection update if needed
    stopButtonAutoScroll(true);
  }, [stopButtonAutoScroll]); // --- Style calculation (No changes needed here) ---
  const getItemStyle = (itemIndex: number) => {
    // ... (keep existing style logic)
    const relativeIndex =
      positiveModulo(
        itemIndex - currentIndex + Math.floor(styles.length / 2),
        styles.length
      ) - Math.floor(styles.length / 2);
    const baseTranslateX = 55;
    const baseRotateY = 40;
    const baseScale = 0.8;
    const scaleDecrement = 0.1;
    const opacityDecrement = 0.25;
    let translateX = 0,
      rotateY = 0,
      scale = 1,
      zIndex = styles.length,
      opacity = 1,
      filter = "";
    if (relativeIndex !== 0) {
      translateX = relativeIndex * baseTranslateX;
      rotateY = -relativeIndex * baseRotateY;
      scale = Math.max(
        0,
        baseScale - Math.abs(relativeIndex) * scaleDecrement + scaleDecrement
      );
      zIndex = styles.length - Math.abs(relativeIndex);
      opacity = Math.max(0, 1 - Math.abs(relativeIndex) * opacityDecrement);
      if (Math.abs(relativeIndex) > 0) {
        filter = `blur(${Math.min(Math.abs(relativeIndex) * 1, 4)}px)`;
      }
    }
    if (Math.abs(relativeIndex) > 2) {
      opacity = 0;
      scale = 0.6;
      filter = "blur(4px)";
    }
    return {
      transform: `translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`,
      zIndex,
      opacity,
      filter,
    };
  };
  const currentCenterStyleName = styles[currentIndex]?.name ?? "Select Style"; // --- JSX Structure (Minor adjustments for clarity) ---
  return (
    <div className="w-full mb-2 flex flex-col items-center relative">
      {" "}
      {/* Style Info Header - Displays the *visually centered* style name */}{" "}
      <div className="flex items-center justify-between w-full gap-4 px-4 py-2  rounded-lg shadow-sm transition-colors">
        {" "}
        <div className="flex flex-col overflow-hidden">
          {" "}
          <p className="text-lg sm:text-xl font-medium text-zinc-800 dark:text-zinc-100 truncate">
            Tattoo Style{" "}
          </p>{" "}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
            {currentCenterStyleName} {/* Display name of centered item */}{" "}
          </p>{" "}
        </div>{" "}
        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap shrink-0 bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded-md">
          {currentIndex + 1} / {styles.length}{" "}
        </span>{" "}
      </div>
      {/* Perspective container & Interaction Area */}{" "}
      <div
        ref={containerRef}
        className="relative w-full h-48 flex items-center justify-center touch-none select-none overflow-hidden "
        style={{
          perspective: "1200px",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave} // Use combined leave/up handler for drag end
      >
        {/* Carousel Track */}{" "}
        <div
          className="relative w-48 h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {" "}
          {styles.map((style, index) => {
            const itemStyle = getItemStyle(index); // isSelected uses the prop (actual form value)
            const isSelected = style.name === currentStyle; // isCenter uses the local state (visual center)
            const isCenter = index === currentIndex;
            return (
              <div
                key={style.name}
                className={cn(
                  "carousel-item absolute top-0 left-0 w-full",
                  "transition-all duration-500 ease-out", // Only the visually centered item should be interactive
                  isCenter
                    ? "pointer-events-auto cursor-pointer"
                    : "pointer-events-none"
                )}
                style={{ ...itemStyle, backfaceVisibility: "hidden" }} // Explicit click/tap on the center item directly calls onSelectStyle
                onClick={(e) => {
                  if (isCenter) {
                    e.stopPropagation();
                    onSelectStyle(style.name); // Reset interaction flag as this is an explicit selection
                    interactionChangedIndexRef.current = false;
                  }
                }}
                aria-selected={isSelected} // Reflects actual selection state
                tabIndex={isCenter ? 0 : -1}
                onKeyDown={(e) => {
                  if (isCenter && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelectStyle(style.name); // Explicit selection
                    interactionChangedIndexRef.current = false;
                  }
                }}
              >
                {/* Image Container */}{" "}
                <div
                  className={cn(
                    "relative rounded-lg overflow-hidden w-full h-48 transition-all duration-300 ease-in-out", // Highlight based on *actual* selection (currentStyle prop)
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background dark:ring-offset-zinc-900 shadow-lg"
                      : "ring-1 ring-zinc-300 dark:ring-zinc-700 shadow-md"
                  )}
                >
                  {" "}
                  <img
                    src={style.exampleImage}
                    alt={style.name}
                    className="w-full h-full object-cover"
                    draggable="false"
                    style={{
                      // Style adjustments can still differentiate center vs selected
                      filter: isSelected
                        ? "brightness(1)"
                        : isCenter
                        ? "brightness(0.9)"
                        : "brightness(0.8)", // Example: Slightly dim center if not selected, dim others more
                    }}
                  />{" "}
                  {/* Show name only on the VISUALLY CENTERED item */}{" "}
                  {isCenter && (
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 text-center pointer-events-none p-3 pt-6 text-sm font-semibold truncate", // Style name based on whether the centered item is also the selected one
                        isSelected
                          ? "bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white" // Prominent for selected
                          : "bg-gradient-to-t from-black/50 to-transparent text-white/70 text-xs pt-4" // Fainter for centered but not selected
                      )}
                    >
                      {style.name}{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>
            );
          })}{" "}
        </div>
        {/* Navigation Buttons */}{" "}
        <div className="absolute top-1/2 left-1 sm:left-2 transform -translate-y-1/2 z-20">
          {" "}
          <button
            className={cn(
              "bg-background/60 dark:bg-zinc-900/60 text-foreground/80 dark:text-zinc-200",
              "rounded-full p-2.5 shadow-md backdrop-blur-sm border border-black/10 dark:border-white/10",
              "hover:bg-background/80 dark:hover:bg-zinc-900/80 hover:text-foreground",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-zinc-900",
              "transition-colors duration-150"
            )}
            onPointerDown={(e) => {
              e.stopPropagation(); // Prevent container drag
              handleButtonPointerDown(-1);
            }}
            onPointerUp={handleButtonPointerUpOrLeave}
            onPointerLeave={handleButtonPointerUpOrLeave} // Use combined handler
            aria-label="Previous style (hold to scroll)"
          >
            {/* SVG Left Arrow */}{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 pointer-events-none"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />{" "}
            </svg>{" "}
          </button>{" "}
        </div>{" "}
        <div className="absolute top-1/2 right-1 sm:right-2 transform -translate-y-1/2 z-20">
          {" "}
          <button
            className={cn(
              "bg-background/60 dark:bg-zinc-900/60 text-foreground/80 dark:text-zinc-200",
              "rounded-full p-2.5 shadow-md border border-black/10 dark:border-white/10 backdrop-blur-sm", // Added backdrop-blur
              "hover:bg-background/80 dark:hover:bg-zinc-900/80 hover:text-foreground",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-zinc-900",
              "transition-colors duration-150"
            )}
            onPointerDown={(e) => {
              e.stopPropagation(); // Prevent container drag
              handleButtonPointerDown(1);
            }}
            onPointerUp={handleButtonPointerUpOrLeave}
            onPointerLeave={handleButtonPointerUpOrLeave} // Use combined handler
            aria-label="Next style (hold to scroll)"
          >
            {/* SVG Right Arrow */}{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 pointer-events-none"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />{" "}
            </svg>{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <AnimatePresence>
        {isStyleDescriptionRequired && (
          <motion.div
            className="p-2" // Keep margin consistent
            initial={{
              height: 0,
              opacity: 0,
              marginTop: 0,
              marginBottom: 0,
            }} // Animate height and margin too
            animate={{
              height: "auto",
              opacity: 1,
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
            }} // Adjust margin as needed
            exit={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }} // Smoother ease
            style={{ overflow: "hidden" }} // Prevent content spill during animation
          >
            <label
              htmlFor="styleDescription"
              className="block text-sm font-medium mb-1 text-foreground" // Use theme color
            >
              Describe Style Combination/Custom Idea{" "}
              <span className="text-destructive font-semibold">(Required)</span>
            </label>
            <input
              id="styleDescription"
              type="text"
              className={cn(
                `w-full border rounded px-3 py-2 focus:outline-none focus:ring-2`, // Base style, added ring-2
                `bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white`, // Theme colors
                `transition-all duration-300 ease-in-out`,
                showGlow // Apply glow only if required, empty, and carousel touched
                  ? "border-destructive ring-destructive/50 shadow-[0_0_8px_1px_hsl(var(--destructive)/0.4)]" // Use theme color
                  : "border-input focus:border-primary focus:ring-primary/50" // Use theme colors
              )}
              required={isStyleDescriptionRequired} // Dynamically set required
              aria-required={isStyleDescriptionRequired}
              aria-invalid={showGlow}
              value={formData.styleDescription || ""}
              onChange={(e) =>
                updateFormData({ styleDescription: e.target.value })
              }
              placeholder="e.g., 'Neo-traditional mix with realism elements', 'Custom abstract floral design'"
            />
            <p className="text-xs text-muted-foreground pt-1">
              Required for 'Combination', 'Custom', or 'Other' styles.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Additional Details Modal Trigger (No changes needed here) */}{" "}

      {/* Additional Details Modal (No changes needed here) */}{" "}

    </div> // End Main Container
  );
};
export default ExampleStylesCarousel;
