// src/components/booking/TattooCalculator.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Card,
    CardContent,
    // CardHeader, // CardHeader is not used, removed import
    // CardTitle, // CardTitle is not used, removed import
    CardDescription,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Clock, Info, AlertTriangle } from "lucide-react";
// Import the necessary types, ensure the path is correct
// Make sure BodyPartMapping is imported
import {
    BodyPartMappings,
    BodyPartMapping,
    PlacementSizeLimits,
    PlacementPainInfo,
} from "@/types/mapping"; // Ensure this path is correct for your project structure

// --- Constants ---
const MINIMUM_BASE_PRICE = 1000; // Base price in PHP (also used as hourly minimum base)
const BASE_PAIN_LEVEL = 1;
const PAIN_DIFFICULTY_FACTOR = 0.02; // Affects placement price based on pain delta
const PAIN_WARNING_THRESHOLD = 6; // Pain level at which detailed reason might be shown
const COVER_UP_MULTIPLIER = 2;
const COLOR_MULTIPLIER = 2;
const SIZE_PRICE_BRACKETS = [
    { maxSize: 2, priceMultiplier: 1.0 }, // Up to 2 sq in
    { maxSize: 4, priceMultiplier: 1 }, // >2 to 4 sq in (No increase from base *for size*)
    { maxSize: 8, priceMultiplier: 1.5 }, // >4 to 8 sq in
    { maxSize: 12, priceMultiplier: 3.5 }, // >8 to 12 sq in
    { maxSize: Infinity, priceMultiplier: 4.5 }, // Larger than 12 sq in
];

const TRUE_BASE_MINUTES_PER_INCH = 10; // Base time per sq inch before multipliers
const SIZE_DURATION_BRACKETS = [
    { maxSize: 2, durationMultiplier: 1.3 }, // Smaller takes longer per inch
    { maxSize: 4, durationMultiplier: 1.0 },
    { maxSize: 8, durationMultiplier: 1.0 },
    { maxSize: Infinity, durationMultiplier: 1.1 }, // Very large slightly slower per inch
];
const COMPLEXITY_MULTIPLIERS = [1, 1.5, 1.8]; // Price multipliers for Simple, Detailed, Intricate
const COMPLEXITY_DURATION_MULTIPLIERS = [1, 2, 2.6]; // Duration multipliers for Simple, Detailed, Intricate
const PAIN_DURATION_FACTOR = 0.15; // How much duration increases per pain point above base
const COLOR_DURATION_MULTIPLIER = 1.4; // Duration multiplier if color is used
const COVERUP_DURATION_MULTIPLIER = 1.3; // Duration multiplier for cover-ups
const MINIMUM_DURATION_MINUTES = 30; // Absolute minimum duration for any calculation
const MAX_SESSION_HOURS = 6; // Maximum hours per session for multi-session estimate

// --- Default/Fallback Values (if data missing in mappings) ---
const DEFAULT_SIZE_LIMITS: PlacementSizeLimits = {
    min: 0.5, // Default minimum size if not specified
    max: 12,  // Default maximum size if not specified
    multiplier: 1.0, // Default placement price multiplier
};
const DEFAULT_PAIN_INFO: PlacementPainInfo = {
    level: 1 // Default pain level if not specified
    // Reason is optional
};

// --- Helper Function to Format Duration ---
const formatDuration = (totalMinutes: number): string => {
    if (
        totalMinutes === undefined ||
        isNaN(totalMinutes) ||
        totalMinutes < MINIMUM_DURATION_MINUTES
    ) {
        // If invalid or below minimum, show the minimum duration formatted
        return `Approx. ${MINIMUM_DURATION_MINUTES} min`;
    }
    // Round to nearest 30 mins, but ensure it's not less than the absolute minimum
    const roundedMinutes = Math.max(MINIMUM_DURATION_MINUTES, Math.round(totalMinutes / 30) * 30);
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    let result = "";
    if (hours > 0) {
        result += `${hours} hr${hours > 1 ? "s" : ""}`;
    }
    if (minutes > 0) {
        if (result.length > 0) result += " ";
        result += `${minutes} min`;
    }
    // Handle case where rounding somehow results in zero (shouldn't happen with Math.max)
    return result.length > 0
        ? `Approx. ${result}`
        : `Approx. ${MINIMUM_DURATION_MINUTES} min`;
};

// --- Props Interface ---
export type TattooCalculatorChangePayload = {
    size: number;
    isColor: boolean;
    selectedCategory: string;
    placementIndex: number;
    currentPlacement: string | null;
    painLevel: number | null;
    painReason?: string;
    isCoverUp: boolean;
    pricing: {
        basePriceRaw: number;
        sizeAdjustmentPrice: number;
        complexityPrice: number;
        placementPrice: number;
        colorPrice: number;
        coverUpPrice: number;
        hourlyMinimumAdjustment: number;
        total: number;
        downpayment: number;
    };
    estimatedDurationMinutes: number;
    estimatedSessions: number;
    complexity: number;
    visualComplexityScore: number;
    sizeSliderTouched: boolean;
    placementSliderTouched: boolean;
};

interface TattooCalculatorProps {
    // Expect the integrated mapping object as a prop
    bodyPartMappings: BodyPartMappings | null | undefined;
    initialValues?: {
        size: number;
        isColor: boolean;
        selectedCategory: string;
        placementIndex: number; // Index relative to the dynamic list for the category
        isCoverUp: boolean;
        sizeSliderTouched: boolean;
        placementSliderTouched: boolean;
    };
    // Callback function when calculated values change
    onChange?: (values: TattooCalculatorChangePayload) => void;
}

