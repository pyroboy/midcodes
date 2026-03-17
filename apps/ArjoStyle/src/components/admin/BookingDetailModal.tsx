// src/components/admin/BookingDetailModal.tsx (Complete File - April 9, 2025)

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
// Import necessary icons
import {
  Loader2,
  ImageIcon,
  AlertTriangle,
  CalendarCheck,
  CalendarOff,
} from "lucide-react";
import { parse, isValid, format } from "date-fns";

// Import sub-components
import { ReferenceImageViewer } from "./ReferenceImageViewer";
import { BookingDetailInfoSections } from "./BookingDetailInfoSections";
import { BookingDetailAdminActions } from "./BookingDetailAdminActions";
import { AppointmentEditor } from "./AppointmentEditor"; // Import the editor component

// Import formatters and types
import {
  formatDetailDate,
  getFreedomDescription,
  getComplexityDescription,
} from "@/lib/formatters";
import { BookingData } from "@/types/bookings";
import { checkConflicts } from "@/lib/schedulingUtils"; // Import conflict checker
import { cn } from "@/lib/utils"; // Ensure cn is imported

// --- BookingDetailModalProps ---
interface BookingDetailModalProps {
  booking: BookingData | null;
  allBookings: BookingData[]; // Prop to pass all bookings for conflict check
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdate?: (updatedBooking: BookingData) => void;
}

// --- Minimal Supabase Error Type ---
interface SupabaseFunctionHttpError extends Error {
  context?: { error?: { message?: string } };
}

