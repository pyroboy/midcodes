// src/components/scheduling/MultiMonthScheduler.tsx (Corrected & Includes Duration Blocking + Hover Grouping)

import React, { useState, useMemo, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Import base react-day-picker styles
import {
  addMonths,
  subMonths,
  startOfMonth,
  format,
  isValid,
  parse,
  addMinutes,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { ChevronLeft, ChevronRight, AlertTriangle, Clock } from "lucide-react"; // Icons used
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // Utility for combining class names

// Import the types and constants we defined
import {
  Appointment,
  statusColors,
  ALL_DAY_TIME_SLOTS,
  // statusBadgeBaseClasses, // Defined locally below now
} from "@/types/appointments"; // Adjust path as necessary

// --- Component Props ---
interface MultiMonthSchedulerProps {
  appointments: Appointment[]; // Array of appointments with date, time, status, durationMinutes, etc.
  initialMonth?: Date; // Optional: Date object for the first month to display
  onAppointmentClick?: (appointment: Appointment) => void; // Optional: Callback when a booked, non-conflicting slot is clicked
  onConflictClick?: (
    // Optional: Callback when a conflicting slot (multiple bookings) is clicked
    conflictingApps: Appointment[],
    slot: string,
    date: Date
  ) => void;
}

// --- Helper Functions ---

// Creates a 'YYYY-MM-DD' string key from a Date object
const dateToKey = (date: Date): string => format(date, "yyyy-MM-dd");
const blockedSlotClasses =
  "bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed opacity-75";
const blockedSlotHoverClasses = "hover:!bg-slate-200 dark:hover:!bg-slate-700"; // Optional: subtle hover for blocked state
// Parses "h:mm a" time string into { hours: number; minutes: number } or null
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
  if (period === "AM" && hours === 12) hours = 0; // Handle midnight case
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
};

// Creates a Date object for a specific time slot on a given base date
const getSlotDateTime = (baseDate: Date, slotString: string): Date | null => {
  const timeParts = parseTimeString(slotString);
  if (!timeParts) return null;
  // Ensure we start from the base date but reset seconds/milliseconds for accurate comparison
  const slotDate = setHours(
    setMinutes(
      setSeconds(setMilliseconds(new Date(baseDate), 0), 0),
      timeParts.minutes
    ),
    timeParts.hours
  );
  return isValid(slotDate) ? slotDate : null;
};

// Define base classes for status badges if not imported elsewhere
const statusBadgeBaseClasses =
  "px-2 py-0.5 text-xs font-semibold rounded-full border";

// --- Main Scheduler Component ---
export const MultiMonthScheduler: React.FC<MultiMonthSchedulerProps> = ({
  appointments,
  initialMonth = new Date(), // Default to current month if not provided
  onAppointmentClick,
  onConflictClick,
}) => {
  // State for the first month displayed in the 3-month view
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(initialMonth)
  );
  // State for the currently selected day in the calendar
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  // State for tracking which booking group is hovered for highlighting
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

  // Memoize grouping appointments by date string ('YYYY-MM-DD') for performance
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((app) => {
      // Ensure date is valid before proceeding
      if (!app.date || !isValid(app.date)) {
        console.warn(
          `Invalid date found for appointment ID ${app.id}. Skipping.`
        );
        return;
      }
      const key = dateToKey(app.date);
      const existing = map.get(key) || [];
      map.set(key, [...existing, app]);
    });
    return map;
  }, [appointments]);

  // Handlers for month navigation
  const handlePreviousMonths = () => {
    setCurrentMonth((prev) => subMonths(prev, 3));
    setSelectedDay(null);
    setHoveredGroupId(null);
  };
  const handleNextMonths = () => {
    setCurrentMonth((prev) => addMonths(prev, 3));
    setSelectedDay(null);
    setHoveredGroupId(null);
  };

  // Handler for clicking a day cell in the calendar
  const handleDayClick = (day: Date | undefined) => {
    setSelectedDay(day && isValid(day) ? day : null);
    setHoveredGroupId(null); // Reset hover when day changes
  };

  // --- Day Picker Modifiers ---
  // Calculates modifiers for booked days based on highest priority status
  const bookedDaysModifiers = useMemo(() => {
    const modifiers: Record<string, Date[]> = {};
    // Initialize modifier keys based on defined statuses
    (Object.keys(statusColors) as Array<keyof typeof statusColors>).forEach(
      (status) => {
        modifiers[status] = [];
      }
    );

    appointmentsByDate.forEach((appsOnDate, dateKey) => {
      if (appsOnDate.length > 0) {
        try {
          const date = parse(dateKey, "yyyy-MM-dd", new Date());
          if (!isValid(date)) return; // Skip invalid date keys

          const priority: Record<Appointment["status"], number> = {
            Available: 0,
            Conflict: 6,
            Confirmed: 5,
            "Needs Info": 4,
            Pending: 3,
            Completed: 2,
            Rejected: 1,
          };
          // Find the status with the highest priority for the day
          let primaryStatus = appsOnDate[0].status; // Default to first
          if (appsOnDate.length > 1) {
            primaryStatus = appsOnDate.reduce((prevApp, currApp) => {
              const currentPriority = priority[currApp.status] ?? 0;
              const prevPriority = priority[prevApp.status] ?? 0;
              return currentPriority > prevPriority ? currApp : prevApp;
            }).status;
          }

          if (modifiers[primaryStatus]) {
            // Check if status is a valid key
            modifiers[primaryStatus].push(date);
          } else {
            console.warn(
              `Modifier key not pre-initialized or status invalid in bookedDaysModifiers: ${primaryStatus}`
            );
          }
        } catch (e) {
          console.error(
            `Error processing date key ${dateKey} for modifiers:`,
            e
          );
        }
      }
    });
    return modifiers;
  }, [appointmentsByDate]);

  // Define class names associated with modifiers (including status colors)
  const modifierClassNames = useMemo(() => {
    const classNames: Record<string, string> = {
      selected:
        "rdp-day_selected !bg-primary/90 !text-primary-foreground hover:!bg-primary focus:!bg-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-background",
      today:
        "rdp-day_today !text-accent-foreground !font-bold !border-primary/50",
      outside: "rdp-day_outside !text-muted-foreground/50",
      // Map status names (modifier keys from bookedDaysModifiers) to their corresponding CSS classes
      ...Object.entries(statusColors).reduce((acc, [status, colorClass]) => {
        // Combine base badge classes with specific status colors for the day cell background/border
        acc[status] = cn(
          statusBadgeBaseClasses,
          colorClass,
          "booked-day font-semibold !border-2"
        ); // Apply base classes + colors
        return acc;
      }, {} as Record<string, string>),
    };
    return classNames;
  }, []); // statusColors and statusBadgeBaseClasses are constants

  // --- Render Custom Day Content ---
  // Adds a dot indicator and tooltip for days with multiple appointments
  const renderDayContent = useCallback(
    (day: Date): React.ReactElement => {
      const key = dateToKey(day);
      const appsOnDay = appointmentsByDate.get(key);
      const numberOfAppointments = appsOnDay?.length ?? 0;
      const dayNumberElement = <span>{format(day, "d")}</span>; // Ensure always returns an element

      if (numberOfAppointments > 1) {
        return (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative w-full h-full flex items-center justify-center">
                  {dayNumberElement}
                  {/* Dot indicator for multiple appointments */}
                  <span className="absolute top-0.5 right-0.5 block h-1.5 w-1.5 rounded-full bg-destructive ring-1 ring-white dark:ring-slate-800" />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="bg-background border shadow-lg rounded-md p-2 text-xs max-w-xs z-10"
              >
                {" "}
                {/* Added z-10 */}
                <p className="font-semibold mb-1">
                  {numberOfAppointments} Appointments:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {appsOnDay?.slice(0, 5).map(
                    (
                      app // Limit tooltip list length
                    ) => (
                      <li key={app.id} className="truncate">
                        {app.time} - {app.clientName} ({app.status})
                      </li>
                    )
                  )}
                  {numberOfAppointments > 5 && <li>...and more</li>}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return dayNumberElement; // Return span for single/no appointments
    },
    [appointmentsByDate]
  );

  // --- Prepare Months to Display ---
  const monthsToDisplay: Date[] = [
    currentMonth,
    addMonths(currentMonth, 1),
    addMonths(currentMonth, 2),
  ];

  // --- Get & Sort Appointments for Selected Day (MEMOIZED) ---
  const appointmentsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    const apps = appointmentsByDate.get(dateToKey(selectedDay)) ?? [];
    apps.sort((a, b) => {
      // Sort by time
      try {
        const timeA = getSlotDateTime(selectedDay, a.time);
        const timeB = getSlotDateTime(selectedDay, b.time);
        if (!timeA || !timeB) return 0;
        return timeA.getTime() - timeB.getTime();
      } catch {
        return 0;
      }
    });
    return apps;
  }, [selectedDay, appointmentsByDate]);

  // --- Calculate Blocked Slots based on Duration (MEMOIZED) ---
  const blockedSlotsInfo = useMemo(() => {
    const blockedInfo: Record<string, { blocker: Appointment | null }> = {};
    if (!selectedDay) return blockedInfo;

    // Consider appointments that can actually block time
    const relevantAppointments = appointmentsForSelectedDay.filter(
      (app) =>
        ["Confirmed", "Pending", "Needs Info"].includes(app.status) &&
        app.durationMinutes > 0
    );

    // Calculate the time intervals covered by relevant appointments
    const appointmentIntervals = relevantAppointments
      .map((app) => {
        const slotDateTime = getSlotDateTime(selectedDay, app.time);
        if (!slotDateTime) return null;
        const startTime = slotDateTime.getTime();
        const duration = app.durationMinutes; // Assumes durationMinutes is a valid number > 0 here
        const endTime = addMinutes(slotDateTime, duration).getTime();
        return { start: startTime, end: endTime, blocker: app };
      })
      .filter((interval) => interval !== null) as {
      start: number;
      end: number;
      blocker: Appointment;
    }[];

    // Check each defined time slot against the calculated intervals
    for (const slot of ALL_DAY_TIME_SLOTS) {
      const slotDateTime = getSlotDateTime(selectedDay, slot);
      if (!slotDateTime) continue; // Skip invalid slots
      const slotStartTime = slotDateTime.getTime();

      // Find if this slot's start time falls within any appointment interval
      for (const interval of appointmentIntervals) {
        // A slot is blocked if its start time is >= an appointment's start AND < the appointment's end
        if (slotStartTime >= interval.start && slotStartTime < interval.end) {
          blockedInfo[slot] = { blocker: interval.blocker };
          break; // This slot is blocked, no need to check further intervals for it
        }
      }
    }
    return blockedInfo;
  }, [selectedDay, appointmentsForSelectedDay]); // Depends on selected day and its (memoized) appointments

  // --- Component Render ---
  return (
    <Card className="w-full">
      {/* Card Header with Title and Navigation */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          Appointment Calendar
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handlePreviousMonths}
            aria-label="Previous 3 months"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextMonths}
            aria-label="Next 3 months"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-0 pb-2">
        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
          {monthsToDisplay.map((month) => (
            <div
              key={format(month, "yyyy-MM")}
              className="flex flex-col items-center"
            >
              <h3 className="text-base font-semibold mb-2 text-center">
                {format(month, "MMMM yyyy")}
              </h3>
              <DayPicker
                month={month}
                onMonthChange={() => {}}
                showOutsideDays
                fixedWeeks
                numberOfMonths={1}
                mode="single"
                selected={selectedDay ?? undefined}
                onSelect={handleDayClick}
                modifiers={bookedDaysModifiers}
                modifiersClassNames={modifierClassNames}
                components={{
                  DayContent: (props) => renderDayContent(props.date),
                  IconLeft: () => null,
                  IconRight: () => null,
                  CaptionLabel: () => null,
                }}
                classNames={{
                  root: "border dark:border-slate-700 rounded-md p-2 w-full max-w-xs mx-auto bg-card text-card-foreground",
                  months:
                    "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  caption: "hidden",
                  nav: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  ),
                }}
              />
            </div>
          ))}
        </div>

        {/* Time Slot Display Section */}
        {selectedDay && (
          <div className="mt-6 pt-4 border-t dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-3 text-center">
              Schedule for {format(selectedDay, "MMMM d, yyyy")}
            </h3>
            {ALL_DAY_TIME_SLOTS.length > 0 ? (
              <div
                className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-2"
                onMouseLeave={() => setHoveredGroupId(null)}
              >
                {ALL_DAY_TIME_SLOTS.map((slot) => {
                  const appointmentsInSlot = appointmentsForSelectedDay.filter(
                    (app) => app.time === slot
                  );
                  const isBookedDirectly = appointmentsInSlot.length > 0;
                  const hasConflict = appointmentsInSlot.length > 1;
                  const blockingInfo = blockedSlotsInfo[slot];
                  const isBlockedByOther =
                    blockingInfo &&
                    blockingInfo.blocker &&
                    blockingInfo.blocker.time !== slot;
                  const blocker = blockingInfo?.blocker; // Convenience variable

                  const primaryAppointment: Appointment | undefined =
                    isBookedDirectly ? appointmentsInSlot[0] : undefined;
                  const groupId: string | null = hasConflict
                    ? null
                    : primaryAppointment?.id ?? blocker?.id ?? null;

                  let tooltipContent: React.ReactNode = null;
                  let isDisabled = false;
                  const buttonTextLine1: React.ReactNode = slot; // Top line is always the time
                  let buttonTextLine2: React.ReactNode = "(Available)"; // Bottom line text
                  let variant:
                    | "default"
                    | "outline"
                    | "destructive"
                    | "secondary" = "outline";
                  let buttonClasses =
                    "border-dashed text-muted-foreground hover:bg-accent dark:hover:bg-slate-700"; // Default available style
                  let labelForSlot = `Time slot ${slot} available`;

                  if (hasConflict) {
                    variant = "destructive";
                    buttonClasses =
                      "!bg-destructive !text-destructive-foreground !border-destructive hover:!bg-destructive/90 animate-pulse";
                    isDisabled = false;
                    buttonTextLine2 = (
                      <div className="flex items-center justify-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Conflict!
                      </div>
                    );
                    labelForSlot = `Time slot ${slot} has conflicting bookings`;
                    tooltipContent = (
                      <>
                        {" "}
                        <p className="font-bold text-destructive mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Conflict!
                        </p>
                        <ul className="space-y-1">
                          {" "}
                          {appointmentsInSlot.map((app) => (
                            <li key={app.id}>
                              - {app.clientName} ({app.status})
                            </li>
                          ))}{" "}
                        </ul>{" "}
                      </>
                    );
                  } else if (isBookedDirectly && primaryAppointment) {
                    const appStatusClass =
                      statusColors[primaryAppointment.status] || "";
                    variant = "default"; // Use default variant for booked solid colors
                    buttonClasses = cn(
                      appStatusClass.split(" ")[0], // bg
                      appStatusClass.split(" ")[2], // text
                      `border ${appStatusClass.split(" ")[1]}`, // border
                      `hover:${appStatusClass.split(" ")[0]}/90` // hover bg
                    );
                    isDisabled = false;
                    buttonTextLine2 = `(${primaryAppointment.clientName})`;
                    labelForSlot = `Time slot ${slot} booked by ${primaryAppointment.clientName}, status ${primaryAppointment.status}`;
                    tooltipContent = (
                      <>
                        {" "}
                        <p>
                          <strong>Time:</strong> {primaryAppointment.time}
                        </p>{" "}
                        <p>
                          <strong>Client:</strong>{" "}
                          {primaryAppointment.clientName}
                        </p>{" "}
                        <p>
                          <strong>Status:</strong> {primaryAppointment.status}
                        </p>{" "}
                        <p>
                          <strong>Duration:</strong>{" "}
                          {primaryAppointment.durationMinutes} min
                        </p>{" "}
                        {primaryAppointment.service && (
                          <p>
                            <strong>Service:</strong>{" "}
                            {primaryAppointment.service}
                          </p>
                        )}{" "}
                      </>
                    );
                  } else if (isBlockedByOther && blocker) {
                    // Check if blocker exists
                    variant = "secondary"; // Use secondary variant for blocked
                    buttonClasses = cn(
                      blockedSlotClasses,
                      blockedSlotHoverClasses
                    ); // Use defined blocked classes
                    isDisabled = true;
                    // --- UPDATED Button Text for Blocked Slots ---
                    buttonTextLine2 = (
                      <span
                        className="flex flex-col items-center text-center leading-tight"
                        title={`${blocker.clientName} - Blocked - Duration ${blocker.durationMinutes} min`}
                      >
                        <span>{blocker.clientName}</span>
                        <span className="opacity-80">
                          Blocked ({blocker.durationMinutes}m)
                        </span>
                      </span>
                    );
                    // ---
                    labelForSlot = `Time slot ${slot} blocked by ${blocker.clientName}'s appointment`;
                    tooltipContent = (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Blocked by{" "}
                        {blocker.clientName}'s {blocker.time} appt (
                        {blocker.durationMinutes} min)
                      </p>
                    );
                  }

                  // --- Determine Hover Group Style ---
                  const hoverGroupStyle =
                    groupId &&
                    hoveredGroupId === groupId &&
                    !hasConflict &&
                    !isBlockedByOther
                      ? "ring-2 ring-offset-2 ring-offset-background ring-indigo-500 dark:ring-indigo-400 opacity-100 scale-105 z-10"
                      : "";

                  const handleSlotClick = () => {
                    if (isDisabled) return;
                    if (hasConflict && onConflictClick)
                      onConflictClick(appointmentsInSlot, slot, selectedDay);
                    else if (
                      isBookedDirectly &&
                      primaryAppointment &&
                      onAppointmentClick
                    )
                      onAppointmentClick(primaryAppointment);
                  };

                  return (
                    <TooltipProvider
                      key={`${dateToKey(selectedDay)}-${slot}`}
                      delayDuration={100}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={variant}
                            className={cn(
                              "w-full justify-center text-xs h-auto min-h-[2.5rem] sm:min-h-[2.5rem] flex flex-col relative text-center transition-all duration-150 ease-in-out px-1 py-1 leading-tight", // Adjusted height/padding
                              buttonClasses, // Base style determined above
                              hoverGroupStyle // Apply hover group style
                            )}
                            size="sm"
                            onClick={handleSlotClick}
                            disabled={isDisabled}
                            aria-label={labelForSlot}
                            onMouseEnter={() =>
                              groupId && setHoveredGroupId(groupId)
                            }
                          >
                            {/* Line 1: Time Slot */}
                            <span className="font-medium text-[0.7rem] sm:text-xs">
                              {buttonTextLine1}
                            </span>
                            {/* Line 2: Status/Client/Blocked Info */}
                            <span
                              className={cn(
                                "block text-[10px] w-full truncate mt-0.5 font-normal px-1",
                                hasConflict && "text-destructive-foreground",
                                isBlockedByOther && "!text-inherit" // Use text color from buttonClasses
                              )}
                            >
                              {buttonTextLine2}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        {tooltipContent && (
                          <TooltipContent className="bg-background border shadow-lg p-2 text-xs max-w-xs z-20">
                            {" "}
                            {/* Ensure tooltip above hover */}
                            {tooltipContent}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm">
                No time slots defined for scheduling.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
