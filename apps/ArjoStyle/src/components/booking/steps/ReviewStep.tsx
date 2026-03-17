// src/components/booking/steps/ReviewStep.tsx (Corrected HTML Structure)

import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  CreditCard,
  User,
  Clock,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Send,
  Info,
  MessageSquareText,
  PhoneCall,
  Instagram,
  Facebook,
  NotebookPen,
  Palette,
  Target,
  Eye,
  Sparkles,
  AlertCircleIcon,
  CalendarClock,
  Loader2,
  FileImage,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { BookingFormData } from "@/types/bookings";
import { supabase } from "@/lib/supabaseClient"; // Your standard client for invoking functions
import { useToast } from "@/hooks/use-toast";
import { SubmissionProgressModal } from "../SubmissionProgressModal";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// --- Helper Functions ---

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as Data URL"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file); // Read as Base64 Data URL
  });
};

const formatDateForDisplay = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "Not selected";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    // Check if dateObj is a valid date AFTER conversion attempt
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date value received:", date);
      // Try parsing differently if it might be YYYY-MM-DD from form state
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Adjust for potential timezone issues when creating date from YYYY-MM-DD
        const utcDate = new Date(date + "T00:00:00Z");
        if (!isNaN(utcDate.getTime())) {
          return new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC", // Display in UTC to match input
          }).format(utcDate);
        }
      }
      return "Invalid Date";
    }
    // Use default locale formatting if valid Date object
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  } catch (e) {
    console.error("Error formatting date:", e, "Input was:", date);
    return "Invalid date";
  }
};

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return "N/A";
  // Assuming PHP currency
  return `₱${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`; // Format with commas, no decimals
};

const formatDuration = (totalMinutes: number | undefined): string => {
  const MINIMUM_DURATION_MINUTES = 30;
  if (totalMinutes === undefined || totalMinutes < 1 || isNaN(totalMinutes))
    return "N/A";
  const roundedMinutes = Math.max(
    MINIMUM_DURATION_MINUTES,
    Math.round(totalMinutes / 30) * 30
  );
  if (roundedMinutes < MINIMUM_DURATION_MINUTES)
    return `Approx. ${MINIMUM_DURATION_MINUTES} minutes`;
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  let result = "";
  if (hours > 0) result += `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) {
    if (result.length > 0) result += " ";
    result += `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  // Handle case where duration is exactly minimum (e.g. 30 mins)
  if (result.length === 0 && roundedMinutes === MINIMUM_DURATION_MINUTES) {
    return `Approx. ${MINIMUM_DURATION_MINUTES} minutes`;
  }
  return result.length > 0
    ? `Approx. ${result}`
    : `Approx. ${MINIMUM_DURATION_MINUTES} minutes`; // Fallback just in case
};

const getFreedomDescription = (value: number | undefined): string => {
  const freedomValue = value ?? 50; // Default to 50 if undefined
  if (freedomValue <= 20) return "Follow References Closely";
  if (freedomValue <= 40) return "Mostly Based on References";
  if (freedomValue <= 60) return "Balanced Interpretation";
  if (freedomValue <= 80) return "Mostly Artist's Interpretation";
  return "Full Creative Freedom";
};

const formatUrgency = (urgency: string | undefined): string => {
  // Default to 'normal' if undefined or empty
  const safeUrgency = urgency || "normal";
  switch (safeUrgency) {
    case "flexible":
      return "Flexible";
    case "normal":
      return "Standard";
    case "specific":
      return "Specific Date Needed";
    default:
      return "Standard"; // Fallback
  }
};

const displayOrDefault = (
  text: string | undefined | null,
  placeholder: React.ReactNode = "Not specified"
): React.ReactNode => {
  // Check for empty string as well
  return text ? text : placeholder;
};
// --- End Helper Functions ---

// --- Props Interface ---
interface ReviewStepProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onSubmitSuccess?: () => void; // Callback when submission is fully successful
}

