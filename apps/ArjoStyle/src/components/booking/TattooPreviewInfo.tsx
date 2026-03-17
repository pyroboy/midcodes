import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent, // Added MouseEvent type
} from "react";
// -------------------------------------------------------------------------
// Ensure Framer Motion is installed and imported correctly
// -------------------------------------------------------------------------
import { motion, AnimatePresence } from "framer-motion";

// --- Adjust these paths as needed for your project structure ---
import { Human3DViewer } from "../three/Human3DViewer";
import { LevelIndicator } from "./LevelIndicator";
import { Card } from "@/components/ui/card";
import { Zap, Layers, Clock, Tag, Palette, Ruler } from "lucide-react";
import { PainDisplaySection } from "./PainDisplaySection";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDuration } from "@/lib/formatters";
import { useBodyPartMapping } from "@/hooks/useBodyPartMapping";
import { BodyPartMapping, BodyPartMappings } from "@/types/mapping";
// --- End Path Adjustments ---

// Constants
const MAX_HEIGHT = 288;
const MIN_HEIGHT = 80;
const RESIZE_END_DEBOUNCE_MS = 50;
const HEIGHT_CHANGE_THRESHOLD = 2;
const DRAG_THRESHOLD = 5; // Pixels threshold to differentiate click from drag
type LastChangedProp = "category" | "placement" | null;

// Props Interface
interface TattooPreviewInfoProps {
  modelId: string;
  selectedCategory: string | null;
  currentPlacement: string | null;
  isColor: boolean;
  painLevel: number;
  painReason?: string;
  size: number | undefined;
  priceTierLevel: number;
  estimatedPrice: number | undefined;
  estimatedDuration: number | undefined;
  selectedStyle: string | null;
  previewHeight: number;
  onToggleExpand: () => void;
  editMode: boolean;
  liveMappings: BodyPartMappings | null | undefined;
  onMappingUpdate: (
    category: string,
    placement: string,
    update: Partial<BodyPartMapping>
  ) => void;
}

