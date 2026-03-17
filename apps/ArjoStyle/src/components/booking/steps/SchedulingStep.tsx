// src/components/booking/steps/SchedulingStep.tsx (Updated with Secure Fetching & Duration Logic via Edge Function)

import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
// Removed RadioGroup imports as flexibility section was removed previously
import { Calendar } from "@/components/ui/calendar";
import { BookingFormData } from "@/types/bookings"; // Assuming path is correct
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarClock, AlertTriangle, Loader2 } from "lucide-react"; // Added Loader2
import { format, isValid, addDays, startOfDay } from "date-fns"; // Import necessary date-fns functions
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import { useToast } from "@/hooks/use-toast"; // Import useToast

// --- Constants ---
const MIN_BOOKING_NOTICE_DAYS = 3;
const MAX_BOOKING_MONTHS_AHEAD = 3;
const CLOSED_DAY_OF_WEEK = null; // 0=Sun, 1=Mon, 2=Tue,...
const ALL_DAY_TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];
const MINIMUM_DURATION_MINUTES = 30;
const MAX_SESSION_HOURS = 6;
// ---

interface SchedulingStepProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

// --- Helper Function to Format Duration ---
const formatDuration = (totalMinutes: number | undefined): string => {
  if (totalMinutes === undefined || totalMinutes < 1 || isNaN(totalMinutes))
    return "N/A"; // Handle NaN
  const roundedMinutes = Math.max(
    MINIMUM_DURATION_MINUTES,
    Math.round(totalMinutes / 30) * 30
  );
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
  // Ensure a minimum display if calculation results in zero hours/minutes but duration is valid
  return result.length > 0
    ? `Approx. ${result}`
    : `Approx. ${MINIMUM_DURATION_MINUTES} min`;
};
// ---

