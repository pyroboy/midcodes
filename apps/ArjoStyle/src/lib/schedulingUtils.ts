// src/lib/schedulingUtils.ts (New File)
import { BookingData } from "@/types/bookings"; // Adjust path
import {
  parse,
  addMinutes,
  isValid,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isSameDay,
} from "date-fns";

// Helper to parse time string (HH:MM AM/PM) into hours and minutes
const parseTimeString = (
  timeString: string
): { hours: number; minutes: number } | null => {
  const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeParts) return null;

  let hours = parseInt(timeParts[1], 10);
  const minutes = parseInt(timeParts[2], 10);
  const period = timeParts[3]?.toUpperCase();

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0; // Midnight case

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
};

// Helper to get start and end Date objects for a booking slot
const getSlotTimestamps = (
  bookingDate: Date,
  timeString: string,
  durationMinutes: number | undefined
): { start: Date; end: Date } | null => {
  const timeParts = parseTimeString(timeString);
  if (!timeParts) return null;

  const startDate = setHours(
    setMinutes(
      setSeconds(setMilliseconds(bookingDate, 0), 0),
      timeParts.minutes
    ),
    timeParts.hours
  );
  if (!isValid(startDate)) return null;

  const effectiveDuration =
    durationMinutes && durationMinutes > 0 ? durationMinutes : 30; // Default to 30 mins if missing/invalid
  const endDate = addMinutes(startDate, effectiveDuration);

  return { start: startDate, end: endDate };
};

export const checkConflicts = (
  targetDate: Date,
  targetTime: string,
  targetDuration: number | undefined,
  currentBookingId: string,
  allBookings: BookingData[]
): BookingData[] => {
  const conflictingBookings: BookingData[] = [];

  // Get proposed slot timestamps
  const proposedSlot = getSlotTimestamps(
    targetDate,
    targetTime,
    targetDuration
  );
  if (!proposedSlot) {
    console.error(
      "Could not calculate proposed slot timestamps for conflict check."
    );
    return []; // Cannot check if proposed slot is invalid
  }
  const proposedStart = proposedSlot.start.getTime();
  const proposedEnd = proposedSlot.end.getTime();

  // Filter bookings for the same day, excluding the current one, and having valid date/time
  const bookingsOnSameDay = allBookings.filter(
    (b) =>
      b.id !== currentBookingId &&
      b.requested_date &&
      b.requested_time &&
      isValid(new Date(b.requested_date)) && // Ensure date string is potentially valid
      isSameDay(new Date(b.requested_date), targetDate) // Check if on the same day
  );

  for (const existingBooking of bookingsOnSameDay) {
    if (!existingBooking.requested_date || !existingBooking.requested_time)
      continue; // Should be filtered already, but safety check

    // Parse existing booking's date (handle potential timezone issue by setting time on targetDate object)
    const existingDateBase = new Date(targetDate); // Use targetDate to ensure same day context
    const existingSlot = getSlotTimestamps(
      existingDateBase,
      existingBooking.requested_time,
      existingBooking.estimated_duration
    );

    if (!existingSlot) {
      console.warn(
        `Could not parse time for existing booking ${existingBooking.id}. Skipping conflict check.`
      );
      continue;
    }

    const existingStart = existingSlot.start.getTime();
    const existingEnd = existingSlot.end.getTime();

    // Check for overlap: (ProposedStart < ExistingEnd) and (ProposedEnd > ExistingStart)
    if (proposedStart < existingEnd && proposedEnd > existingStart) {
      conflictingBookings.push(existingBooking);
    }
  }

  return conflictingBookings;
};
