// src/components/admin/AppointmentEditor.tsx

import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AlertTriangle, CalendarIcon } from "lucide-react"; // Removed Clock icon as it's implicitly handled by time select
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isValid, startOfMonth, isSameDay } from "date-fns"; // Added isSameDay
import { cn } from "@/lib/utils";
import { BookingData } from "@/types/bookings";
import { ALL_DAY_TIME_SLOTS } from "@/types/appointments";
import { checkConflicts } from "@/lib/schedulingUtils";

interface AppointmentEditorProps {
  currentBooking: BookingData;
  allBookings: BookingData[]; // All other bookings for conflict checking
  editedDate: Date | null;
  editedTime: string | null;
  editedDuration: number | undefined; // Duration state (in minutes)
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;
  onDurationChange: (duration: number | undefined) => void; // Handler for duration change
  isEditing: boolean; // Is the editor section open?
  onToggleEdit: () => void; // Function to toggle the editor visibility
  onSaveChanges: () => void; // Function to trigger saving changes (from parent)
  hasChanges: boolean; // Flag indicating if date/time/duration has been modified
}

// Disable past dates - adjust if needed (e.g., allow same day)
const isDateDisabled = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to midnight
  return date < today;
};
const MIN_DURATION = 30; // Minimum duration in minutes