export const SchedulingStep: React.FC<SchedulingStepProps> = ({
  formData,
  updateFormData,
}) => {
  const { toast } = useToast();
  // State for available slots fetched from backend
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Calendar Date Logic ---
  const { minDate, maxDate } = useMemo(() => {
    const today = startOfDay(new Date()); // Use startOfDay for consistent comparison
    const calculatedMinDate = addDays(today, MIN_BOOKING_NOTICE_DAYS);
    const calculatedMaxDate = startOfDay(new Date()); // Start from today for max date calc
    calculatedMaxDate.setMonth(
      calculatedMaxDate.getMonth() + MAX_BOOKING_MONTHS_AHEAD + 1,
      0
    ); // Go to end of target month
    return { minDate: calculatedMinDate, maxDate: calculatedMaxDate };
  }, []);

  const isDateDisabled = useCallback(
    (date: Date): boolean => {
      const day = date.getDay();
      const dateOnly = startOfDay(date); // Normalize date to midnight for comparison
      // Check against calculated min/max dates and closed day
      return (
        dateOnly < minDate || dateOnly > maxDate || day === CLOSED_DAY_OF_WEEK
      );
    },
    [minDate, maxDate]
  );

  // --- Fetch Available Slots Effect ---
  useEffect(() => {
    // Only fetch if a valid date is selected
    const selectedDate = formData.appointmentDate; // Get date from formData
    if (
      selectedDate &&
      isValid(selectedDate) &&
      !isDateDisabled(selectedDate)
    ) {
      // Check validity and if it's not disabled
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
      console.log(
        `Date selected: ${selectedDateStr}. Fetching available slots...`
      );
      setIsLoadingSlots(true);
      setFetchError(null);
      setAvailableSlots([]); // Clear previous slots

      const fetchSlots = async () => {
        try {
          // Invoke the Edge Function
          const { data, error } = await supabase.functions.invoke(
            "get-available-slots",
            {
              // Pass date in the expected format
              body: { date: selectedDateStr },
            }
          );

          if (error) throw error; // Handle function invocation error
          if (!Array.isArray(data))
            throw new Error(
              "Invalid response format from server (expected array)."
            );

          console.log(`Available slots received for ${selectedDateStr}:`, data);
          setAvailableSlots(data as string[]);
        } catch (err: unknown) {
          console.error("Error fetching available slots:", err);
          const message =
            err instanceof Error
              ? err.message
              : "Could not load available times.";
          setFetchError(message);
          setAvailableSlots([]); // Ensure slots are empty on error
          toast({
            variant: "destructive",
            title: "Failed to Load Times",
            description: message,
          });
        } finally {
          setIsLoadingSlots(false);
        }
      };

      fetchSlots();
    } else {
      // Clear slots if date is deselected, invalid, or disabled
      setAvailableSlots([]);
      setIsLoadingSlots(false);
      setFetchError(null);
    }
    // Dependency: Fetch when the selected date in formData changes
  }, [formData.appointmentDate, toast, isDateDisabled]); // Include isDateDisabled in deps

  // --- Handlers ---
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      // Update form data: set date, reset time
      updateFormData({
        appointmentDate: date || null,
        appointmentTime: null, // Reset time when date changes
      });
    },
    [updateFormData]
  );

  const handleTimeSelect = useCallback(
    (time: string) => {
      // Check if the selected time is actually available according to the fetched data
      if (availableSlots.includes(time)) {
        updateFormData({ appointmentTime: time });
      } else {
        console.warn(`Attempted to select unavailable/blocked slot: ${time}`);
        toast({
          variant: "destructive",
          title: "Slot Unavailable",
          description:
            "This time slot is no longer available. Please select another.",
        });
      }
    },
    [availableSlots, updateFormData, toast]
  ); // Depend on availableSlots

  const formattedDuration = useMemo(
    () => formatDuration(formData.estimatedDurationMinutes),
    [formData.estimatedDurationMinutes]
  );
  const schedulingTips = useMemo(() => {
    /* ... (Keep existing scheduling tips logic) ... */
    const duration = formData.estimatedDurationMinutes;
    const sessions = formData.estimatedSessions;
    const tips: React.ReactNode[] = [];
    const durationString = formatDuration(duration);
    if (!duration || duration < MINIMUM_DURATION_MINUTES) return null;
    const durationStyle = "font-semibold text-foreground"; // Adjusted style for better readability
    const sessionStyle = "font-semibold text-foreground";
    if (sessions && sessions > 1)
      tips.push(
        <li key="sessions">
          This project likely requires{" "}
          <strong className={sessionStyle}>{sessions} sessions</strong> (~
          {MAX_SESSION_HOURS} hrs each). Book your 1st session; subsequent ones
          scheduled with artist.
        </li>
      );
    if (duration >= 4 * 60)
      tips.push(
        <li key="long">
          For longer sessions (
          <strong className={durationStyle}>{durationString}</strong>), eat well
          beforehand & bring snacks/drinks. Plan accordingly.
        </li>
      );
    else if (duration >= 2 * 60)
      tips.push(
        <li key="medium">
          This session (
          <strong className={durationStyle}>{durationString}</strong>) requires
          a solid block of time.
        </li>
      );
    else
      tips.push(
        <li key="short">
          This session (
          <strong className={durationStyle}>{durationString}</strong>) is
          shorter, but please allow buffer time.
        </li>
      );
    tips.push(
      <li key="general">
        Arrive on time & well-rested for the best experience.
      </li>
    );
    if (tips.length === 0) return null;
    return (
      <Alert
        variant="default"
        className="mt-6 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
      >
        {" "}
        <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />{" "}
        <AlertTitle className="text-blue-800 dark:text-blue-300">
          Scheduling Tips
        </AlertTitle>{" "}
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <ul className="list-disc space-y-1 pl-5 text-sm">{tips}</ul>
        </AlertDescription>{" "}
      </Alert>
    );
  }, [formData.estimatedDurationMinutes, formData.estimatedSessions]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Heading */}
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Schedule Your Appointment
        </h2>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Choose your preferred date and time.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              1. Select a Date
            </CardTitle>
            <CardDescription className="text-sm">
              Closed Mondays. Min {MIN_BOOKING_NOTICE_DAYS} days notice
              required.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={formData.appointmentDate ?? undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled} // Use the memoized disable function
              modifiers={{
                monday: (date) => date.getDay() === CLOSED_DAY_OF_WEEK,
              }}
              modifiersClassNames={{
                disabled:
                  "text-muted-foreground/50 opacity-50 cursor-not-allowed",
                monday: "text-destructive/70 opacity-70",
              }}
              className="rounded-md border dark:border-slate-700"
              showOutsideDays={false}
              fromMonth={minDate} // Use calculated minDate
              toMonth={maxDate} // Use calculated maxDate
              fixedWeeks
            />
          </CardContent>
        </Card>

        {/* Time Selection Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              2. Select an Available Time
            </CardTitle>
            <CardDescription className="text-sm">
              {!formData.appointmentDate
                ? "Select a date first."
                : `Available slots shown for your estimated duration of `}
              {formData.appointmentDate && (
                <strong className="text-foreground">{formattedDuration}</strong>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex-grow flex flex-col justify-between">
            {/* Time Selection Section */}
            <div className="min-h-[150px] flex flex-col">
              {" "}
              {/* Ensure flex column for layout */}
              {!formData.appointmentDate ? (
                <p className="text-sm text-muted-foreground text-center pt-10">
                  Select a date to view available times.
                </p>
              ) : isLoadingSlots ? (
                <div className="flex flex-col items-center justify-center flex-grow">
                  {" "}
                  {/* Center loading */}
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading available slots...
                  </p>
                </div>
              ) : fetchError ? (
                <div className="pt-10 px-4 flex-grow flex items-center justify-center">
                  {" "}
                  {/* Center error */}
                  <Alert variant="destructive" className="max-w-sm mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                  </Alert>
                </div>
              ) : ALL_DAY_TIME_SLOTS.length > 0 ? ( // Check if there are slots defined
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {ALL_DAY_TIME_SLOTS.map((time) => {
                    const isAvailable = availableSlots.includes(time); // Check against fetched available slots
                    return (
                      <Button
                        key={time}
                        variant={
                          formData.appointmentTime === time
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className={cn(
                          "w-full justify-center h-10", // Fixed height
                          formData.appointmentTime === time &&
                            "ring-2 ring-primary ring-offset-2 dark:ring-offset-background",
                          !isAvailable &&
                            "bg-muted text-muted-foreground line-through border-muted-foreground/30 cursor-not-allowed hover:bg-muted dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700" // Style for unavailable/blocked
                        )}
                        onClick={() => handleTimeSelect(time)}
                        disabled={!isAvailable} // Disable button if not available
                        aria-disabled={!isAvailable}
                        aria-pressed={formData.appointmentTime === time}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-10 flex-grow flex items-center justify-center">
                  No time slots defined for scheduling.
                </p> // Message if ALL_DAY_TIME_SLOTS is empty
              )}
              {/* Scheduling Tips (show below slots/messages) */}
              {formData.appointmentDate &&
                !isLoadingSlots &&
                !fetchError &&
                formData.estimatedDurationMinutes && (
                  <div className="mt-auto pt-4">
                    {" "}
                    {/* Push tips to bottom */}
                    {schedulingTips}
                  </div>
                )}
            </div>

            {/* Placeholder div for consistent layout if needed, or remove */}
            {!formData.appointmentDate && (
              <div className="mt-6 pt-6 border-t border-transparent"></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
