// supabase/functions/get-available-slots/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts"; // Adjust path based on your file structure

// Import date-fns functions using esm.sh for Deno compatibility
// Pinning version for stability is recommended
import {
  parse as parseDate,
  isValid,
  addMinutes,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "https://esm.sh/date-fns@2.30.0";

console.log("Function 'get-available-slots' initializing...");

// --- Constants ---
const BOOKINGS_TABLE = "bookings";
// This list MUST match the list used in your frontend SchedulingStep component
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
const DEFAULT_DURATION_MINUTES = 60; // Default duration in minutes if missing/invalid in DB

// --- Helper Functions ---

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
  if (period === "AM" && hours === 12) hours = 0; // Midnight case
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
};

// Creates a Date object for a specific time slot on a given base date (represented as YYYY-MM-DD string)
// Timezone Consideration: Parsing YYYY-MM-DD can be tricky. `new Date('YYYY-MM-DD')` often assumes UTC midnight.
// `parseDate('YYYY-MM-DD', 'yyyy-MM-dd', new Date())` tends to use the runtime's local timezone midnight.
// Setting hours/minutes might then be relative to that timezone.
// For consistency, especially if your server runs in UTC, consider storing requested_date as a full timestamp
// or using a library like date-fns-tz for explicit timezone handling (e.g., 'Asia/Manila').
// This implementation assumes calculations are consistent within the function's runtime environment.
const getSlotDateTime = (
  baseDateStr: string,
  slotString: string
): Date | null => {
  const timeParts = parseTimeString(slotString);
  if (!timeParts) return null;
  // Parse the date string, assuming it represents the intended local date
  const datePart = parseDate(baseDateStr, "yyyy-MM-dd", new Date());
  if (!isValid(datePart)) return null;

  // Set time components onto the parsed date, resetting smaller units
  const slotDate = setHours(
    setMinutes(setSeconds(setMilliseconds(datePart, 0), 0), timeParts.minutes),
    timeParts.hours
  );
  return isValid(slotDate) ? slotDate : null;
};

