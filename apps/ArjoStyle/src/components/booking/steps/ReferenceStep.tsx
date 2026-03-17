// src/components/booking/steps/ReferenceStep.tsx

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ExampleStylesCarousel from "./ExampleStylesCarousel";
import CreativeFreedomSlider from "./CreativeFreedomSlider";
import ImageUploadSection from "./ImageUploadSection";
import FileSubmissionGuideOverlay from "./FileSubmissionGuideOverlay";
import AdditionalDetailsSection from "./AdditionalDetailsSection";

import {
  TATTOO_STYLE_OPTIONS,
  STYLE_OPTIONS_REQUIRING_DESCRIPTION,
} from "./TattooStyleOptions";

import { BookingFormData } from "@/types/bookings"; // Assuming BookingFormData includes carouselTouched?: boolean
import { getFreedomDescription } from "@/lib/formatters";

// Constants...
const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

interface ReferenceStepProps {
  formData: BookingFormData; // Use the base type, assuming it has carouselTouched?
  updateFormData: (data: Partial<BookingFormData>) => void;
  guideSeen: boolean;
  markGuideAsSeen: () => void;
}

// Helper Function...

export const ReferenceStep: React.FC<ReferenceStepProps> = ({
  formData,
  updateFormData,
  guideSeen,
  markGuideAsSeen,
}) => {
  console.log(
    "ReferenceStep rendering. formData.carouselTouched:",
    formData.carouselTouched
  ); // Debug log

  // State...
  const [images, setImages] = useState<File[]>(formData.referenceImages || []);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGuideOverlayOpen, setIsGuideOverlayOpen] = useState(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false); // Keep track if a drag/button interaction changed the index, // so we know whether to call onSelectStyle on pointer up/leave

  // Directly use formData.carouselTouched for UI logic
  const carouselTouched = !!formData.carouselTouched; // Ensure boolean for checks

  // Effect for showing guide...
  useEffect(() => {
    if (!guideSeen) {
      console.log(
        "ReferenceStep mounted, guide not seen yet. Opening overlay."
      );
      setIsGuideOverlayOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs only once on mount

  const handleCloseGuide = () => {
    console.log("Closing reference guide overlay.");
    setIsGuideOverlayOpen(false);
    markGuideAsSeen();
  };

  const handleShowGuideClick = () => {
    console.log("Manually opening reference guide overlay.");
    setIsGuideOverlayOpen(true);
  };

  // File processing logic (processFiles, useEffect for images) ...
  const processFiles = useCallback(
    /* ... (implementation remains the same) ... */
    (filesToProcess: FileList | File[]): void => {
      setUploadError(null);
      const fileArray = Array.from(filesToProcess);
      let acceptedFiles: File[] = [];
      let currentError: string | null = null;
      const availableSlots = MAX_IMAGES - images.length;

      if (availableSlots <= 0) {
        setUploadError(`You can upload up to ${MAX_IMAGES} images.`);
        return;
      }

      const processableFiles = fileArray.slice(0, availableSlots);

      acceptedFiles = processableFiles.filter((file) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          if (!currentError) {
            currentError = `File "${file.name}" has an unsupported type. Please upload JPG, PNG, GIF, or WEBP.`;
          }
          return false;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          if (!currentError) {
            currentError = `File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`;
          }
          return false;
        }
        return true;
      });

      // Handle error if some files were skipped due to limit
      if (
        fileArray.length > acceptedFiles.length &&
        !currentError &&
        acceptedFiles.length < availableSlots &&
        availableSlots > 0
      ) {
        const skippedCount = fileArray.length - acceptedFiles.length;
        currentError = `Skipped ${skippedCount} file(s). You can upload ${
          availableSlots - acceptedFiles.length
        } more. Some files might have invalid types or sizes.`;
      } else if (
        fileArray.length > processableFiles.length &&
        !currentError &&
        acceptedFiles.length === availableSlots
      ) {
        const skippedCount = fileArray.length - acceptedFiles.length;
        currentError = `Maximum of ${MAX_IMAGES} images reached. ${skippedCount} file(s) were not added.`;
      }

      if (acceptedFiles.length > 0) {
        setImages((prevImages) => {
          const updated = [...prevImages, ...acceptedFiles];
          updateFormData({ referenceImages: updated }); // Update parent state
          return updated;
        });
      }

      if (currentError) {
        setUploadError(currentError);
      }
    },
    [images.length, updateFormData] // updateFormData is now a dependency
  );

  useEffect(() => {
    // Sync local image state if formData changes from parent (e.g., navigating back/forth)
    if (formData.referenceImages && formData.referenceImages !== images) {
      setImages(formData.referenceImages);
    }
    // No images state in deps to avoid loop if updateFormData causes re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.referenceImages]);

  // Determine if style description is needed...
  const isStyleDescriptionRequired =
    STYLE_OPTIONS_REQUIRING_DESCRIPTION.includes(
      formData.primaryTattooStyle || ""
    );
  const isStyleDescriptionEmpty = !(formData.styleDescription || "").trim();

  // --- FIX: Simplify this handler ---
  // This function is called by ExampleStylesCarousel via the onSelectStyle prop
  const handleCarouselSelectStyle = useCallback(
    (style: string) => {
      console.log("ReferenceStep: Carousel style selected via prop:", style);
      console.log(
        "ReferenceStep: current formData.primaryTattooStyle BEFORE update:",
        formData.primaryTattooStyle
      );
      console.log(
        "ReferenceStep: current formData.carouselTouched BEFORE update:",
        formData.carouselTouched
      );

      const updatePayload: Partial<BookingFormData> = {
        carouselTouched: true, // Always mark as touched when a style is selected
      };

      // Only include the style change if it's actually different
      if (style !== formData.primaryTattooStyle) {
        console.log("ReferenceStep: Style is NEW. Updating style and touched.");
        updatePayload.primaryTattooStyle = style;
      } else {
        console.log(
          "ReferenceStep: Style is SAME. Only ensuring touched status is true."
        );
        // No need to conditionally add carouselTouched: true, it's already in payload
      }

      console.log("ReferenceStep: Calling updateFormData with:", updatePayload);
      updateFormData(updatePayload); // Single call to update state in BookingModal
    },
    [formData.primaryTattooStyle, formData.carouselTouched, updateFormData]
  ); // Added formData.carouselTouched dependency
  // --- End Fix ---

  return (
    <div>
      {/* File Submission Guide Overlay */}
      <FileSubmissionGuideOverlay
        open={isGuideOverlayOpen}
        onClose={handleCloseGuide}
        placement={formData.currentPlacement}
      />
      {/* Disable rest of form if overlay is open */}
      <div
        className={
          isGuideOverlayOpen ? "pointer-events-none opacity-40 select-none" : ""
        }
      >
        {/* 1. Style Selection Carousel */}
        {/* Pass the *correct* handler down */}
        <ExampleStylesCarousel
          styles={TATTOO_STYLE_OPTIONS}
          currentStyle={formData.primaryTattooStyle || ""}
          onSelectStyle={handleCarouselSelectStyle} // Pass the ReferenceStep handler
          formData={formData} // Pass for AdditionalDetailsSection
          updateFormData={updateFormData} // Pass for AdditionalDetailsSection
        />
        {/* 2. Sections dependent on carousel interaction */}
        <div
          className={cn(
            "transition-opacity duration-300 ease-in-out", // Add transition
            carouselTouched
              ? "opacity-100"
              : "opacity-40 pointer-events-none select-none relative"
          )}
        >
                <div className="w-full px-2 sm:px-4 flex flex-col items-center mt-4">
        {/* ... Divider and Button ... */}{" "}
        <button
          type="button"
          className="flex flex-row items-center justify-center w-full hover:bg-muted/10 bg-background dark:bg-gray-800 border border-input rounded-lg shadow-sm "
          onClick={() => setShowAdditionalDetails(true)}
        >
          {" "}
          <div
            className="h-px w-full rounded-full animate-pulse"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent 0%, hsl(var(--muted-foreground)/0.3) 60%)",
            }}
          />{" "}
          <div
            className={cn(
              "w-auto flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2 rounded-xl",
              "bg-transparent text-muted-foreground hover:bg-muted/10 ",
              "dark:text-zinc-400 dark:hover:text-zinc-200",
              "text-sm font-medium tracking-wide ",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            )}
            // disabled={!currentStyle} // Enable/disable based on actual selection if desired
          >
            <span>Add Details</span>{" "}
            <span className="opacity-60 text-xs">(Optional)</span>{" "}
          </div>{" "}
          <div
            className="h-px w-full rounded-full animate-pulse"
            style={{
              backgroundImage:
                "linear-gradient(to left, transparent 0%, hsl(var(--muted-foreground)/0.3) 60%)",
            }}
          />{" "}
        </button>{" "}
      </div>
                <AnimatePresence>
        {" "}
        {showAdditionalDetails && (
          <motion.div // ... (modal backdrop animation) ...
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-200 ease-in-out"
            tabIndex={-1}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowAdditionalDetails(false);
            }}
          >
            {" "}
            <motion.div // ... (modal content animation) ...
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-background dark:bg-slate-800 mt-0 text-foreground dark:text-zinc-100 rounded-xl shadow-2xl p-6 w-full max-w-lg relative mx-auto transition-all duration-200 ease-out"
              onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              {/* Close Button */}{" "}
              <button
                type="button"
                className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setShowAdditionalDetails(false)}
                aria-label="Close additional details modal"
              >
                {/* Close Icon SVG */}{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />{" "}
                </svg>{" "}
              </button>{" "}
              {/* Modal Content - Still needs formData and updateFormData */}{" "}
              <AdditionalDetailsSection
                formData={formData}
                handleInputChange={
                  (field, value) => updateFormData({ [field]: value }) // This update is correct and necessary here
                }
              />
              {/* Modal Footer */}{" "}
              <div className="mt-6 flex justify-end border-t border-border dark:border-zinc-700 pt-4">
                {" "}
                <button
                  type="button"
                  className="px-5 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 transition-colors"
                  onClick={() => setShowAdditionalDetails(false)}
                >
                  Done{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </motion.div>
        )}{" "}
      </AnimatePresence>{" "}
          {!carouselTouched && (
            <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-background/80 dark:bg-gray-900/80 text-lg font-semibold text-white rounded-lg shadow-lg p-4 text-center">
              <span>
                Please select a style from the carousel above to continue
              </span>
            </div>
          )}

          {/* 3. Conditional Description (Animated) */}

          {/* 4. Image Upload Section */}
          <ImageUploadSection
            images={images}
            setImages={(newImages) => {
              setImages(newImages); // Update local state for immediate UI feedback
              updateFormData({ referenceImages: newImages }); // Update parent state
            }}
            uploadError={uploadError}
            setUploadError={setUploadError}
            isDraggingOver={isDraggingOver}
            setIsDraggingOver={setIsDraggingOver}
            handleFileChange={(e) => processFiles(e.target.files || [])}
            removeImage={(idx) => {
              const remainingImages = images.filter((_, i) => i !== idx);
              setImages(remainingImages);
              updateFormData({ referenceImages: remainingImages });
            }}
            handleDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            handleDragLeave={() => setIsDraggingOver(false)}
            handleDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              processFiles(e.dataTransfer.files);
            }}
            maxImages={MAX_IMAGES}
            allowedImageTypes={ALLOWED_IMAGE_TYPES}
            maxFileSizeMb={MAX_FILE_SIZE_MB}
            onShowGuide={handleShowGuideClick}
          />

          {/* 5. Creative Freedom Slider */}
          <CreativeFreedomSlider
            value={formData.creativeFreedom}
            onChange={(val) => updateFormData({ creativeFreedom: val })}
            getFreedomDescription={getFreedomDescription}
          />
        </div>{" "}
        {/* End carouselTouched dependent block */}
      </div>{" "}
      {/* End Guide Overlay wrapper */}
    </div>
  );
};