// --- Component ---
const TattooCalculator: React.FC<TattooCalculatorProps> = ({
    bodyPartMappings, // Receive mappings as a prop
    initialValues,
    onChange,
}) => {
    // --- State ---
    const [size, setSize] = useState(initialValues?.size ?? 0); // Current size in sq inches
    const [isColor, setIsColor] = useState(initialValues?.isColor ?? false); // Is it a color tattoo?
    const [selectedCategory, setSelectedCategory] = useState(
        initialValues?.selectedCategory ?? "" // Currently selected body part category (e.g., "Arm", "Leg")
    );
    // placementIndex now refers to the index within the *dynamically generated* list for the selected category
    const [placementIndex, setPlacementIndex] = useState(
        initialValues?.placementIndex ?? 0 // Index of the selected placement within the category's list
    );
    const [isCoverUp, setIsCoverUp] = useState(initialValues?.isCoverUp ?? false); // Is it a cover-up/enhancement?
    const [sizeSliderTouched, setSizeSliderTouched] = useState(
        initialValues?.sizeSliderTouched ?? false // Has the user interacted with the size slider yet?
    );
    const [placementSliderTouched, setPlacementSliderTouched] = useState(
        initialValues?.placementSliderTouched ?? false // Has the user interacted with the placement slider yet?
    );

    // --- Memoized Derived State & Data (using bodyPartMappings Prop) ---

    // Get the list of available category names from the mappings prop
    const categoryKeys = useMemo(() => {
        const keys = bodyPartMappings ? Object.keys(bodyPartMappings) : [];
        // Always include the "" key for the initial unselected state, then sorted keys
        return ["", ...keys];
    }, [bodyPartMappings]);

    // Get the list of available placement names *for the currently selected category*
    const currentPlacements = useMemo(() => {
        if (
            !selectedCategory ||
            !bodyPartMappings ||
            !bodyPartMappings[selectedCategory]
        ) {
            return []; // No placements if category is invalid or mappings missing
        }
        // Return sorted placement names (keys) for the selected category
        return Object.keys(bodyPartMappings[selectedCategory]).sort();
    }, [selectedCategory, bodyPartMappings]);

    // Ensure placementIndex is valid for the current list of placements
    const safePlacementIndex = useMemo(() => {
        const maxIndex = Math.max(0, currentPlacements.length - 1);
        // Clamp the current placementIndex within the valid range [0, maxIndex]
        return Math.min(Math.max(0, placementIndex), maxIndex);
    }, [placementIndex, currentPlacements]);

    // Determine the name of the currently selected placement based on the safe index
    const currentPlacement = useMemo(
        () =>
            selectedCategory && currentPlacements.length > 0
                ? currentPlacements[safePlacementIndex] // Get name from the dynamic list
                : null,
        [selectedCategory, currentPlacements, safePlacementIndex]
    );

    // Get the full data object (BodyPartMapping) for the current placement from the mappings
    const currentPlacementData = useMemo<BodyPartMapping | null>(() => {
        if (!selectedCategory || !currentPlacement || !bodyPartMappings) {
            return null;
        }
        // Use optional chaining for safer access - returns BodyPartMapping | undefined
        // The '?? null' converts undefined to null to match the explicit return type
        return bodyPartMappings[selectedCategory]?.[currentPlacement] ?? null;
    }, [selectedCategory, currentPlacement, bodyPartMappings]);

    // --- Get specific data (size limits, pain info) from currentPlacementData, using defaults ---

    const currentSizeLimits = useMemo<PlacementSizeLimits>(() => {
        // Handles currentPlacementData being null OR placementSizeLimits being undefined inside it
        return currentPlacementData?.placementSizeLimits ?? DEFAULT_SIZE_LIMITS;
    }, [currentPlacementData]);

    const currentPainInfo = useMemo<PlacementPainInfo>(() => {
        // Handles currentPlacementData being null OR placementPainInfo being undefined inside it
        return currentPlacementData?.placementPainInfo ?? DEFAULT_PAIN_INFO;
    }, [currentPlacementData]);

    // --- Calculations based on derived data ---

    // Extract pain level from the derived pain info object
    const currentPainLevel = useMemo<number | null>(
        () => currentPainInfo?.level ?? null, // Get level from derived pain info
        [currentPainInfo]
    );

    // Calculate the price multiplier based on pain level relative to the base pain level
    const painMultiplier = useMemo(() => {
        if (currentPainLevel === null) return 1; // Default if no pain level data
        // Increase multiplier based on how much pain exceeds the base level
        return (
            1 +
            Math.max(0, currentPainLevel - BASE_PAIN_LEVEL) * PAIN_DIFFICULTY_FACTOR
        );
    }, [currentPainLevel]);

    // Combine placement's base multiplier with the calculated pain multiplier
    const effectivePlacementMultiplier = useMemo(
        () => parseFloat((currentSizeLimits.multiplier * painMultiplier).toFixed(2)), // Round to 2 decimal places
        [currentSizeLimits.multiplier, painMultiplier]
    );

    // --- Control Flow / Conditionals (Determine if parts of the UI should be enabled/disabled) ---
    const isCalculatorDisabled = !bodyPartMappings; // Disable entire calculator if mappings aren't loaded
    const isPlacementDisabled = !selectedCategory || isCalculatorDisabled; // Placement slider disabled until category is selected
    const isSizeDisabled = !placementSliderTouched || !currentPlacement || isCalculatorDisabled; // Size slider disabled until placement is selected/touched
    const areSwitchesDisabled = !sizeSliderTouched || !currentPlacement || isCalculatorDisabled; // Optional switches disabled until size is selected/touched

    // Determine if enough information is available to perform calculations
    const calculationsEnabled = useMemo(
        () =>
            !isCalculatorDisabled && // Mappings must be loaded
            sizeSliderTouched &&     // User must have touched size slider
            currentPlacement &&      // A placement must be selected
            size >= currentSizeLimits.min, // Size must meet the minimum for the placement
        [
            isCalculatorDisabled,
            sizeSliderTouched,
            currentPlacement,
            size,
            currentSizeLimits.min, // Use derived size limits
        ]
    );

    // Determine if the user has made the essential base selections (category, placement, size)
    const areBaseSelectionsMade = useMemo(
        () =>
            !isCalculatorDisabled &&
            selectedCategory &&
            currentPlacement &&
            placementSliderTouched &&
            sizeSliderTouched &&
            size >= currentSizeLimits.min, // Use derived size limits
        [
            isCalculatorDisabled,
            selectedCategory,
            currentPlacement,
            placementSliderTouched,
            sizeSliderTouched,
            size,
            currentSizeLimits.min,
        ]
    );

    // --- Calculated Values (These depend on the state and derived data) ---

    // Calculate a 'visual complexity score' based on size, color, and cover-up status
    const visualComplexityScore = useMemo(() => {
        if (!calculationsEnabled) return 1; // Default score if calculations aren't ready
        let score = 1;
        // Add points based on size brackets
        if (size > 10) score += 4;
        else if (size > 6) score += 3;
        else if (size > 3) score += 1;
        // Add points for color and cover-up
        if (isColor) score += 3;
        if (isCoverUp) score += 4;
        // Clamp score between 1 and 10
        return Math.max(1, Math.min(10, Math.round(score)));
    }, [size, isColor, isCoverUp, calculationsEnabled]);

    // Determine the complexity level (1, 2, or 3) based on the visual complexity score
    const effectiveComplexityLevel = useMemo(() => {
        if (!calculationsEnabled) return 1; // Default to Simple
        const score = visualComplexityScore;
        if (score >= 7) return 3; // Intricate
        if (score >= 4) return 2; // Detailed
        return 1; // Simple
    }, [visualComplexityScore, calculationsEnabled]);

    // --- Estimated Duration Calculation ---
    const estimatedDurationMinutes = useMemo(() => {
        // Return minimum duration if calculations aren't enabled or pain level is missing
        if (!calculationsEnabled || currentPainLevel === null) {
            return MINIMUM_DURATION_MINUTES;
        }

        // Determine size-based duration multiplier
        let sizeDurMultiplier = 1.0;
        for (const bracket of SIZE_DURATION_BRACKETS) {
            if (size <= bracket.maxSize) {
                sizeDurMultiplier = bracket.durationMultiplier;
                break;
            }
        }
        // Base duration based on size and adjusted minutes-per-inch
        const effMinsPerInch = TRUE_BASE_MINUTES_PER_INCH * sizeDurMultiplier;
        const sizeDur = size * effMinsPerInch;

        // Get complexity duration multiplier
        const complexDurMultiplier = COMPLEXITY_DURATION_MULTIPLIERS[effectiveComplexityLevel - 1] ?? 1;

        // Calculate pain factor for duration
        const painFactor = 1 + Math.max(0, currentPainLevel - BASE_PAIN_LEVEL) * PAIN_DURATION_FACTOR;

        // Get color and cover-up duration factors
        const colorFactor = isColor ? COLOR_DURATION_MULTIPLIER : 1;
        const coverupFactor = isCoverUp ? COVERUP_DURATION_MULTIPLIER : 1;

        // Calculate total minutes by applying all multipliers
        const totalMins = sizeDur * complexDurMultiplier * painFactor * colorFactor * coverupFactor;

        // Round to nearest 30 minutes, but ensure it's not less than the absolute minimum duration
        const calculatedDuration = Math.round(totalMins / 30) * 30;
        return Math.max(MINIMUM_DURATION_MINUTES, calculatedDuration);

    }, [
        size,
        effectiveComplexityLevel,
        currentPainLevel, // Derived from mappings
        isColor,
        isCoverUp,
        calculationsEnabled,
    ]);

    // Estimate the number of sessions based on duration and max session length
    const estimatedSessions = useMemo(() => {
        if (!calculationsEnabled || estimatedDurationMinutes <= MINIMUM_DURATION_MINUTES) {
            return 1; // Default to 1 session if calculations disabled or duration is short
        }
        const durationHours = estimatedDurationMinutes / 60;
        // Calculate sessions needed, ensuring at least 1
        return Math.ceil(Math.max(1, durationHours / MAX_SESSION_HOURS));
    }, [estimatedDurationMinutes, calculationsEnabled]);

    // --- Pricing Calculation (Uses useCallback for performance, recalculated when dependencies change) ---
    const calculatePricing = useCallback((
        // Accept the calculated duration as an argument
        durationMinutes: number
    ) => {
        // Define the default return structure (all zeros) for when calculations are disabled
        const defaultPricing = {
            basePriceRaw: 0,
            sizeAdjustmentPrice: 0,
            complexityPrice: 0,
            placementPrice: 0,
            colorPrice: 0,
            coverUpPrice: 0,
            hourlyMinimumAdjustment: 0, // Default hourly adjustment is zero
            total: 0,
            downpayment: 0,
        };

        // Return default values if prerequisites aren't met or duration is invalid
        if (!calculationsEnabled || durationMinutes <= 0) {
            return defaultPricing;
        }

        // Start with the absolute minimum base price (constant)
        const basePriceRaw = MINIMUM_BASE_PRICE;

        // --- Calculate Size Adjustment ---
        let sizePriceMultiplier = 1.0; // Default multiplier
        // Find the correct multiplier from the size brackets
        for (const bracket of SIZE_PRICE_BRACKETS) {
            if (size <= bracket.maxSize) {
                sizePriceMultiplier = bracket.priceMultiplier;
                break;
            }
        }
        // Calculate the price after applying the size multiplier
        const basePriceAdjustedForSize = basePriceRaw * sizePriceMultiplier;
        // Calculate the specific amount added *just* by the size adjustment (can be 0)
        const sizeAdjustmentPriceAdded = basePriceAdjustedForSize - basePriceRaw;

        // --- Calculate Complexity Price Addition ---
        const complexLvl = effectiveComplexityLevel;
        const complexMultiplier = COMPLEXITY_MULTIPLIERS[complexLvl - 1] ?? 1;
        // Price added is the increase *above* 100% complexity multiplier, applied to the size-adjusted base
        const complexityPriceAdded = basePriceAdjustedForSize * (complexMultiplier - 1);
        // Subtotal after considering size and complexity
        const subtotalAfterComplexity = basePriceAdjustedForSize * complexMultiplier;

        // --- Calculate Placement Price Addition ---
        const placementFactor = effectivePlacementMultiplier; // Includes pain factor
        // Price added is the increase *above* 100% placement multiplier, applied to the previous subtotal
        const placementPriceAdded = subtotalAfterComplexity * (placementFactor - 1);
        // Subtotal after considering size, complexity, and placement
        const subtotalAfterPlacement = subtotalAfterComplexity * placementFactor;

        // --- Calculate Color Price Addition ---
        const colorMultiplier = isColor ? COLOR_MULTIPLIER : 1;
        // Price added is the increase *above* 100% color multiplier (0 if not color)
        const colorPriceAdded = subtotalAfterPlacement * (colorMultiplier - 1);
        // Subtotal after considering size, complexity, placement, and color
        const subtotalAfterColor = subtotalAfterPlacement * colorMultiplier;

        // --- Calculate Cover-Up Price Addition ---
        const coverUpMultiplier = isCoverUp ? COVER_UP_MULTIPLIER : 1;
        // Price added is the increase *above* 100% cover-up multiplier (0 if not cover-up)
        const coverUpPriceAdded = subtotalAfterColor * (coverUpMultiplier - 1);

        // --- Calculate the Feature-Based Total ---
        // This is the total price based purely on the selected features *before* hourly minimum check
        const featureBasedTotal = subtotalAfterColor * coverUpMultiplier;

        // --- HOURLY MINIMUM PRICE ENFORCEMENT ---
        // Use the greater of the calculated duration or the minimum duration for this check
        const relevantDurationMinutes = Math.max(durationMinutes, MINIMUM_DURATION_MINUTES);
        // Convert relevant duration to hours
        const durationInHours = relevantDurationMinutes / 60;

        // Calculate the minimum price required based on the hourly rate (MINIMUM_BASE_PRICE) and duration
        const minimumPriceBasedOnDuration = durationInHours * MINIMUM_BASE_PRICE;

        // Determine the final total *before rounding*. It must be the highest of:
        // 1. The absolute MINIMUM_BASE_PRICE (e.g., 1000 PHP)
        // 2. The price calculated from features (featureBasedTotal)
        // 3. The minimum price required based on duration (minimumPriceBasedOnDuration)
        const preRoundedTotal = Math.max(
            MINIMUM_BASE_PRICE,       // Absolute floor
            featureBasedTotal,        // Price from features
            minimumPriceBasedOnDuration // Price based on time * hourly rate
        );

        // Round the final total to the nearest 100 PHP for display/final quote
        const finalTotalRounded = Math.round(preRoundedTotal / 100) * 100;

        // Calculate how much was added specifically to meet the hourly minimum (if any)
        // To do this, compare the feature-based total (also rounded and floored at MINIMUM_BASE_PRICE) vs the final rounded total
        const featureTotalRoundedForComparison = Math.max(MINIMUM_BASE_PRICE, Math.round(featureBasedTotal / 100) * 100);
        // The adjustment is the difference, ensuring it's not negative
        const hourlyMinimumAdjustmentAdded = Math.max(0, finalTotalRounded - featureTotalRoundedForComparison);
        // --- END HOURLY MINIMUM PRICE LOGIC ---

        // --- Calculate Downpayment ---
        // Example: 50% of the *final adjusted & rounded* total, rounded to nearest 500 PHP, with a minimum DP of 500 PHP
   
const halfAmount = finalTotalRounded / 2;
const downpayment = Math.max(500, halfAmount >= 1000 
    ? Math.round(halfAmount / 500) * 500  // Round by 500s if >= 1000
    : Math.round(halfAmount / 100) * 100  // Round by 100s if < 1000
);

        // Return the detailed pricing breakdown, including the hourly adjustment amount
        return {
          basePriceRaw: Math.round(basePriceRaw / 100) * 100, // The starting minimum price
          sizeAdjustmentPrice: Math.round(sizeAdjustmentPriceAdded / 100) * 100, // Added cost due to size bracket
          complexityPrice: Math.round(complexityPriceAdded / 100) * 100, // Added cost due to complexity
          placementPrice: Math.round(placementPriceAdded / 100) * 100, // Added cost due to placement/pain
          colorPrice: Math.round(colorPriceAdded / 100) * 100, // Added cost due to color
          coverUpPrice: Math.round(coverUpPriceAdded / 100) * 100, // Added cost due to cover-up
          hourlyMinimumAdjustment: Math.round(hourlyMinimumAdjustmentAdded / 100) * 100, // Amount added ONLY to meet hourly rate
          total: Math.round(finalTotalRounded / 100) * 100, // The final, adjusted, rounded price
          downpayment: Math.round(downpayment / 100) * 100, // Calculated downpayment
      };
    }, [
        // Dependencies for useCallback: recalculate function only when these change
        size,
        effectiveComplexityLevel, // Derived from score, which depends on size, color, coverup
        effectivePlacementMultiplier, // Derived from placement data + pain level
        isColor,
        isCoverUp,
        calculationsEnabled,
        // Constants like MINIMUM_BASE_PRICE, brackets etc., are stable and don't need to be listed
        // `durationMinutes` is passed as an argument, so not a dependency here
    ]);

    // Memoize the result of calculatePricing, passing the current estimatedDurationMinutes
    // This ensures pricing is recalculated only when the calculatePricing function OR estimatedDurationMinutes changes
    const pricing = useMemo(() => calculatePricing(estimatedDurationMinutes), [
        calculatePricing, // The generated pricing function itself
        estimatedDurationMinutes // The duration input to the pricing function
    ]);

    // --- Effects ---

    // Effect to clamp the size value based on the selected placement's limits
    useEffect(() => {
        // Run only if a placement is selected and the size slider has been touched
        if (currentPlacement && sizeSliderTouched) {
            // Get the min/max limits safely, falling back to defaults if needed
            const minLimit = currentSizeLimits?.min ?? DEFAULT_SIZE_LIMITS.min;
            const maxLimit = currentSizeLimits?.max ?? DEFAULT_SIZE_LIMITS.max;

            // If size is below minimum (and not initial 0), set it to minimum
            if (size < minLimit && size !== 0) {
                setSize(minLimit);
            }
            // If size exceeds maximum, set it to maximum
            else if (size > maxLimit) {
                setSize(maxLimit);
            }
        }
        // Dependencies: effect runs if placement, limits, touched status, or size changes
    }, [currentPlacement, currentSizeLimits, sizeSliderTouched, size, setSize]);

    // Effect to reset dependent states when the category changes or becomes invalid
    useEffect(() => {
        // Trigger reset if the selected category exists BUT has no valid placements anymore
        // (e.g., mappings updated and category removed or emptied)
        if (selectedCategory && (!currentPlacements || currentPlacements.length === 0)) {
            // If the current category is now invalid, reset placement/interaction states
            if (placementIndex !== 0) setPlacementIndex(0);
            if (placementSliderTouched) setPlacementSliderTouched(false);
            if (sizeSliderTouched) setSizeSliderTouched(false);
            if (size !== 0) setSize(0); // Reset size as well
        }
        // Trigger reset if category is valid BUT the current placementIndex is out of bounds for the *new* list
        else if (selectedCategory && currentPlacements.length > 0) {
            const maxIndex = currentPlacements.length - 1;
            if (placementIndex > maxIndex) {
                // Index is invalid for the new list, reset to the start
                setPlacementIndex(0);
                // Also reset interaction state since the placement effectively changed
                if (placementSliderTouched) setPlacementSliderTouched(false);
                if (sizeSliderTouched) setSizeSliderTouched(false);
                if (size !== 0) setSize(0); // Reset size
            }
        }
        // Dependencies: Watch category, the list of placements for that category,
        // the index itself, and interaction states (to know *if* we need to reset them)
    }, [
        selectedCategory,
        currentPlacements,
        placementIndex,
        placementSliderTouched, // Need to read these to know *if* we should reset them
        sizeSliderTouched,
        size,
        // setPlacementIndex, setPlacementSliderTouched, etc. are stable, but include if linting demands
    ]);

    // Effect to call the onChange prop whenever relevant calculated values change
    useEffect(() => {
        if (onChange) { // Only proceed if the onChange prop is provided
            // Determine if a pain reason should be included
            const painReason =
                currentPainLevel !== null && currentPainLevel >= PAIN_WARNING_THRESHOLD
                    ? currentPainInfo?.reason // Get reason from derived info object
                    : undefined;

            // Define the default pricing structure to send if calculations are disabled
            const defaultPricingOutput = {
                basePriceRaw: 0, sizeAdjustmentPrice: 0, complexityPrice: 0,
                placementPrice: 0, colorPrice: 0, coverUpPrice: 0,
                hourlyMinimumAdjustment: 0, total: 0, downpayment: 0,
            };

            // Construct the payload object to send via onChange
            const payload: TattooCalculatorChangePayload = {
                size,
                isColor,
                selectedCategory,
                placementIndex: safePlacementIndex, // Send the validated index
                currentPlacement,
                isCoverUp,
                painLevel: currentPainLevel, // Send the derived pain level
                painReason, // Send the derived pain reason (or undefined)
                sizeSliderTouched,
                placementSliderTouched,
                // Send the calculated pricing object, or the default if calculations are disabled
                pricing: calculationsEnabled ? pricing : defaultPricingOutput,
                // Send the calculated duration, or 0 if calculations disabled
                estimatedDurationMinutes: calculationsEnabled ? estimatedDurationMinutes : 0,
                // Send calculated sessions, or 1 if calculations disabled
                estimatedSessions: calculationsEnabled ? estimatedSessions : 1,
                // Send complexity level (1-3), or 1 if calculations disabled
                complexity: calculationsEnabled ? effectiveComplexityLevel : 1,
                // Send visual score, or 1 if calculations disabled
                visualComplexityScore: calculationsEnabled ? visualComplexityScore : 1,
            };
            // Call the passed-in onChange function with the payload
            onChange(payload);
        }
        // Dependencies: Effect runs if any value included in the payload changes
    }, [
        size, isColor, selectedCategory, safePlacementIndex, currentPlacement, isCoverUp,
        pricing, // The entire memoized pricing object is a dependency
        estimatedDurationMinutes, estimatedSessions, effectiveComplexityLevel, visualComplexityScore,
        currentPainLevel, currentPainInfo, // Include source of painReason
        sizeSliderTouched, placementSliderTouched, calculationsEnabled,
        onChange, // Include the callback function itself as a dependency
    ]);

    // --- Event Handlers ---
    const handleCategoryChange = (val: number[]) => {
        if (isCalculatorDisabled) return; // Ignore if disabled
        // Use categoryKeys derived from mappings prop, excluding the initial empty ""
        const activeCategoryKeys = categoryKeys.filter((k) => k !== "");
        // Map slider value (0-based index) to the actual category key string
        const newCategory = activeCategoryKeys[val[0]] ?? ""; // Fallback to "" if index is somehow invalid

        // If the category actually changed, update state and reset dependent selections
        if (newCategory !== selectedCategory) {
            setSelectedCategory(newCategory);
            // Reset placement index and interaction states
            setPlacementIndex(0);
            setPlacementSliderTouched(false);
            setSizeSliderTouched(false);
            setSize(0); // Reset size
        }
    };

    const handlePlacementChange = (val: number[]) => {
        if (isPlacementDisabled) return; // Ignore if disabled
        const newIndex = val[0]; // Slider value is the new index
        // Update index if it changed OR if user hadn't touched placement slider before
        if (newIndex !== placementIndex || !placementSliderTouched) {
            setPlacementIndex(newIndex);
            if (!placementSliderTouched) setPlacementSliderTouched(true); // Mark as touched
            // Reset size state when placement changes
            setSizeSliderTouched(false);
            setSize(0);
        }
    };

    const handleSizeChange = (val: number[]) => {
        if (isSizeDisabled) return; // Ignore if disabled
        const newSize = val[0]; // Slider value is the new size
        setSize(newSize);
        // Mark size slider as touched on the first interaction
        if (!sizeSliderTouched) {
            setSizeSliderTouched(true);
        }
    };

    // Toggle cover-up state if base selections are made
    const handleCoverUpToggle = (checked: boolean) => {
        if (areBaseSelectionsMade) setIsCoverUp(checked);
    };

    // Toggle color state if base selections are made
    const handleColorToggle = (checked: boolean) => {
        if (areBaseSelectionsMade) setIsColor(checked);
    };

    // --- Prerequisite Message Logic ---
    // Determines the message shown when results aren't ready
    const getPrerequisiteMessage = () => {
        if (isCalculatorDisabled) return "Tattoo estimator configuration loading...";
        if (!selectedCategory) return "Select a body category to begin.";
        if (!currentPlacement || !placementSliderTouched) return "Select a specific placement area.";
        if (!sizeSliderTouched) return "Adjust the approximate size slider.";
        // Check size against derived limits *after* base selections are made
        if (areBaseSelectionsMade && size < currentSizeLimits.min) {
            return `Minimum size for ${currentPlacement} is ${currentSizeLimits.min}". Adjust size.`;
        }
        // Fallback message (should rarely be seen if logic is correct)
        return "Please complete the selections above.";
    };

    // --- Render ---
    // Keys for category slider indexing (excluding the initial empty "")
    const activeCategoryKeys = categoryKeys.filter((k) => k !== "");
    // Placement slider max index depends on the dynamic list for the current category
    const placementMaxIndex = Math.max(0, currentPlacements.length - 1);
    // Get current size limits safely for display/slider props, using defaults
    const displayMinSize = currentSizeLimits?.min ?? DEFAULT_SIZE_LIMITS.min;
    const displayMaxSize = currentSizeLimits?.max ?? DEFAULT_SIZE_LIMITS.max;

    return (
        // Main container div, applies disabled styling if mappings aren't loaded
        <div
            className={cn(
                "pt-4 pb-10", // Padding top and bottom
                isCalculatorDisabled && "opacity-50 pointer-events-none" // Style if disabled
            )}
        >
            {/* == Input Selection Area == */}

            {/* Category Slider */}
            <div
                className={cn(
                    "flex items-center gap-x-3 sm:gap-x-4 pl-4 relative transition-opacity duration-300",
                    // Add subtle glow/highlight if this is the current step needed
                    !selectedCategory && !isCalculatorDisabled && "rounded-lg bg-gradient-to-r from-white-500/5 to-blue-500/3"
                )}
            >
                {/* Label for Category */}
                <span className="flex items-center justify-center w-24 sm:w-28 h-12 flex-shrink-0 overflow-hidden">
                    <span className="font-bold text-base text-slate-300 leading-tight line-clamp-2 w-full">
                        {selectedCategory ? String(selectedCategory) : "Category"}
                    </span>
                </span>
                {/* Category Slider Control */}
                <div
                    className={cn("flex-grow relative", !selectedCategory && !isCalculatorDisabled && "rounded-md")}
                    style={ // Apply animation if this step is needed
                        !selectedCategory && !isCalculatorDisabled ? { animation: "glowPulse 3s infinite ease-in-out, rotateBrightSpot 0.5s infinite linear" } : undefined
                    }
                >
                    <Slider
                        // Map selectedCategory string back to an index in activeCategoryKeys
                        value={[selectedCategory ? activeCategoryKeys.indexOf(selectedCategory) : -1]}
                        // Max index is length - 1
                        max={Math.max(0, activeCategoryKeys.length - 1)}
                        min={0} // Min index is 0
                        step={1} // Step by 1 category at a time
                        onValueChange={handleCategoryChange} // Handler for value change
                        aria-label="Select Body Category"
                        showDivisions // Show tick marks for discrete steps
                        disabled={isCalculatorDisabled} // Disable if mappings not loaded
                        className={cn("z-10", selectedCategory ? "opacity-100" : "opacity-90")} // Style adjustments
                    />
                </div>
            </div>

            {/* Placement Slider */}
            <div> {/* Wrapper div for placement section */}
                <div
                    className={cn(
                        "flex items-center gap-x-3 sm:gap-x-4 pl-4 relative transition-opacity duration-300",
                        isPlacementDisabled && "opacity-50 blur-[0.3px] pointer-events-none", // Style if disabled
                        // Add subtle glow/highlight if this is the current step needed
                        !isPlacementDisabled && !placementSliderTouched && "rounded-lg bg-gradient-to-r from-white-500/5 to-blue-500/3"
                    )}
                >
                    {/* Label for Placement */}
                    <span className="flex items-center justify-center w-24 sm:w-28 h-12 flex-shrink-0 overflow-hidden">
                        <span className="font-bold text-base text-slate-300 leading-tight line-clamp-2 w-full">
                            {currentPlacement ? `${currentPlacement}` : "Placement"}
                        </span>
                    </span>
                    {/* Placement Slider Control */}
                    <div
                        className={cn("flex-grow relative", !isPlacementDisabled && !placementSliderTouched && "rounded-md")}
                        style={ // Apply animation if this step is needed
                            !isPlacementDisabled && !placementSliderTouched ? { animation: "glowPulse 3s infinite ease-in-out, rotateBrightSpot 0.5s infinite linear" } : undefined
                        }
                    >
                        <Slider
                            value={[safePlacementIndex]} // Use the validated safe index
                            max={placementMaxIndex} // Use max index from dynamic list
                            min={0} // Min index is 0
                            step={1} // Step by 1 placement at a time
                            onValueChange={handlePlacementChange} // Handler for value change
                            // Disable if category not selected, mappings missing, or only one placement option exists
                            disabled={isPlacementDisabled || currentPlacements.length <= 1}
                            aria-label="Select Specific Placement"
                            showDivisions // Show tick marks
                            className="z-10"
                        />
                    </div>
                </div>
            </div>

            {/* Size Slider */}
            <div className="pb-4"> {/* Wrapper div for size section */}
                <div
                    className={cn(
                        "flex items-start gap-x-3 sm:gap-x-4 pl-4 pt-4 relative transition-opacity duration-300",
                        isSizeDisabled && "opacity-50 blur-[0.3px] pointer-events-none" // Style if disabled
                    )}
                >
                    {/* Label for Size */}
                    <span className="block w-24 sm:w-28 flex-shrink-0 overflow-hidden -pt-8">
                        <span className="font-bold text-base text-slate-300 leading-tight line-clamp-2 w-full">
                            {/* Show size value if > 0, otherwise show placeholder */}
                            {size !== undefined && size > 0 ? `${size} sq. in` : "Est. Size"}
                        </span>
                    </span>
                    {/* Size Slider Control */}
                    <div className="flex-grow relative">
                        <div
                            className={cn(
                                "rounded-md",
                                // Add subtle glow/highlight if this is the current step needed
                                !isSizeDisabled && !sizeSliderTouched && "bg-gradient-to-r from-white-500/5 to-blue-500/3"
                            )}
                            style={ // Apply animation if this step is needed
                                !isSizeDisabled && !sizeSliderTouched ? { animation: "glowPulse 3s infinite ease-in-out, rotateBrightSpot 0.5s infinite linear" } : undefined
                            }
                        >
                            <Slider
                                value={[size]} // Current size value
                                // Use derived & defaulted limits for slider range
                                max={displayMaxSize}
                                min={displayMinSize}
                                step={0.5} // Allow half-inch increments
                                onValueChange={handleSizeChange} // Handler for value change
                                disabled={isSizeDisabled} // Disable based on state
                                aria-label="Select Approximate Size (square inches)"
                                showDivisions // Show tick marks (might be many)
                                className="z-10"
                            />
                        </div>
                        {/* Min/Max Size Labels */}
                        <div className="flex justify-between text-xs text-slate-500 mt-1 px-1 pt-2 min-h-[1rem]">
                            {isSizeDisabled ? (
                                <span className="invisible">-</span> // Hide labels if disabled
                            ) : (
                                <>
                                    {/* Show derived & defaulted limits */}
                                    <span>{displayMinSize}in²</span>
                                    <span>{displayMaxSize}in²</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* == Optional Selections Area (Switches) == */}
            {/* This whole section appears/disappears smoothly */}
            <div
                className={cn(
                    "transition-all duration-500 ease-in-out",
                    // Enable only if base selections are made AND calculator isn't disabled
                    areBaseSelectionsMade && !isCalculatorDisabled
                        ? "opacity-100 max-h-[500px]" // Visible and takes space
                        : "opacity-0 max-h-0 overflow-hidden" // Hidden and takes no space
                )}
            >
                <div className="mt-3 border-t pt-4 border-slate-700/50">
                    <h3 className="text-lg font-semibold text-slate-100 mb-5">
                        Optional Enhancements:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Cover-up Toggle Card - Clickable */}
                        <div
                            className={cn(
                                "bg-slate-800/40 border border-slate-700/70 hover:border-blue-600/70 hover:bg-slate-800/60",
                                "transition-all duration-300 cursor-pointer rounded-lg overflow-hidden group relative",
                                // Disable interaction if switches are disabled
                                areSwitchesDisabled && "opacity-60 pointer-events-none"
                            )}
                            // Only allow toggle if switches are enabled
                            onClick={() => !areSwitchesDisabled && handleCoverUpToggle(!isCoverUp)}
                        >
                            {/* Active state indicator line */}
                            <div
                                className={cn(
                                    "absolute h-1 w-full top-0 left-0 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent",
                                    "transition-opacity duration-300",
                                    isCoverUp ? "opacity-100" : "opacity-0" // Show if active
                                )}
                            />
                            <div className="p-4 flex items-center justify-between space-x-3">
                                {/* Icon and Label */}
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div
                                        className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-700/60 group-hover:bg-slate-700",
                                            "transition-colors duration-300",
                                            // Change background if active
                                            isCoverUp && "bg-blue-600/30 group-hover:bg-blue-600/40"
                                        )}
                                    >
                                        {/* Upload Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-slate-300 group-hover:text-slate-100 transition-colors duration-300", isCoverUp && "text-blue-300")}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    </div>
                                    <Label htmlFor="coverup-switch" className="font-medium text-base text-slate-200 cursor-pointer truncate">
                                        Cover-up / Enhancement
                                    </Label>
                                </div>
                                {/* Switch Control */}
                                <Switch
                                    id="coverup-switch"
                                    checked={isCoverUp}
                                    onCheckedChange={handleCoverUpToggle} // Use direct handler
                                    aria-label="Toggle cover-up or enhancement option"
                                    onClick={(e) => e.stopPropagation()} // Prevent card click from toggling twice
                                    disabled={areSwitchesDisabled} // Disable switch directly
                                    className="flex-shrink-0"
                                />
                            </div>
                        </div>

                        {/* Color Toggle Card - Clickable */}
                        <div
                            className={cn(
                                "bg-slate-800/40 border border-slate-700/70 hover:border-blue-600/70 hover:bg-slate-800/60",
                                "transition-all duration-300 cursor-pointer rounded-lg overflow-hidden group relative",
                                areSwitchesDisabled && "opacity-60 pointer-events-none" // Disable interaction
                            )}
                            // Only allow toggle if switches are enabled
                            onClick={() => !areSwitchesDisabled && handleColorToggle(!isColor)}
                        >
                            {/* Active state indicator line */}
                            <div
                                className={cn(
                                    "absolute h-1 w-full top-0 left-0 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent",
                                    "transition-opacity duration-300",
                                    isColor ? "opacity-100" : "opacity-0" // Show if active
                                )}
                            />
                            <div className="p-4 flex items-center justify-between space-x-3">
                                {/* Icon and Label */}
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div
                                        className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-700/60 group-hover:bg-slate-700",
                                            "transition-colors duration-300",
                                            // Change background if active
                                            isColor && "bg-blue-600/30 group-hover:bg-blue-600/40"
                                        )}
                                    >
                                        {/* Palette Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-slate-300 group-hover:text-slate-100 transition-colors duration-300", isColor && "text-blue-300")}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.83-.13 2.69-.37L12 12 .37 9.31C.13 8.47 0 7.574 0 6.647 0 4.147 1.64 2 4 2h8z" fill="currentColor" stroke="none" /><path d="M20 4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-2 8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-8-6c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                                    </div>
                                    <Label htmlFor="color-switch" className="font-medium text-base text-slate-200 cursor-pointer truncate">
                                        Color Tattoo
                                    </Label>
                                </div>
                                {/* Switch Control */}
                                <Switch
                                    id="color-switch"
                                    checked={isColor}
                                    onCheckedChange={handleColorToggle} // Use direct handler
                                    aria-label="Toggle color tattoo option"
                                    onClick={(e) => e.stopPropagation()} // Prevent card click from toggling twice
                                    disabled={areSwitchesDisabled} // Disable switch directly
                                    className="flex-shrink-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* == Results / Placeholder Area == */}
            {/* Conditional Rendering: Show Results Card OR Placeholder Message */}
            {areBaseSelectionsMade && calculationsEnabled ? (
                // --- RESULTS CARD ---
                <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950/80 border-slate-700/80 shadow-xl mt-6">
                    <CardContent className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                            {/* --- Pricing Side --- */}
                            <div className="flex flex-col justify-between space-y-4">
                                {/* Top Section: Downpayment & Pain Level */}
                                <div className="text-center md:text-left">
                                    <CardDescription className="text-sm font-medium text-blue-400 uppercase tracking-wider">
                                        Required Downpayment
                                    </CardDescription>
                                    <div className="text-4xl sm:text-5xl font-bold text-white mt-1">
                                        ₱{pricing.downpayment.toLocaleString()}
                                    </div>
                                    {/* Pain Level Info (Show if available) */}
                                    {currentPainLevel !== null && (
                                        <div className="mt-3">
                                            {/* Pain level badge */}
                                            <span
                                                className={cn(
                                                    "text-xs font-medium inline-flex items-center gap-1 px-2.5 py-1 rounded-full",
                                                    // Style badge based on pain level
                                                    currentPainLevel >= 8 ? "bg-red-900/70 text-red-300 border border-red-700/50"
                                                        : currentPainLevel >= PAIN_WARNING_THRESHOLD ? "bg-amber-900/70 text-amber-300 border border-amber-700/50"
                                                            : "bg-sky-900/70 text-sky-300 border border-sky-700/50"
                                                )}
                                            >
                                                <AlertTriangle size={12} /> Pain Level:{" "} {currentPainLevel}/10
                                            </span>
                                            {/* Optional Pain Reason */}
                                            {currentPainInfo?.reason && currentPainLevel >= PAIN_WARNING_THRESHOLD && (
                                                <p className="text-xs text-slate-400 italic mt-1.5 ml-1">
                                                    ({currentPainInfo.reason})
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Middle Section: Price Breakdown */}
                                <div className="space-y-2 border-t border-slate-700/60 pt-4 text-sm">
                                    {/* Base Price Line */}
                                    <div className="flex justify-between text-slate-400">
                                        <span>Base Price ({size} sq. in)</span>
                                        <span className="font-medium text-slate-300">
                                            ₱{pricing.basePriceRaw.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Size Adjustment Line (Show only if > 0) */}
                                    {pricing.sizeAdjustmentPrice > 0 && (
                                        <div className="flex justify-between text-slate-400">
                                            <span>+ Size Adjustment</span>
                                            <span className="font-medium text-slate-300">
                                                ₱{pricing.sizeAdjustmentPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Complexity Line (Show only if > 0) */}
                                    {pricing.complexityPrice > 0 && (
                                        <div className="flex justify-between text-slate-400">
                                            <span>
                                                + Complexity ({["Simple", "Detailed", "Intricate"][effectiveComplexityLevel - 1]})
                                            </span>
                                            <span className="font-medium text-slate-300">
                                                ₱{pricing.complexityPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Placement Line (Show only if > 0) */}
                                    {pricing.placementPrice > 0 && currentPlacement && (
                                        <div className="flex justify-between text-slate-400">
                                            <span>+ Placement ({currentPlacement})</span>
                                            <span className="font-medium text-slate-300">
                                                ₱{pricing.placementPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Color Line (Show only if > 0) */}
                                    {pricing.colorPrice > 0 && (
                                        <div className="flex justify-between text-slate-400">
                                            <span>+ Color</span>
                                            <span className="font-medium text-slate-300">
                                                ₱{pricing.colorPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Cover-up Line (Show only if > 0) */}
                                    {pricing.coverUpPrice > 0 && (
                                        <div className="flex justify-between text-slate-400">
                                            <span>+ Cover-up / Enhancement</span>
                                            <span className="font-medium text-slate-300">
                                                ₱{pricing.coverUpPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                     {/* Hourly Minimum Adjustment Line (Show only if > 0) */}
                                    {pricing.hourlyMinimumAdjustment > 0 && (
                                        <div className="flex justify-between text-amber-400/80">
                                            <span className="italic">+ Hourly Rate Adjustment</span>
                                            <span className="font-medium text-amber-300/90 italic">
                                                ₱{pricing.hourlyMinimumAdjustment.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Section: Total Price */}
                                <div className="border-t border-slate-700/60 pt-4 mt-4 text-center md:text-left">
                                    <CardDescription className="text-sm font-medium text-blue-400 uppercase tracking-wider">
                                        Total Estimated Price
                                    </CardDescription>
                                    <div className="text-4xl sm:text-5xl font-bold text-white mt-1">
                                        ₱{pricing.total.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* --- Duration Side --- */}
                            <div className="space-y-4 md:border-l border-slate-700/60 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0">
                                {/* Estimated Duration */}
                                <div className="text-center md:text-left">
                                    <CardDescription className="text-sm font-medium text-blue-400 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                                        <Clock size={14} /> Estimated Duration
                                    </CardDescription>
                                    <div className="text-3xl font-semibold text-white mt-1">
                                        {/* Format the duration using the helper */}
                                        {formatDuration(estimatedDurationMinutes)}
                                    </div>
                                </div>
                                {/* Multi-Session Warning (Show if > 1 session) */}
                                {estimatedSessions > 1 && (
                                    <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg text-center md:text-left">
                                        <p className="text-sm font-medium text-amber-300">
                                            <AlertTriangle className="inline-block mr-1.5 -mt-0.5" size={16} />
                                            Likely requires{" "}
                                            <span className="font-bold">{estimatedSessions} sessions</span>{" "}
                                            (~{MAX_SESSION_HOURS} hrs max each).
                                        </p>
                                    </div>
                                )}
                                {/* Duration Disclaimer */}
                                <p className="text-xs text-slate-500 text-center md:text-left pt-2">
                                    Actual time may vary based on final design details, your pain tolerance, required breaks, etc.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                // --- PLACEHOLDER MESSAGE ---
                // Shown when calculations are disabled or prerequisites not met
                <div className="text-center py-12 px-8 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center justify-center w-full mx-auto mt-6">
                    <div className="mb-8 bg-gradient-to-br from-amber-400/20 to-amber-600/20 p-5 rounded-full border border-amber-500/30 shadow-md">
                        <AlertTriangle size={36} className="text-amber-400" />
                    </div>
                    <div className="mb-6 max-w-sm">
                        {/* Display the dynamic prerequisite message */}
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 text-amber-400">
                            {getPrerequisiteMessage()}
                        </h3>
                        {/* Conditionally show hint about adjusting size if that's the blocker */}
                        {areBaseSelectionsMade && size < currentSizeLimits.min && (
                            <p className="text-sm text-slate-300 mb-2">
                                Adjust the size slider above to meet the minimum requirement for this placement.
                            </p>
                        )}
                    </div>
                    {/* Decorative line */}
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent my-2"></div>
                    {/* Footer text for placeholder */}
                    <p className="text-xs text-slate-400 mt-4 italic">
                        {isCalculatorDisabled
                            ? "Estimator is currently unavailable."
                            : "Once requirements are met, pricing and duration estimates will appear here."}
                    </p>
                </div>
            )}

            {/* == Disclaimer == */}
            <div className="text-xs text-slate-500 text-center px-4 pt-6">
                {" "} {/* Added top padding */}
                * All estimates are approximate. Final price and duration depend on the final design, details, and are confirmed during consultation.
                Minimum price is ₱{MINIMUM_BASE_PRICE.toLocaleString()}.
                Location: Tagbilaran City, Bohol, Philippines.
            </div>
        </div> // End main container div
    );
};

export default TattooCalculator; // Export the component for use elsewhere