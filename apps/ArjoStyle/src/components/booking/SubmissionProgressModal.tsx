// src/components/booking/SubmissionProgressModal.tsx

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, AlertTriangle, UploadCloud } from "lucide-react"; // Add more icons
import { cn } from "@/lib/utils"; // Import cn

interface SubmissionProgressModalProps {
  isOpen: boolean;
  progress: number; // Percentage 0-100
  statusText: string; // Text describing the current step
  totalFiles?: number; // Optional: total files to upload
  filesUploaded?: number; // Optional: files already uploaded
  isError?: boolean; // Flag to show error icon
  isSuccess?: boolean; // Flag to show success icon
}

export const SubmissionProgressModal: React.FC<
  SubmissionProgressModalProps
> = ({
  isOpen,
  progress,
  statusText,
  totalFiles,
  filesUploaded,
  isError = false,
  isSuccess = false,
}) => {
  let IconComponent = Loader2; // Default to loader
  let iconClassName = "h-8 w-8 animate-spin text-primary"; // Default class

  if (isSuccess) {
    IconComponent = CheckCircle;
    iconClassName = "h-8 w-8 text-green-500";
  } else if (isError) {
    IconComponent = AlertTriangle;
    iconClassName = "h-8 w-8 text-destructive";
  } else if (
    statusText.toLowerCase().includes("uploading") ||
    statusText.toLowerCase().includes("processing image")
  ) {
    // Example: Use upload icon during file processing stage
    IconComponent = UploadCloud;
    iconClassName = "h-8 w-8 text-primary animate-pulse"; // Different animation maybe
  }
  // Add more conditions for other icons if needed

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent
        className="sm:max-w-[425px] submission-modal-content" // Added class to hide default 'X' via CSS
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => e.preventDefault()} // Optional
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Submitting Your Request</DialogTitle>
          <DialogDescription>
            Please wait while we process your booking...
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 px-2 space-y-4">
          <div className="flex justify-center items-center mb-4 h-8">
            {" "}
            {/* Fixed height */}
            <IconComponent
              className={cn("transition-all", iconClassName)}
            />{" "}
            {/* Apply dynamic icon and classes */}
          </div>
          {/* Add animation to progress bar */}
          <Progress
            value={progress}
            className="w-full [&>div]:transition-all [&>div]:duration-500 [&>div]:ease-out"
          />
          {/* Add animation to status text */}
          <p className="text-center text-sm text-muted-foreground mt-2 transition-opacity duration-300 min-h-[20px]">
            {" "}
            {/* Added min-height */}
            {statusText}
            {totalFiles &&
              filesUploaded !== undefined &&
              progress < 100 &&
              !isError &&
              !isSuccess && ( // Show counts only during upload phase
                <span className="ml-1">
                  ({filesUploaded} / {totalFiles})
                </span>
              )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Remember to add the CSS in src/index.css:
// .submission-modal-content > button[aria-label="Close"] { display: none; }