export const AppointmentEditor: React.FC<AppointmentEditorProps> = ({
  currentBooking,
  allBookings,
  editedDate,
  editedTime,
  editedDuration,
  onDateChange,
  onTimeChange,
  onDurationChange,
  isEditing,
  onToggleEdit,
  onSaveChanges,
  hasChanges,
}) => {
  // Local state for calendar month navigation
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    editedDate || startOfMonth(new Date())
  );
  // Local state to control Popover visibility programmatically if needed
  const [showCalendar, setShowCalendar] = useState(false);

  // Memoize conflict check using the potentially edited duration
  const currentConflicts = useMemo(() => {
    // Use the 'currentBooking' prop passed to this component
    if (!editedDate || !editedTime || !currentBooking) return []; // Check currentBooking existence
    console.log(
      `Checking conflicts for ${format(
        editedDate,
        "yyyy-MM-dd"
      )} ${editedTime} with duration ${editedDuration}`
    );
    return checkConflicts(
      editedDate,
      editedTime,
      editedDuration,
      currentBooking.id, // <-- Use specific property here
      allBookings
    );
    // Update dependency array below to use the specific property
  }, [editedDate, editedTime, editedDuration, currentBooking, allBookings]); // <-- Use currentBooking.id instead of currentBooking

  const hasConflict = currentConflicts.length > 0;

  // Handler for selecting a date in the calendar
  const handleInternalDateSelect = (date: Date | undefined) => {
    onDateChange(date ?? null);
    setShowCalendar(false); // Close calendar popover
    if (date) {
      setCalendarMonth(date); // Navigate calendar to selected month
    }
  };

  // Handler for selecting a time from the dropdown
  const handleTimeSelect = (timeValue: string) => {
    onTimeChange(timeValue === "none" ? null : timeValue);
  };

  // Handler for duration input changes
  const handleDurationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "") {
      onDurationChange(undefined); // Allow clearing the input
    } else if (/^\d+$/.test(value)) {
      // Only allow positive integers
      const numValue = parseInt(value, 10);
      onDurationChange(numValue); // Update parent state
    }
    // Validation (e.g., checking < MIN_DURATION) is handled visually below the input
  };

  // Determine available slots considering conflicts for the selected date AND DURATION
  const availableTimeSlots = useMemo(() => {
    if (!editedDate)
      return ALL_DAY_TIME_SLOTS.map((slot) => ({
        slot,
        isConflicting: false,
        conflictText: null,
      }));

    return ALL_DAY_TIME_SLOTS.map((slot) => {
      const slotConflicts = checkConflicts(
        editedDate,
        slot,
        editedDuration, // Use current edited duration for checking availability
        currentBooking.id,
        allBookings
      );
      const isConflicting = slotConflicts.length > 0;
      const conflictText = isConflicting
        ? `Conflicts with: ${slotConflicts
            .map((c) => `${c.name} (${c.requested_time})`)
            .join(", ")}`
        : null;

      return { slot, isConflicting, conflictText };
    });
  }, [editedDate, currentBooking.id, editedDuration, allBookings]); // Depend on editedDuration

  // Determine if save button should be disabled
  const isSaveDisabled =
    !hasChanges ||
    hasConflict ||
    !editedDate ||
    !editedTime ||
    (editedDuration !== undefined && editedDuration < MIN_DURATION);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          {" "}
          {/* Added flex-wrap */}
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            Appointment Schedule
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEdit}
            className="flex-shrink-0"
          >
            {isEditing ? "Cancel Edit" : "Edit Schedule"}
          </Button>
        </div>
        {/* Display Current Schedule when not editing */}
        {!isEditing && (
          <CardDescription className="pt-3 text-sm">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
              <span className="font-medium">
                Date:{" "}
                {editedDate ? (
                  format(editedDate, "MMM d, yyyy")
                ) : (
                  <span className="text-muted-foreground italic">Not Set</span>
                )}
              </span>
              <span className="font-medium">
                Time:{" "}
                {editedTime || (
                  <span className="text-muted-foreground italic">Not Set</span>
                )}
              </span>
              <span className="font-medium">
                Est. Duration:{" "}
                {editedDuration ? (
                  `${editedDuration} min`
                ) : (
                  <span className="text-muted-foreground italic">Not Set</span>
                )}
              </span>
            </div>
          </CardDescription>
        )}
      </CardHeader>

      {/* Editing UI - Conditionally Rendered */}
      {isEditing && (
        <CardContent className="space-y-4 pt-2">
          {/* Row for Date/Time/Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date Picker */}
            <div className="space-y-1">
              <Label
                htmlFor="appointment-date-button"
                className="text-sm font-medium"
              >
                Date
              </Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    id="appointment-date-button"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !editedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedDate ? (
                      format(editedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedDate ?? undefined}
                    onSelect={handleInternalDateSelect}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    disabled={isDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-1">
              <Label
                htmlFor="appointment-time-select"
                className="text-sm font-medium"
              >
                Time
              </Label>
              <Select
                value={editedTime ?? "none"}
                onValueChange={handleTimeSelect}
                disabled={!editedDate} // Disable if no date selected
              >
                <SelectTrigger
                  id="appointment-time-select"
                  className={cn(
                    "h-10",
                    hasConflict &&
                      editedTime &&
                      "border-destructive ring-1 ring-destructive text-destructive"
                  )}
                >
                  <SelectValue placeholder="Select a time..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Not Set --</SelectItem>
                  {availableTimeSlots.map(
                    ({ slot, isConflicting, conflictText }) => (
                      <SelectItem
                        key={slot}
                        value={slot}
                        disabled={isConflicting}
                        className={cn(
                          "text-sm",
                          isConflicting &&
                            "text-destructive line-through opacity-70"
                        )}
                        title={conflictText ?? ""} // Add title for hover info on disabled items
                      >
                        {slot} {isConflicting ? "(Conflicts)" : ""}
                        {/* Optional: Inline text for simple conflicts, keep tooltip for complex */}
                        {/* {isConflicting && conflictText && <span className='text-xs block text-destructive/80 ml-2 truncate' title={conflictText}> - {conflictText}</span> } */}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Input */}
            <div className="space-y-1">
              <Label
                htmlFor="appointment-duration"
                className="text-sm font-medium"
              >
                Duration (min)
              </Label>
              <Input
                id="appointment-duration"
                type="number"
                value={editedDuration === undefined ? "" : editedDuration}
                onChange={handleDurationInputChange}
                placeholder={`e.g., ${
                  currentBooking.estimated_duration || 120
                }`}
                min={MIN_DURATION}
                step={15} // Suggest steps of 15/30 mins
                className={cn(
                  "h-10",
                  editedDuration !== undefined &&
                    editedDuration < MIN_DURATION &&
                    "border-destructive ring-1 ring-destructive"
                )}
              />
              {editedDuration !== undefined &&
                editedDuration < MIN_DURATION && (
                  <p className="text-xs text-destructive">
                    Min duration: {MIN_DURATION} min.
                  </p>
                )}
            </div>
          </div>

          {/* Conflict Warning Message */}
          {hasConflict && editedDate && editedTime && (
            <div className="p-3 mt-2 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Conflict Detected!</strong> The selected time (
                {editedTime}) and duration ({editedDuration || "N/A"} min)
                overlaps with:{" "}
                {currentConflicts
                  .map((c) => `${c.name} at ${c.requested_time}`)
                  .join(", ")}
                . Please choose a different time or adjust duration.
              </div>
            </div>
          )}

          {/* Save/Cancel Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onToggleEdit}>
              Cancel
            </Button>
            <Button
              onClick={onSaveChanges}
              disabled={isSaveDisabled} // Use calculated disabled state
            >
              Save Schedule Changes
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