// --- Main Function Handler ---
serve(async (req: Request) => {
  const requestStartTime = Date.now();
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(requestOrigin); // Use shared CORS logic

  console.log(
    `\n--- New Request [${requestStartTime}]: ${req.method} ${req.url} Origin: ${requestOrigin} ---`
  );

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    console.log(`[${requestStartTime}] Handling OPTIONS request.`);
    return new Response("ok", { headers: corsHeaders });
  }
  // Basic method check
  if (req.method !== "POST") {
    console.warn(`[${requestStartTime}] Invalid method: ${req.method}`);
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // Ensure origin is allowed (redundant if OPTIONS works, but safe)
  if (!corsHeaders["Access-Control-Allow-Origin"]) {
    console.warn(`[${requestStartTime}] Origin not allowed: ${requestOrigin}`);
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // --- 1. Get Secrets ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Use Service Role Key
    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        `[${requestStartTime}] CRITICAL: Missing Supabase URL or Service Role Key.`
      );
      throw new Error("Server configuration error.");
    }
    console.log(`[${requestStartTime}] Secrets loaded.`);

    // --- 2. Parse Request Body ---
    let payload;
    try {
      payload = await req.json();
    } catch (_e) {
      throw new Error(
        "Invalid request body. Expected JSON with a 'date' property (YYYY-MM-DD)."
      );
    }
    const requestedDateStr = payload?.date;

    // Validate date input
    if (
      !requestedDateStr ||
      typeof requestedDateStr !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(requestedDateStr)
    ) {
      throw new Error(
        "Invalid or missing 'date' in request body. Expected format: YYYY-MM-DD."
      );
    }
    const parsedRequestedDate = parseDate(
      requestedDateStr,
      "yyyy-MM-dd",
      new Date()
    );
    if (!isValid(parsedRequestedDate)) {
      throw new Error("Invalid date value provided.");
    }
    console.log(
      `[${requestStartTime}] Request body parsed. Date requested: ${requestedDateStr}`
    );

    // --- 3. Create Supabase Admin Client ---
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    console.log(`[${requestStartTime}] Supabase admin client created.`);

    // --- 4. Fetch Relevant Bookings ---
    console.log(
      `[${requestStartTime}] Fetching bookings for date: ${requestedDateStr}...`
    );
    // Ensure your 'requested_date' column is of type 'date' in Supabase for this query to work efficiently.
    // If it's 'timestamp with time zone', you might need date range casting in the query.
    const { data: bookingsOnDate, error: fetchError } = await supabaseAdmin
      .from(BOOKINGS_TABLE)
      .select("id, requested_time, estimated_duration, status") // Select necessary fields
      .eq("requested_date", requestedDateStr) // Filter by the exact date string
      .in("status", ["Confirmed", "Pending", "Needs Info"]); // Relevant statuses

    if (fetchError) {
      console.error(`[${requestStartTime}] Supabase fetch error:`, fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }
    console.log(
      `[${requestStartTime}] Found ${
        bookingsOnDate?.length ?? 0
      } relevant bookings.`
    );

    // --- 5. Calculate Blocked Intervals ---
    const blockedIntervals: { start: number; end: number }[] = [];
    if (bookingsOnDate) {
      for (const booking of bookingsOnDate) {
        if (!booking.requested_time) continue; // Skip booking if time is missing

        const slotDateTime = getSlotDateTime(
          requestedDateStr,
          booking.requested_time
        );
        if (!slotDateTime) {
          console.warn(
            `[${requestStartTime}] Could not parse time '${booking.requested_time}' for booking ${booking.id}. Skipping interval calc.`
          );
          continue;
        }

        const startTime = slotDateTime.getTime();
        // Use booking duration, default if missing/invalid
        const duration =
          booking.estimated_duration && booking.estimated_duration > 0
            ? booking.estimated_duration
            : DEFAULT_DURATION_MINUTES;
        const endTime = addMinutes(slotDateTime, duration).getTime();

        blockedIntervals.push({ start: startTime, end: endTime });
      }
    }
    console.log(
      `[${requestStartTime}] Calculated ${blockedIntervals.length} blocked intervals.`
    );

    // --- 6. Determine Available Slots ---
    const availableSlots: string[] = [];
    for (const slot of ALL_DAY_TIME_SLOTS) {
      const slotDateTime = getSlotDateTime(requestedDateStr, slot);
      if (!slotDateTime) {
        console.warn(
          `[${requestStartTime}] Could not parse potential slot time '${slot}'. Skipping availability check.`
        );
        continue; // Skip invalid potential slots
      }
      const slotStartTime = slotDateTime.getTime();
      let isBlocked = false;

      // Check if the slot's start time falls within any blocked interval
      for (const interval of blockedIntervals) {
        // Slot is blocked if: SlotStart >= IntervalStart AND SlotStart < IntervalEnd
        if (slotStartTime >= interval.start && slotStartTime < interval.end) {
          isBlocked = true;
          break;
        }
      }

      if (!isBlocked) {
        availableSlots.push(slot);
      }
    }
    console.log(
      `[${requestStartTime}] Determined available slots:`,
      availableSlots
    );

    // --- 7. Return Success Response ---
    const durationMs = Date.now() - requestStartTime;
    console.log(
      `[${requestStartTime}] Returning successful response. Duration: ${durationMs}ms`
    );
    return new Response(
      JSON.stringify(availableSlots), // Return array of available slot strings
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    // --- Error Handling ---
    const durationMs = Date.now() - requestStartTime;
    const message =
      error instanceof Error
        ? error.message
        : "An unknown internal error occurred.";
    console.error(
      `[${requestStartTime}] Edge Function Error after ${durationMs}ms:`,
      message,
      error
    );
    return new Response(JSON.stringify({ error: message }), {
      status:
        error instanceof Error && error.message.includes("Invalid") ? 400 : 500, // Bad Request for validation errors
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("Function 'get-available-slots' handler registered.");