// --- Main Component ---
export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  allBookings, // Use this prop for conflict checking
  isOpen,
  onClose,
  onBookingUpdate,
}) => {
  // --- State ---
  const [replyRecommendations, setReplyRecommendations] = useState<
    string[] | null
  >(null);
  const [isFetchingReplies, setIsFetchingReplies] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [initialAdminNotes, setInitialAdminNotes] = useState<string>("");
  // Combined saving state: 'save' for notes, 'schedule' for editor save, 'close' for closing, 'status' for quick actions
  const [isSaving, setIsSaving] = useState<
    false | "save" | "close" | "schedule" | "status"
  >(false);

  // --- Appointment Editing State ---
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editedDate, setEditedDate] = useState<Date | null>(null);
  const [editedTime, setEditedTime] = useState<string | null>(null);
  const [editedDuration, setEditedDuration] = useState<number | undefined>(
    undefined
  ); // Duration state (in minutes)
  const [initialDate, setInitialDate] = useState<Date | null>(null); // Store initial state for change detection
  const [initialTime, setInitialTime] = useState<string | null>(null);
  const [initialDuration, setInitialDuration] = useState<number | undefined>(
    undefined
  ); // Initial duration

  const { toast } = useToast();

  // --- Helper to parse booking date/time/duration safely ---
  const parseBookingDetails = useCallback(
    (
      bookingData: BookingData | null
    ): {
      date: Date | null;
      time: string | null;
      duration: number | undefined;
    } => {
      if (!bookingData) return { date: null, time: null, duration: undefined };

      let parsedDate: Date | null = null;
      if (bookingData.requested_date) {
        // Try parsing YYYY-MM-DD first, assuming local date intention
        let dateAttempt1 = parse(
          bookingData.requested_date,
          "yyyy-MM-dd",
          new Date()
        );
        // Fallback to direct Date constructor for ISO strings etc.
        if (!isValid(dateAttempt1)) {
          dateAttempt1 = new Date(bookingData.requested_date);
        }
        parsedDate = isValid(dateAttempt1) ? dateAttempt1 : null;
      }

      // Parse duration safely
      const duration =
        bookingData.estimated_duration !== null &&
        bookingData.estimated_duration !== undefined &&
        !isNaN(bookingData.estimated_duration)
          ? Number(bookingData.estimated_duration)
          : undefined;

      return {
        date: parsedDate,
        time: bookingData.requested_time ?? null,
        duration: duration,
      };
    },
    []
  );

  // --- Effect for Loading/Resetting State ---
  useEffect(() => {
    if (isOpen && booking) {
      // Reset Notes & AI state
      setReplyError(null);
      setIsFetchingReplies(false);
      const existingNotes = booking.admin_notes || "";
      setAdminNotes(existingNotes);
      setInitialAdminNotes(existingNotes);
      setReplyRecommendations(
        booking.saved_reply_recommendations?.length
          ? booking.saved_reply_recommendations
          : null
      );

      // Initialize schedule editing state from booking prop
      const { date, time, duration } = parseBookingDetails(booking);
      setEditedDate(date);
      setEditedTime(time);
      setEditedDuration(duration); // Set duration
      setInitialDate(date);
      setInitialTime(time);
      setInitialDuration(duration); // Store initial duration
      setIsEditingSchedule(false); // Start with editor closed
      setIsSaving(false); // Ensure saving state is reset
    } else if (!isOpen) {
      // Reset all state on close
      setReplyRecommendations(null);
      setIsFetchingReplies(false);
      setReplyError(null);
      setAdminNotes("");
      setInitialAdminNotes("");
      setIsSaving(false);
      setEditedDate(null);
      setEditedTime(null);
      setEditedDuration(undefined); // Reset duration
      setInitialDate(null);
      setInitialTime(null);
      setInitialDuration(undefined); // Reset initial duration
      setIsEditingSchedule(false);
    }
  }, [booking, isOpen, parseBookingDetails]);

  // --- Check if Schedule or Duration has changed ---
  const hasScheduleChanged = useMemo(() => {
    const currentDateStr = editedDate ? format(editedDate, "yyyy-MM-dd") : null;
    const initialDateStr = initialDate
      ? format(initialDate, "yyyy-MM-dd")
      : null;
    // Treat undefined duration same as initial for comparison if initial was also undefined/null
    const currentDuration =
      editedDuration === undefined ? null : editedDuration;
    const initialStoredDuration =
      initialDuration === undefined ? null : initialDuration;

    return (
      currentDateStr !== initialDateStr ||
      editedTime !== initialTime ||
      currentDuration !== initialStoredDuration
    );
  }, [
    editedDate,
    editedTime,
    editedDuration,
    initialDate,
    initialTime,
    initialDuration,
  ]);

  // --- Memoized Conflict Check using potentially edited duration ---
  const currentConflicts = useMemo(() => {
    // Ensure booking exists before accessing its properties
    if (!editedDate || !editedTime || !booking) return [];
    return checkConflicts(
      editedDate,
      editedTime,
      editedDuration, // Use edited duration from state
      booking.id, // Use booking from props
      allBookings
    );
  }, [editedDate, editedTime, editedDuration, booking, allBookings]); // Depend on editedDuration

  const hasConflict = currentConflicts.length > 0;

  // --- Logic/Handlers ---

  // Combined Save Function (Notes + Schedule + Duration + Status)
  const saveBookingChanges = useCallback(
    async (
      triggeredBy: "save" | "schedule" | "close" | "status",
      statusUpdatePayload?: Partial<BookingData> // Optional payload for status updates
    ): Promise<boolean> => {
      if (!booking || !booking.id) {
        toast({
          variant: "destructive",
          title: "Save Error",
          description: "Booking ID missing.",
        });
        return false;
      }

      const notesChanged = adminNotes !== initialAdminNotes;
      const scheduleChanged = hasScheduleChanged; // Includes duration check now
      const hasOtherChanges = notesChanged || scheduleChanged;

      // If only status is potentially changing, check if it's actually different
      if (
        !hasOtherChanges &&
        statusUpdatePayload &&
        statusUpdatePayload.status === booking.status
      ) {
        console.log(
          "Save Booking Changes: Skipped (no changes including status)."
        );
        return true; // No actual change requested
      }
      // If triggered by schedule save but no actual schedule changes, show info and exit
      if (triggeredBy === "schedule" && !scheduleChanged) {
        toast({
          title: "No Changes",
          description: "Schedule/duration details were not modified.",
        });
        return true;
      }
      // If triggered by notes save but no actual notes changes, show info and exit
      if (triggeredBy === "save" && !notesChanged) {
        toast({
          title: "No Changes",
          description: "Admin notes were not modified.",
        });
        return true;
      }

      // Re-check conflicts ONLY if the schedule changed OR if confirming a schedule status
      let conflicts: BookingData[] = [];
      const isConfirmingSchedule = statusUpdatePayload?.status === "Confirmed";
      // Ensure date/time exist for conflict check when confirming status
      const dateForCheck = scheduleChanged ? editedDate : initialDate;
      const timeForCheck = scheduleChanged ? editedTime : initialTime;
      const durationForCheck = scheduleChanged
        ? editedDuration
        : initialDuration;

      if (
        (scheduleChanged || isConfirmingSchedule) &&
        dateForCheck &&
        timeForCheck
      ) {
        // Use the potentially edited duration from state for the check
        conflicts = checkConflicts(
          dateForCheck,
          timeForCheck,
          durationForCheck,
          booking.id,
          allBookings
        );
        if (conflicts.length > 0) {
          toast({
            variant: "destructive",
            title: "Schedule Conflict",
            description: `Cannot save/confirm, the selected time/duration conflicts with: ${conflicts
              .map((c) => c.name)
              .join(", ")}.`,
            duration: 7000,
          });
          return false; // Prevent saving/confirming
        }
      }

      // Prepare payload
      const updatePayload: Partial<BookingData> = { ...statusUpdatePayload }; // Start with status payload if provided
      if (notesChanged) updatePayload.admin_notes = adminNotes;
      if (scheduleChanged) {
        updatePayload.requested_date = editedDate
          ? format(editedDate, "yyyy-MM-dd")
          : null;
        updatePayload.requested_time = editedTime;
        updatePayload.estimated_duration =
          editedDuration !== undefined ? editedDuration : null; // Save updated duration
        // Auto-confirm status if schedule set/changed from pending states (and no other status is being set)
        if (
          !updatePayload.status &&
          editedDate &&
          editedTime &&
          ["Pending", "Needs Info"].includes(booking.status)
        ) {
          updatePayload.status = "Confirmed";
        }
      }
      // Prevent accidental status override if only notes/schedule changed
      if (hasOtherChanges && !updatePayload.status && !statusUpdatePayload) {
        delete updatePayload.status;
      }
      // If only status is changing, ensure other fields aren't sent if they weren't actually modified
      if (statusUpdatePayload && !notesChanged)
        delete updatePayload.admin_notes;
      if (statusUpdatePayload && !scheduleChanged) {
        delete updatePayload.requested_date;
        delete updatePayload.requested_time;
        delete updatePayload.estimated_duration;
      }

      // Final check if payload has anything to update
      if (Object.keys(updatePayload).length === 0) {
        console.log(
          "Save Booking Changes: Skipped (payload empty after checks)."
        );
        return true;
      }

      console.log(
        `Saving changes for booking ${booking.id} (Trigger: ${triggeredBy}). Payload:`,
        updatePayload
      );
      setIsSaving(triggeredBy); // Set specific saving state

      try {
        const { data: updatedData, error } = await supabase
          .from("bookings")
          .update(updatePayload)
          .eq("id", booking.id)
          .select()
          .single();
        if (error) throw error;

        // --- Success Handling ---
        console.log(`Booking changes saved successfully for ${booking.id}.`);
        const messages = [];
        if (notesChanged) {
          setInitialAdminNotes(adminNotes);
          messages.push("Notes updated.");
        }
        if (scheduleChanged) {
          setInitialDate(editedDate);
          setInitialTime(editedTime);
          setInitialDuration(editedDuration); // Update initial duration
          setIsEditingSchedule(false);
          messages.push("Schedule/duration updated.");
        }
        if (updatePayload.status)
          messages.push(`Status set to ${updatePayload.status}.`);

        toast({
          title: "Changes Saved",
          description: messages.join(" ") || "Booking updated.",
        });
        // Notify parent component of the update with the full updated data
        if (onBookingUpdate && updatedData) {
          onBookingUpdate(updatedData as BookingData);
        }
        return true;
      } catch (error: unknown) {
        console.error("Error saving booking changes:", error);
        const message =
          error instanceof Error ? error.message : "Unknown error";
        toast({
          variant: "destructive",
          title: "Error Saving Changes",
          description: message,
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      booking,
      adminNotes,
      initialAdminNotes,
      hasScheduleChanged,
      editedDate,
      editedTime,
      editedDuration,
      initialDate,
      initialTime,
      initialDuration,
      allBookings,
      onBookingUpdate,
      toast,
      // Removed supabase
    ]
  );

  // Specific Save Handlers
  const handleSaveNotesClick = async () => {
    await saveBookingChanges("save");
  };
  const handleSaveScheduleClick = async () => {
    await saveBookingChanges("schedule");
  };

  // Close Handler - checks for unsaved changes
  const handleAttemptClose = async () => {
    const anyChanges = adminNotes !== initialAdminNotes || hasScheduleChanged; // Uses updated memo
    if (isSaving) return; // Prevent closing if already saving

    if (anyChanges) {
      const saveConfirmed = window.confirm(
        "You have unsaved changes. Save before closing?"
      );
      if (saveConfirmed) {
        const saved = await saveBookingChanges("close");
        if (saved) onClose(); // Close only if save was successful
        // Keep modal open if save failed
      } else {
        onClose(); // Discard changes and close
      }
    } else {
      onClose(); // No changes, just close
    }
  };

  // Fetch AI Replies Handler
  const handleFetchReplies = useCallback(async () => {
    if (!booking || !booking.id) {
      setReplyError("Booking data is missing.");
      return;
    }
    setIsFetchingReplies(true);
    setReplyError(null);
    try {
      const complexityDesc = getComplexityDescription(booking.complexity);
      const freedomDesc = getFreedomDescription(booking.creative_freedom);
      const contextPayload = {
        bookingId: booking.id,
        name: booking.name,
        category: booking.category,
        placement: booking.placement,
        tattoo_size: booking.tattoo_size,
        is_color: booking.is_color,
        is_cover_up: booking.is_cover_up,
        complexity: complexityDesc,
        pricing_details: booking.pricing_details,
        estimated_duration: editedDuration ?? booking.estimated_duration, // Use edited duration if available
        estimated_sessions: booking.estimated_sessions, // Sessions might need recalculation based on new duration? For now, use original.
        specific_reqs: booking.specific_reqs,
        must_haves: booking.must_haves,
        placement_notes: booking.placement_notes,
        color_prefs: booking.color_prefs,
        creative_freedom: freedomDesc,
        has_references:
          !!booking.reference_image_urls &&
          booking.reference_image_urls.length > 0,
        requested_date: editedDate
          ? format(editedDate, "yyyy-MM-dd")
          : booking.requested_date, // Use edited date/time
        requested_time: editedTime ?? booking.requested_time,
        artist_preference: booking.artist_preference,
        adminReviewNotes: adminNotes,
        primaryTattooStyle: booking.primaryTattooStyle,
        styleDescription: booking.styleDescription,
      };
      if (!supabase?.functions?.invoke)
        throw new Error("Supabase client invalid for functions.");
      const { data: recommendations, error: functionError } =
        await supabase.functions.invoke<string[]>("generate-booking-replies", {
          body: contextPayload,
        });
      if (functionError) throw functionError;
      setReplyRecommendations(
        Array.isArray(recommendations) ? recommendations : []
      );
    } catch (error: unknown) {
      console.error("--- handleFetchReplies: Error caught:", error);
      let message = "Failed to fetch AI suggestions.";
      if (typeof error === "object" && error !== null && "message" in error) {
        message = String((error as Error).message);
      } else if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }
      setReplyError(message);
    } finally {
      setIsFetchingReplies(false);
    }
  }, [booking, adminNotes, editedDate, editedTime, editedDuration]); // Added schedule state dependencies

  // Schedule Action Handlers
  const handleConfirmSchedule = async () => {
    if (
      !editedDate ||
      !editedTime ||
      (editedDuration !== undefined && editedDuration < 30)
    ) {
      toast({
        variant: "destructive",
        title: "Cannot Confirm",
        description:
          "Please set a valid date, time, and duration (min 30 min).",
      });
      return;
    }
    // saveBookingChanges includes conflict check
    await saveBookingChanges("status", { status: "Confirmed" });
  };
  const handleRequestReschedule = async () => {
    setEditedDate(null);
    setEditedTime(null);
    setEditedDuration(undefined); // Clear duration too
    await saveBookingChanges("status", {
      requested_date: null,
      requested_time: null,
      estimated_duration: null,
      status: "Needs Info",
    });
  };

  // --- Render ---
  if (!booking) return null;

  // Determine overall saving state
  const isAnySaving =
    isSaving === "save" ||
    isSaving === "close" ||
    isSaving === "schedule" ||
    isSaving === "status";
  // Determine if any changes exist (notes, date, time, duration)
  const hasAnyChanges = adminNotes !== initialAdminNotes || hasScheduleChanged;
  const hasExistingRecommendations = !!(
    replyRecommendations && replyRecommendations.length > 0
  );
  const generateButtonText = hasExistingRecommendations
    ? "Refresh"
    : "Generate";
  const scheduleNeedsAttention =
    !editedDate ||
    !editedTime ||
    editedDuration === undefined ||
    editedDuration < 30 ||
    booking.status === "Pending" ||
    booking.status === "Needs Info";
  // Enable confirm button if date/time/valid duration are set, status allows it, and no conflicts exist
  const canConfirmSchedule =
    editedDate &&
    editedTime &&
    editedDuration !== undefined &&
    editedDuration >= 30 &&
    ["Pending", "Needs Info"].includes(booking.status) &&
    !hasConflict;
  // Enable clear/reschedule button if date/time is set and booking isn't finished/rejected
  const canRequestReschedule = !!(
    editedDate &&
    editedTime &&
    booking.status !== "Completed" &&
    booking.status !== "Rejected"
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleAttemptClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col sm:max-w-4xl">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 pr-6">
          <DialogTitle className="text-2xl">
            Booking: {booking.name || `ID ${booking.id.substring(0, 8)}...`}
          </DialogTitle>
          <DialogDescription className="flex items-center flex-wrap gap-x-3 gap-y-1">
            <span>ID: {booking.id}</span> |{" "}
            <span>Submitted: {formatDetailDate(booking.created_at)}</span>
            {scheduleNeedsAttention && !isEditingSchedule && (
              <span className="text-orange-500 font-medium flex items-center text-xs ml-1">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Schedule Needs
                Confirmation/Setting
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-grow overflow-y-auto pr-6 -mr-6 my-4 min-h-[300px]">
          <div className="flex flex-col gap-6 py-4">
            {/* 1. Appointment Editor & Actions */}
            <div className="space-y-3">
              <AppointmentEditor
                currentBooking={booking}
                allBookings={allBookings}
                editedDate={editedDate}
                editedTime={editedTime}
                editedDuration={editedDuration} // Pass duration state
                onDateChange={setEditedDate}
                onTimeChange={setEditedTime}
                onDurationChange={setEditedDuration} // Pass duration handler
                isEditing={isEditingSchedule}
                onToggleEdit={() => {
                  // Reset edits if cancelling
                  if (isEditingSchedule) {
                    setEditedDate(initialDate);
                    setEditedTime(initialTime);
                    setEditedDuration(initialDuration);
                  }
                  setIsEditingSchedule(!isEditingSchedule);
                }}
                onSaveChanges={handleSaveScheduleClick}
                hasChanges={hasScheduleChanged} // Pass updated change detection
              />
              {/* Schedule Action Buttons - Conditionally Rendered */}
              {!isEditingSchedule &&
                (editedDate ||
                  editedTime ||
                  ["Pending", "Needs Info"].includes(booking.status)) && (
                  <div
                    className={cn(
                      "flex flex-wrap gap-2 mt-3 px-1 justify-end",
                      isEditingSchedule && "hidden"
                    )}
                  >
                    {canConfirmSchedule && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleConfirmSchedule}
                        disabled={isAnySaving}
                      >
                        {isSaving === "status" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarCheck className="mr-2 h-4 w-4" />
                        )}
                        Confirm Schedule & Status
                      </Button>
                    )}
                    {canRequestReschedule && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-500 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-900/50 dark:hover:text-orange-300"
                        onClick={handleRequestReschedule}
                        disabled={isAnySaving}
                      >
                        {isSaving === "status" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarOff className="mr-2 h-4 w-4" />
                        )}
                        Clear Schedule (Needs Info)
                      </Button>
                    )}
                  </div>
                )}
            </div>
            <Separator className="my-1 bg-border/50" />

            {/* 2. Reference Images */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2 pl-1">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />{" "}
                Reference Images
              </h3>
              {booking.reference_image_urls &&
              booking.reference_image_urls.length > 0 ? (
                <div className="flex flex-row flex-wrap gap-3 pl-1">
                  {booking.reference_image_urls.map((ref) => (
                    <ReferenceImageViewer
                      key={ref.public_id || Math.random()}
                      reference={ref}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic px-2 py-4 text-center border rounded-md bg-muted/30">
                  No reference images uploaded.
                </p>
              )}
            </div>
            <Separator className="my-1 bg-border/50" />

            {/* 3. Admin Actions Component (Notes & AI) */}
            <BookingDetailAdminActions
              adminNotes={adminNotes}
              setAdminNotes={setAdminNotes}
              handleFetchReplies={handleFetchReplies}
              replyRecommendations={replyRecommendations}
              isFetchingReplies={isFetchingReplies}
              replyError={replyError}
              generateButtonText={generateButtonText}
              handleSaveNotesClick={handleSaveNotesClick}
              isSavingNotes={isSaving === "save"}
              isAnySaving={isAnySaving} // Pass overall saving state
              hasNotesChanged={adminNotes !== initialAdminNotes}
            />

            {/* 4. Info Sections Component */}
            <BookingDetailInfoSections booking={booking} />
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="mt-auto pt-4 border-t flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleAttemptClose}
            disabled={isAnySaving}
          >
            {isSaving === "close" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSaving === "close" ? "Saving & Closing..." : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Badge Module Declaration ---
declare module "@/components/ui/badge" {
  interface BadgeProps {
    variant?: "default" | "secondary" | "destructive" | "outline" | "warning";
  }
}