// --- Component Definition ---
export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  updateFormData,
  onSubmitSuccess,
}) => {
  // --- State ---
  const [termsAgreed, setTermsAgreed] = useState(formData.termsAgreed || false);
  const [medicalConfirmed, setMedicalConfirmed] = useState(
    formData.medicalConfirmed || false
  );
  const [ageConfirmed, setAgeConfirmed] = useState(
    formData.ageConfirmed || false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionStatusText, setSubmissionStatusText] = useState("");
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const { toast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // --- Memos and Derived State ---
  const allTermsChecked = termsAgreed && medicalConfirmed && ageConfirmed;
  // Ensure dateOfBirth is also checked as it's required for age confirmation
  const isMissingInfo = useMemo(
    () =>
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.dateOfBirth,
    [formData.name, formData.email, formData.phone, formData.dateOfBirth]
  );
  const isSubmissionDisabled =
    !allTermsChecked || isMissingInfo || isSubmitting || !executeRecaptcha;
  const pricing = useMemo(
    () =>
      formData.pricing || {
        basePriceRaw: 0,
        complexityPrice: 0,
        placementPrice: 0,
        colorPrice: 0,
        coverUpPrice: 0,
        total: 0,
      },
    [formData.pricing]
  );
  // Ensure total is treated as a number for calculation
  const deposit = useMemo(
    () => Math.round((pricing?.total || 0) / 2 / 100) * 100,
    [pricing?.total]
  );
  const complexityLabel = useMemo(
    () =>
      formData.complexity
        ? ["Simple", "Detailed", "Intricate"][formData.complexity - 1] ?? "N/A"
        : "N/A",
    [formData.complexity]
  );

  // --- Handlers ---
  const handleTermsChange = (checked: boolean) => {
    setTermsAgreed(checked);
    updateFormData({ termsAgreed: checked });
  };
  const handleMedicalChange = (checked: boolean) => {
    setMedicalConfirmed(checked);
    updateFormData({ medicalConfirmed: checked });
  };
  const handleAgeChange = (checked: boolean) => {
    setAgeConfirmed(checked);
    updateFormData({ ageConfirmed: checked });
  };

  // --- Final Submit Handler (Calls Edge Function) ---
  const handleFinalSubmit = async () => {
    if (isSubmissionDisabled) {
      console.log("Submit button clicked but submission is disabled.");
      if (!executeRecaptcha) console.log("Reason: executeRecaptcha not ready.");
      if (isMissingInfo) console.log("Reason: Missing required info.");
      if (!allTermsChecked) console.log("Reason: Terms not agreed.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress(0);
    setSubmissionStatusText("Preparing request...");
    setTotalFilesToUpload(formData.referenceImages?.length ?? 0);

    try {
      // 1. Get reCAPTCHA token
      setSubmissionStatusText("Verifying you are human...");
      const recaptchaToken = await executeRecaptcha("booking_submit");
      if (!recaptchaToken) {
        throw new Error("Could not get reCAPTCHA token. Please try again.");
      }
      console.log("reCAPTCHA token obtained.");
      setSubmissionProgress(10);

      // 2. Prepare file data (Convert Files to Base64 Data URLs)
      setSubmissionStatusText(`Processing ${totalFilesToUpload} image(s)...`);
      const referenceFilesBase64: { name: string; dataUrl: string }[] = [];
      if (formData.referenceImages && formData.referenceImages.length > 0) {
        for (let i = 0; i < formData.referenceImages.length; i++) {
          const file = formData.referenceImages[i];
          setSubmissionStatusText(
            `Processing image ${i + 1} of ${totalFilesToUpload}...`
          );
          const dataUrl = await fileToDataUrl(file);
          referenceFilesBase64.push({ name: file.name, dataUrl });
          setSubmissionProgress(
            10 + Math.round(((i + 1) / totalFilesToUpload) * 20)
          );
        }
      }
      console.log(`Processed ${referenceFilesBase64.length} files.`);
      setSubmissionProgress(30);

      // 3. Prepare Payload for Edge Function
      const payload = {
        formData: formData,
        recaptchaToken: recaptchaToken,
        referenceFilesBase64: referenceFilesBase64,
      };

      // 4. Call Edge Function
      setSubmissionStatusText("Sending request securely...");
      setSubmissionProgress(40);

      const { data: functionResponse, error: functionError } =
        await supabase.functions.invoke(
          "submit-booking", // Your Edge Function name
          { body: JSON.stringify(payload) }
        );

      if (functionError) throw functionError;
      if (functionResponse?.error) throw new Error(functionResponse.error);

      // --- Handle Success ---
      console.log(
        "Booking submitted successfully via Edge Function:",
        functionResponse
      );
      setSubmissionProgress(100);
      setSubmissionStatusText("Booking request sent!");
      toast({
        title: "Booking Request Submitted! 🎉",
        description: "We'll contact you shortly via your preferred method.",
        duration: 7000,
      });

      setTimeout(() => {
        setIsSubmitting(false);
        onSubmitSuccess?.();
      }, 2500);
    } catch (error: unknown) {
      // --- Handle Error ---
      console.error("Submission error:", error);
      setIsSubmitting(false);
      setSubmissionProgress(0);
      setSubmissionStatusText("Submission Failed");
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: `Failed to submit booking request: ${
          (error as Error).message || "Please try again."
        }`,
        duration: 9000,
      });
    }
  };

  // --- Component JSX ---
  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">
            Review Your Booking Request
          </h2>
          <p className="text-muted-foreground mt-2">
            Almost there! Please check the details you've provided.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              {" "}
              <CardTitle className="flex items-center gap-2">
                {" "}
                <User className="h-5 w-5" /> Contact & Personal Info{" "}
              </CardTitle>{" "}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                {" "}
                <span className="text-muted-foreground">Name:</span>{" "}
                <span
                  className={cn(
                    "font-medium text-right",
                    !formData.name && "text-destructive"
                  )}
                >
                  {displayOrDefault(formData.name, "Missing")}
                </span>{" "}
              </div>
              <div className="flex justify-between">
                {" "}
                <span className="text-muted-foreground">Email:</span>{" "}
                <span
                  className={cn(
                    "font-medium text-right break-all",
                    !formData.email && "text-destructive"
                  )}
                >
                  {displayOrDefault(formData.email, "Missing")}
                </span>{" "}
              </div>
              <div className="flex justify-between">
                {" "}
                <span className="text-muted-foreground">Phone:</span>{" "}
                <span
                  className={cn(
                    "font-medium text-right",
                    !formData.phone && "text-destructive"
                  )}
                >
                  {displayOrDefault(formData.phone, "Missing")}
                </span>{" "}
              </div>
              <div className="flex justify-between">
                {" "}
                <span className="text-muted-foreground">
                  Date of Birth:
                </span>{" "}
                <span
                  className={cn(
                    "font-medium text-right",
                    !formData.dateOfBirth && "text-destructive"
                  )}
                >
                  {formatDateForDisplay(formData.dateOfBirth)}
                </span>{" "}
              </div>
              <div className="flex justify-between">
                {" "}
                <span className="text-muted-foreground">
                  Preferred Contact:
                </span>{" "}
                <span className="font-medium text-right capitalize">
                  {displayOrDefault(
                    formData.preferredContactMethod,
                    "Email/Phone"
                  )}
                </span>{" "}
              </div>
              {formData.instagramHandle && (
                <div className="flex justify-between">
                  {" "}
                  <span className="text-muted-foreground">
                    <Instagram size={14} className="inline mr-1" /> Instagram:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {displayOrDefault(formData.instagramHandle)}
                  </span>{" "}
                </div>
              )}
              {formData.facebookProfile && (
                <div className="flex justify-between">
                  {" "}
                  <span className="text-muted-foreground">
                    <Facebook size={14} className="inline mr-1" /> Facebook:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {displayOrDefault(formData.facebookProfile)}
                  </span>{" "}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requested Appointment Card */}
          <Card>
            <CardHeader>
              {" "}
              <CardTitle className="flex items-center gap-2">
                {" "}
                <CalendarDays className="h-5 w-5" /> Requested Appointment{" "}
              </CardTitle>{" "}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                {" "}
                <span className="text-muted-foreground">Date:</span>{" "}
                <span
                  className={cn(
                    "font-medium text-right",
                    !formData.appointmentDate && "text-destructive"
                  )}
                >
                  {formatDateForDisplay(formData.appointmentDate)}
                </span>{" "}
              </div>
              <div className="flex justify-between">
                {" "}
                <span className="text-muted-foreground">Time:</span>{" "}
                <span
                  className={cn(
                    "font-medium text-right",
                    !formData.appointmentTime && "text-destructive"
                  )}
                >
                  {displayOrDefault(formData.appointmentTime, "Missing")}
                </span>{" "}
              </div>
              {/* <div className="flex justify-between"> <span className="text-muted-foreground">Flexibility:</span> <span className="font-medium text-right">{formatUrgency(formData.urgencyLevel)}</span> </div> */}
              {formData.artistPreference && (
                <div className="flex justify-between">
                  {" "}
                  <span className="text-muted-foreground">
                    Artist Preference:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {formData.artistPreference}
                  </span>{" "}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tattoo Request Summary & Estimate Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              {" "}
              <CardTitle className="flex items-center gap-2">
                {" "}
                <Layers className="h-5 w-5" /> Tattoo Request Summary{" "}
              </CardTitle>{" "}
              <CardDescription>
                Review the design details and estimates. Estimates are subject
                to artist confirmation.
              </CardDescription>{" "}
            </CardHeader>
            <CardContent>
              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-6">
                <div className="flex justify-between sm:col-span-1">
                  {" "}
                  <span className="text-muted-foreground">Placement:</span>{" "}
                  <span className="font-medium text-right">
                    {displayOrDefault(formData.currentPlacement)}
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-1">
                  {" "}
                  <span className="text-muted-foreground">Size:</span>{" "}
                  <span className="font-medium text-right">
                    {formData.size ? `Approx. ${formData.size}"` : "N/A"}
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-1">
                  {" "}
                  <span className="text-muted-foreground">
                    Complexity:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {complexityLabel}
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-1">
                  {" "}
                  <span className="text-muted-foreground">Color:</span>{" "}
                  <span className="font-medium text-right">
                    {formData.isColor ? "Yes" : "Black & Grey"}
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-1">
                  {" "}
                  <span className="text-muted-foreground">
                    Cover-up/Enhance:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {formData.isCoverUp ? "Yes" : "No"}
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-1">
                  {" "}
                  <span className="text-muted-foreground">
                    References:
                  </span>{" "}
                  <span className="font-medium text-right flex items-center gap-1">
                    {formData.referenceImages?.length ?? 0}{" "}
                    <FileImage size={14} />
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-3">
                  {" "}
                  <span className="text-muted-foreground">
                    Creative Freedom:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {getFreedomDescription(formData.creativeFreedom)}
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-3">
                  {" "}
                  <span className="text-muted-foreground">
                    Tattoo Style:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {formData.primaryTattooStyle || "Not specified"}
                  </span>{" "}
                </div>
                <div className="flex justify-between sm:col-span-3">
                  {" "}
                  <span className="text-muted-foreground">
                    Style Description:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {formData.styleDescription || "Not specified"}
                  </span>{" "}
                </div>
              </div>
              {/* Estimates */}
              <div className="border-t pt-4 space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  {" "}
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock size={14} />
                    Est. Duration:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {formatDuration(formData.estimatedDurationMinutes)}
                  </span>{" "}
                </div>
                {formData.estimatedSessions &&
                  formData.estimatedSessions > 1 && (
                    <p className="text-xs text-amber-700 font-medium text-right bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded">
                      {" "}
                      Likely requires {
                        formData.estimatedSessions
                      } sessions.{" "}
                    </p>
                  )}
                <div className="flex justify-between items-center text-sm">
                  {" "}
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CreditCard size={14} />
                    Est. Price:
                  </span>{" "}
                  <span className="font-medium text-right">
                    {formatCurrency(pricing.total)}
                  </span>{" "}
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {" "}
                  <Info size={12} className="inline mr-1" /> Duration/price are
                  initial estimates. Final details confirmed by artist.{" "}
                </p>
              </div>
              <Separator className="my-4" />
              {/* Notes */}
              <div className="space-y-4 text-sm">
                <h4 className="font-medium text-base mb-2">
                  Your Notes & Requirements:
                </h4>
                {formData.specificRequirements && (
                  <div>
                    <Label className="text-muted-foreground block mb-1">
                      Overall Idea:
                    </Label>
                    <p className="whitespace-pre-wrap break-words p-2 bg-muted/50 rounded text-foreground">
                      {formData.specificRequirements}
                    </p>
                  </div>
                )}
                {formData.mustHaveElements && (
                  <div>
                    <Label className="text-muted-foreground block mb-1">
                      Must-Haves:
                    </Label>
                    <p className="whitespace-pre-wrap break-words p-2 bg-muted/50 rounded text-foreground">
                      {formData.mustHaveElements}
                    </p>
                  </div>
                )}
                {formData.colorPreferences && (
                  <div>
                    <Label className="text-muted-foreground block mb-1">
                      Color Prefs:
                    </Label>
                    <p className="whitespace-pre-wrap break-words p-2 bg-muted/50 rounded text-foreground">
                      {formData.colorPreferences}
                    </p>
                  </div>
                )}
                {formData.placementNotes && (
                  <div>
                    <Label className="text-muted-foreground block mb-1">
                      Placement Notes:
                    </Label>
                    <p className="whitespace-pre-wrap break-words p-2 bg-muted/50 rounded text-foreground">
                      {formData.placementNotes}
                    </p>
                  </div>
                )}
                {!(
                  formData.specificRequirements ||
                  formData.mustHaveElements ||
                  formData.colorPreferences ||
                  formData.placementNotes
                ) && (
                  <p className="text-muted-foreground italic">
                    No specific details provided.
                  </p>
                )}
              </div>
              {/* Display Reference Image Filenames (Optional but helpful) */}
              {formData.referenceImages &&
                formData.referenceImages.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-muted-foreground block mb-2 font-medium text-base">
                      Uploaded References:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.referenceImages.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 text-xs bg-muted p-1.5 rounded"
                        >
                          <ImageIcon
                            size={12}
                            className="text-muted-foreground"
                          />
                          <span
                            className="truncate max-w-[150px]"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Next Steps & Confirmation Card */}
          <Card className="md:col-span-2 border-primary/50 bg-primary/5">
            <CardHeader>
              {" "}
              <CardTitle className="flex items-center gap-2">
                {" "}
                <Send className="h-5 w-5" /> Next Steps & Booking Confirmation{" "}
              </CardTitle>{" "}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* --- FIX Start: Separate <p> and <ul> --- */}
              <p>
                {" "}
                After submitting this request, your chosen artist (or the
                studio) will review the details, including your reference images
                and notes.{" "}
              </p>
              <p>
                {" "}
                We will contact you via your preferred method (
                {displayOrDefault(
                  formData.preferredContactMethod,
                  formData.email || formData.phone
                )}
                ) to:{" "}
              </p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                {" "}
                {/* List is now a sibling of the <p> above */}{" "}
                <li>Discuss the design and finalize details.</li>{" "}
                <li>Confirm the final price and estimated duration.</li>{" "}
                <li>Verify the appointment date and time.</li>{" "}
                <li>
                  Arrange the <strong>50% non-refundable deposit</strong>{" "}
                  (estimated: {formatCurrency(deposit)}) required to secure your
                  booking slot.
                </li>{" "}
              </ul>
              {/* --- FIX End --- */}
              <p className="font-medium">
                {" "}
                Your booking is only confirmed once the deposit has been
                received.{" "}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agreement Card */}
        <Card>
          <CardHeader>
            {" "}
            <CardTitle>Agreement</CardTitle>{" "}
            <CardDescription>
              Please review and agree before submitting.
            </CardDescription>{" "}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              {" "}
              <Checkbox
                id="terms"
                checked={termsAgreed}
                onCheckedChange={(checked) =>
                  handleTermsChange(Boolean(checked))
                }
                aria-labelledby="terms-label"
              />{" "}
              <div className="grid gap-1.5 leading-none">
                {" "}
                <Label
                  htmlFor="terms"
                  id="terms-label"
                  className="font-medium cursor-pointer"
                >
                  {" "}
                  I agree to the studio{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    terms & conditions
                  </a>
                  .<span className="text-destructive">*</span>{" "}
                </Label>{" "}
              </div>{" "}
            </div>
            <div className="flex items-start space-x-3">
              {" "}
              <Checkbox
                id="medical"
                checked={medicalConfirmed}
                onCheckedChange={(checked) =>
                  handleMedicalChange(Boolean(checked))
                }
                aria-labelledby="medical-label"
              />{" "}
              <div className="grid gap-1.5 leading-none">
                {" "}
                <Label
                  htmlFor="medical"
                  id="medical-label"
                  className="font-medium cursor-pointer"
                >
                  {" "}
                  I understand I must disclose relevant medical info on the
                  in-person consent form.
                  <span className="text-destructive">*</span>{" "}
                </Label>{" "}
              </div>{" "}
            </div>
            <div className="flex items-start space-x-3">
              {" "}
              <Checkbox
                id="ageConfirm"
                checked={ageConfirmed}
                onCheckedChange={(checked) => handleAgeChange(Boolean(checked))}
                aria-labelledby="age-label"
              />{" "}
              <div className="grid gap-1.5 leading-none">
                {" "}
                <Label
                  htmlFor="ageConfirm"
                  id="age-label"
                  className="font-medium cursor-pointer"
                >
                  {" "}
                  I confirm I am 18+ and will provide valid ID.
                  <span className="text-destructive">*</span>{" "}
                </Label>{" "}
              </div>{" "}
            </div>
          </CardContent>
        </Card>

        {/* Final Action Button */}
        <div className="text-center pt-4">
          <Button
            size="lg"
            className="px-8 w-full sm:w-auto"
            disabled={isSubmissionDisabled}
            onClick={handleFinalSubmit}
          >
            {isSubmitting ? (
              <>
                {" "}
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...{" "}
              </>
            ) : isSubmissionDisabled ? (
              <>
                {" "}
                <AlertTriangle className="mr-2 h-4 w-4" /> Complete Info &
                Agreement{" "}
              </>
            ) : (
              <>
                {" "}
                <CheckCircle className="mr-2 h-4 w-4" /> Submit Booking Request{" "}
              </>
            )}
          </Button>
          {/* Conditional Helper Text */}
          {isMissingInfo && (
            <p className="mt-2 text-sm text-destructive font-medium">
              {" "}
              Please ensure Name, Email, Phone, and Date of Birth are provided.{" "}
            </p>
          )}
          {!allTermsChecked && (
            <p className="mt-2 text-sm text-destructive font-medium">
              {" "}
              Please agree to all terms and conditions above.{" "}
            </p>
          )}
          {!isSubmitting && !isSubmissionDisabled && (
            <p className="mt-2 text-sm text-muted-foreground">
              {" "}
              Clicking submit will verify CAPTCHA and send your request.{" "}
            </p>
          )}
        </div>
      </div>

      {/* Render the Progress Modal */}
      <SubmissionProgressModal
        isOpen={isSubmitting && submissionProgress < 100} // Show only while actively submitting
        progress={submissionProgress}
        statusText={submissionStatusText}
        totalFiles={totalFilesToUpload}
        // filesUploaded={filesUploadedCount} // Optional: Might remove if progress isn't file-based now
      />
    </>
  );
};