// Component Definition
const TattooPreviewInfoComponent: React.FC<TattooPreviewInfoProps> = ({
  modelId,
  selectedCategory,
  currentPlacement,
  isColor,
  painLevel,
  painReason,
  size,
  priceTierLevel,
  estimatedPrice,
  estimatedDuration,
  selectedStyle,
  previewHeight,
  onToggleExpand,
  editMode,
  liveMappings,
  onMappingUpdate,
}) => {
  // --- Hooks & State ---
  const { bodyPartMapping: currentMappingData } = useBodyPartMapping(
    modelId,
    liveMappings,
    selectedCategory || "",
    currentPlacement || ""
  );

  // --- Refs for Drag Detection ---
  const isDraggingRef = useRef(false);
  const startDragPosRef = useRef({ x: 0, y: 0 });
  // --- End Refs for Drag Detection ---

  const isMinimized = previewHeight <= MIN_HEIGHT + 5;
  const progress = Math.max(
    0,
    Math.min(1, (previewHeight - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT))
  );
  const minSize = 80;
  const minRadius = 6;
  const expandedTargetHeight = MAX_HEIGHT;
  const expandedTargetWidth = MAX_HEIGHT / 1.5;
  const maxRadius = 8;

  // Handle potentially undefined estimatedPrice
  const roundedEstimatedPrice =
  estimatedPrice !== undefined
    ? (estimatedPrice / 2 >= 1000
        ? Math.round(estimatedPrice / 2 / 500) * 500  // Round by 500s if >= 1000
        : Math.round(estimatedPrice / 2 / 100) * 100) // Round by 100s if < 1000
    : 0;
  const currentHeight = Math.max(
    MIN_HEIGHT,
    Math.min(MAX_HEIGHT, previewHeight)
  );
  const currentWidth = minSize + (expandedTargetWidth - minSize) * progress;
  const currentRadius = minRadius + (maxRadius - minRadius) * progress;
  const prevCategoryRef = useRef<string | null>(selectedCategory);
  const prevPlacementRef = useRef<string | null>(currentPlacement);
  const [lastChangedProp, setLastChangedProp] = useState<LastChangedProp>(null);

  // Effect to track changes in category and placement
  useEffect(() => {
    const categoryChanged =
      selectedCategory !== prevCategoryRef.current &&
      prevCategoryRef.current !== undefined; // Only track after initial render
    const placementChanged =
      currentPlacement !== prevPlacementRef.current &&
      prevPlacementRef.current !== undefined; // Only track after initial render

    // Determine which changed last
    if (categoryChanged) {
      setLastChangedProp("category");
    } else if (placementChanged) {
      setLastChangedProp("placement");
    }

    // Update refs for the next comparison
    prevCategoryRef.current = selectedCategory;
    prevPlacementRef.current = currentPlacement;
  }, [selectedCategory, currentPlacement]);

  const modelUrl = useMemo(() => {
    if (modelId === "default-human") {
      return "https://res.cloudinary.com/dexcw6vg0/image/upload/v1741855043/male_low_poly_human_body_jtzm1e.glb"; // Replace if needed
    }
    return undefined;
  }, [modelId]);

  const priceTiers = useMemo(
    () => [
      { level: 1, range: [1, 3], label: "Simple", colorClass: "bg-green-500" },
      { level: 2, range: [4, 6], label: "Detailed", colorClass: "bg-blue-500" },
      {
        level: 3,
        range: [7, 10],
        label: "Intricate",
        colorClass: "bg-purple-600",
      },
    ],
    []
  );

  const currentTier = useMemo(
    () =>
      priceTiers.find(
        (tier) =>
          tier.range[0] <= priceTierLevel && priceTierLevel <= tier.range[1]
      ) || priceTiers[0],
    [priceTiers, priceTierLevel]
  );

  const priceTierColorStops = useMemo(
    () =>
      priceTiers.map((tier) => ({
        level: tier.level,
        colorClass: tier.colorClass,
      })),
    [priceTiers]
  );

  const hasRequiredInfoForOverlay =
    selectedCategory !== null && currentPlacement !== null;

  const [isViewerResizing, setIsViewerResizing] = useState(false);
  const previousHeightRef = useRef<number>(previewHeight);
  const resizeEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Improved Resize Debounce Effect ---
  useEffect(() => {
    const currentHeightVal = previewHeight;
    const previousHeightVal = previousHeightRef.current ?? currentHeightVal;
    const heightDiff = Math.abs(currentHeightVal - previousHeightVal);

    if (resizeEndTimeoutRef.current) {
      clearTimeout(resizeEndTimeoutRef.current);
    }

    if (heightDiff > HEIGHT_CHANGE_THRESHOLD) {
      if (!isViewerResizing) {
        setIsViewerResizing(true);
      }
    }

    resizeEndTimeoutRef.current = setTimeout(() => {
      setIsViewerResizing(false);
      resizeEndTimeoutRef.current = null;
    }, RESIZE_END_DEBOUNCE_MS);

    previousHeightRef.current = currentHeightVal;

    return () => {
      if (resizeEndTimeoutRef.current) {
        clearTimeout(resizeEndTimeoutRef.current);
      }
    };
  }, [previewHeight, isViewerResizing]); // Removed setIsViewerResizing based on original deps

  // Condition for showing the flashing state
  const showFlashingState =
    size === 0 && !!selectedCategory && !!currentPlacement; // Only flash if cat/placement selected

  // Animation Variants
  const textAnimationVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3, delay: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // --- Event Handlers for Click vs Drag ---
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return; // Only main button
    isDraggingRef.current = false;
    startDragPosRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    // Check if primary button is pressed and not already dragging
    if (event.buttons !== 1 || isDraggingRef.current) return;

    const currentPos = { x: event.clientX, y: event.clientY };
    const startPos = startDragPosRef.current;
    const dx = currentPos.x - startPos.x;
    const dy = currentPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
    }
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    // If it was a drag, prevent toggle and reset
    if (isDraggingRef.current) {
      event.stopPropagation(); // Prevent potential unintended effects
      isDraggingRef.current = false; // Reset for next interaction
      return;
    }
    // If it wasn't a drag, proceed with the original toggle
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  const handleMouseUp = () => {
    // Optional: Reset drag state on mouse up as a safeguard
    if (isDraggingRef.current) {
      // Use timeout to ensure this reset happens after a potential onClick check
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 0);
    }
  };
  // --- End Event Handlers ---

  // --- JSX Render ---
  return (
    <Card
      className={cn(
        "overflow-hidden shadow-md w-full cursor-pointer", // Added cursor-pointer
        "fixed" // Assuming 'fixed' positioning is needed
      )}
      style={{ height: `${previewHeight}px`, willChange: "height" }}
      role="button"
      tabIndex={onToggleExpand ? 0 : undefined}
      // --- Use specific mouse handlers ---
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      // --- End Handler Changes ---
      onKeyDown={(e) => {
        if (onToggleExpand && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggleExpand();
        }
      }}
      aria-expanded={!isMinimized}
      aria-label={
        isMinimized
          ? "Click to expand preview details"
          : "Click to minimize preview details"
      }
    >
      {/* Main Flex Container */}
      <div
        className={cn(
          `relative h-full select-none flex`,
          isMinimized ? `items-center` : `items-stretch`
        )}
      >
        {/* === 3D Model Container === */}
        <div
          className={cn(
            "relative bg-secondary dark:bg-slate-800 overflow-hidden flex-shrink-0"
          )}
          style={{
            width: `${currentWidth}px`,
            height: `${currentHeight}px`,
            borderRadius: `${currentRadius}px`,
            willChange: "width, height, border-radius",
            pointerEvents: "none", // Add pointer events none
          }}
        >
          {modelUrl && (
            <div className="absolute inset-0 z-0">
              <Human3DViewer
                modelUrl={modelUrl}
                isColor={isColor}
                mapping={currentMappingData}
                editMode={editMode}
                onMappingUpdate={onMappingUpdate}
                selectedCategory={selectedCategory}
                currentPlacement={currentPlacement}
                size={size}
                isContainerResizing={isViewerResizing}
              />
            </div>
          )}
        </div>
        {/* === Info Container (Right Side) === */}
        <div
          className={cn(
            `relative overflow-hidden`,
            isMinimized
              ? "flex-grow pl-3 pointer-events-none" // Add pointer-events-none when minimized
              : "flex-1 bg-white dark:bg-slate-950 h-full order-last flex flex-col pointer-events-auto" // Ensure auto when expanded
          )}
        >
          {/* --- Minimized View Snippets --- */}
          <div
            className={cn(
              `transition-opacity duration-400 ease-in-out space-y-1.5 text-sm px-2 py-1`,
              isMinimized
                ? "opacity-100"
                : "opacity-0 absolute -z-10 pointer-events-none" // Also ensure non-interactable when hidden
            )}
            aria-hidden={!isMinimized}
          >
            {/* Header: Placement & Category */}
            <div className="mb-1">
              <h3
                className="font-semibold text-sm leading-tight truncate"
                title={currentPlacement ?? "Select Placement"}
              >
                {currentPlacement || "Placement"}
              </h3>
              <p
                className="text-[0.7rem] leading-tight text-muted-foreground truncate"
                title={selectedCategory ?? "Select Category"}
              >
                {selectedCategory || "Category"}
              </p>
            </div>
            {/* Details Grid: 3 columns, 2 rows */}
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-1 text-xs">
              {/* Price */}
              <div
                className="flex items-center gap-1 truncate"
                title={`Booking Downpayment: ${formatCurrency(
                  roundedEstimatedPrice
                )}`}
              >
                <Tag
                  size={12}
                  className="flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <span className="font-medium text-sm text-foreground">
                  {formatCurrency(roundedEstimatedPrice)}
                </span>
              </div>
              {/* Time */}
              <div
                className="flex items-center gap-1 truncate"
                title={`Est. Time: ${formatDuration(estimatedDuration)}`}
              >
                <Clock
                  size={12}
                  className="flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <span className="text-muted-foreground">
                  {formatDuration(estimatedDuration)}
                </span>
              </div>
              {/* Size */}
              <div
                className="flex items-center gap-1 truncate"
                title={`Size: ${size !== undefined ? size + '"' : "N/A"}`}
              >
                <Ruler
                  size={12}
                  className="flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <span className="text-muted-foreground">
                  {size !== undefined ? `${size}"` : "N/A"}
                </span>
              </div>
              {/* Style */}
              <div
                className="flex items-center gap-1 truncate"
                title={`Style: ${selectedStyle || "Not specified"}`}
              >
                <Palette
                  size={12}
                  className="flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <span className="text-muted-foreground truncate max-w-[80px]">
                  {selectedStyle || "N/A"}
                </span>
              </div>
              {/* Pain */}
              <div
                className="flex items-center gap-1"
                title={`Pain: ${painLevel}/10`}
              >
                <Zap size={12} className="flex-shrink-0 text-orange-500" />
                <div className="flex-grow min-w-0">
                  <LevelIndicator
                    level={painLevel}
                    ariaLabel="Pain Level"
                    minimized={true}
                    showDivisions={false}
                    className="my-0"
                  />
                </div>
              </div>
              {/* Complexity */}
              <div
                className="flex items-center gap-1"
                title={`Complexity: ${priceTierLevel}/10 - ${currentTier?.label}`}
              >
                <Layers size={12} className="flex-shrink-0 text-blue-500" />
                <div className="flex-grow min-w-0">
                  <LevelIndicator
                    level={priceTierLevel}
                    ariaLabel="Complexity Level"
                    minimized={true}
                    showDivisions={false}
                    colorStops={priceTierColorStops}
                    className="my-0"
                  />
                </div>
              </div>
            </div>{" "}
            {/* End Grid */}
          </div>{" "}
          {/* End Minimized View */}
          {/* --- Expanded View Sections --- */}
          <div
            className={cn(
              `flex flex-col h-full px-4`,
              !isMinimized
                ? "opacity-100"
                : "opacity-0 absolute -z-10 pointer-events-none" // Ensure non-interactable when hidden
            )}
            aria-hidden={isMinimized}
          >
            {/* Dynamic Content Area (Flashing or Normal) */}
            <div className="flex-grow relative overflow-hidden">
              <AnimatePresence initial={false} mode="wait">
                {showFlashingState ? (
                  // Flashing State
                  <motion.div
                    key="flashing-header"
                    className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 p-2 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.p
                      layout="position"
                      className={cn(
                        "font-bold uppercase tracking-tight mb-1 sm:mb-2 transition-all duration-300 ease-out",
                        lastChangedProp === "category" ||
                          (!lastChangedProp && selectedCategory)
                          ? "text-4xl sm:text-5xl text-slate-800 dark:text-white scale-105"
                          : "text-xl sm:text-2xl text-slate-500 dark:text-slate-400 scale-100"
                      )}
                    >
                      {selectedCategory || "Category..."}
                    </motion.p>
                    <motion.h3
                      layout="position"
                      className={cn(
                        "font-extrabold transition-all duration-300 ease-out",
                        lastChangedProp === "placement" ||
                          (!lastChangedProp &&
                            !selectedCategory &&
                            currentPlacement)
                          ? "text-4xl sm:text-5xl text-slate-800 dark:text-white scale-105"
                          : "text-xl sm:text-2xl text-slate-600 dark:text-slate-300 scale-100"
                      )}
                    >
                      {currentPlacement || "Placement..."}
                    </motion.h3>
                    <motion.p
                      className="mt-4 text-sm text-muted-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                      exit={{ opacity: 0 }}
                    >
                      Select Size to Continue
                    </motion.p>
                  </motion.div>
                ) : (
                  // Normal Expanded Content
                  <motion.div
                    key="normal-content"
                    className="flex flex-col h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Normal Header */}
                    <motion.div className="flex-shrink-0 w-full px-2 pt-1 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-t-lg shadow-sm">
                      <motion.p
                        layout="position"
                        className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 "
                      >
                        {selectedCategory || "Category"}
                      </motion.p>
                      <motion.h3
                        layout="position"
                        className="text-xl font-bold text-slate-800 dark:text-white"
                      >
                        {currentPlacement || "Placement"}
                      </motion.h3>
                    </motion.div>
                    {/* Scrollable Details */}
                    <motion.div
                      className="flex-grow overflow-y-auto px-4 py-3 space-y-4 sm:space-y-6 min-w-[400px] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
                      initial="initial"
                      animate="animate"
                      variants={{
                        initial: {},
                        animate: {
                          transition: {
                            staggerChildren: 0.05,
                            delayChildren: 0.2,
                          },
                        },
                      }}
                    >
                      {/* Booking Downpayment */}
                      <motion.div
                        variants={textAnimationVariants}
                        className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-baseline"
                      >
                        <h3 className="text-sm md:text-base font-medium text-muted-foreground mb-0.5 sm:mb-0">
                          Booking Downpayment:
                        </h3>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(roundedEstimatedPrice)}
                          </span>
                        </div>
                      </motion.div>

                      {/* Estimated Full Price */}
                      {estimatedPrice !== undefined && ( // Only show if price exists
                        <motion.div
                          variants={textAnimationVariants}
                          className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-baseline"
                        >
                          <h3 className="text-sm md:text-base font-medium text-muted-foreground mb-0.5 sm:mb-0">
                            Est. Full Price:
                          </h3>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-sm md:text-sm font-light text-slate-900 dark:text-white">
                              {formatCurrency(estimatedPrice)}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Est. Time */}
                      <motion.div
                        variants={textAnimationVariants}
                        className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-baseline"
                      >
                        <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-0">
                          Est. Time:
                        </h3>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base md:text-lg font-medium">
                            {formatDuration(estimatedDuration)}
                          </span>
                        </div>
                      </motion.div>

                      {/* Size */}
                      <motion.div
                        variants={textAnimationVariants}
                        className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-baseline"
                      >
                        <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-0">
                          Size:
                        </h3>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base md:text-lg font-medium">
                            {size !== undefined ? `${size} sq. in` : "N/A"}
                          </span>
                        </div>
                      </motion.div>

                      {/* Style */}
                      <motion.div
                        variants={textAnimationVariants}
                        className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-baseline"
                      >
                        <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-0">
                          Style:
                        </h3>
                        <div className="flex items-baseline space-x-1">
                          <span
                            className="text-base md:text-lg font-medium truncate max-w-[150px] sm:max-w-[180px] md:max-w-[200px]"
                            title={selectedStyle || "Not specified"}
                          >
                            {selectedStyle || "Not specified"}
                          </span>
                        </div>
                      </motion.div>
                    </motion.div>{" "}
                    {/* End Scrollable Details */}
                  </motion.div> /* End Normal Expanded Content */
                )}
              </AnimatePresence>
            </div>{" "}
            {/* End Dynamic Content Area */}
            {/* Bottom Fixed Sections */}
            <motion.div
              className="flex-shrink-0 px-1 pb-2 pt-1 border-t border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0 }}
              animate={{
                opacity: !isMinimized ? 1 : 0,
                transition: { delay: 0.1 },
              }}
              exit={{ opacity: 0 }}
            >
              {/* Pain Display */}
              <PainDisplaySection
                painLevel={painLevel}
                painReason={painReason}
              />

              {/* Complexity Display - Show only when not flashing and info is ready */}
              {!showFlashingState && hasRequiredInfoForOverlay && (
                <motion.div
                  className="flex-shrink-0 px-1 pb-2 pt-1 space-y-1 border-t border-slate-200 dark:border-slate-700 mt-2" // Added margin top
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: !isMinimized ? 1 : 0,
                    transition: { delay: 0.1 },
                  }}
                  exit={{ opacity: 0 }}
                >
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2"></div>{" "}
                  {/* Added border based on original */}
                  <span className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                    <Layers
                      size={14}
                      className="mr-1 inline-block text-blue-500 flex-shrink-0"
                    />{" "}
                    Complexity:
                  </span>
                  <LevelIndicator
                    level={priceTierLevel}
                    ariaLabel={`Price Tier Level: ${currentTier.label}`}
                    colorStops={priceTierColorStops}
                    showDivisions={true}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    {priceTiers.map((tier) => (
                      <span
                        key={tier.label}
                        className={cn(
                          "transition-colors duration-200 px-1 text-center flex-1",
                          currentTier.label === tier.label
                            ? "text-foreground font-semibold"
                            : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {tier.label}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>{" "}
            {/* End Bottom Fixed Sections */}
          </div>{" "}
          {/* End expanded view wrapper */}
        </div>{" "}
        {/* End Info Container */}
        {/* === Main Overlay Prompt === */}
        <AnimatePresence>
          {!hasRequiredInfoForOverlay &&
            !isMinimized && ( // Only show overlay if expanded AND info missing
              <motion.div
                key="main-overlay"
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/80 to-white/90 dark:from-slate-900/80 dark:to-slate-900/90 backdrop-blur-sm z-30"
                style={{ transform: "translateZ(0)", willChange: "opacity" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                aria-hidden={hasRequiredInfoForOverlay || isMinimized} // Also hide if minimized
              >
                <div className="text-center p-6">
                  <div className="perspective-container mb-3">
                    <p className="font-semibold text-2xl uppercase tracking-[0.5rem] text-slate-900 dark:text-slate-100">
                      TATTOO CALCULATOR
                    </p>
                  </div>
                  <p className="text-xl text-slate-500 dark:text-slate-400 mt-1.5">
                    Adjust sliders to calculate Downpayment.
                  </p>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>{" "}
      {/* End Main Flex Container */}
    </Card>
  );
};

// Export memoized component
export const TattooPreviewInfo = memo(TattooPreviewInfoComponent);
