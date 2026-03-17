// src/lib/formatters.ts
import React from "react"; // Essential for JSX
import { format, parseISO } from "date-fns";
import { LinkIcon } from "lucide-react"; // Make sure this import is correct
import { cn } from "@/lib/utils";

// --- Helper Functions ---

// Default placeholder for displayOrDefault - simpler approach
const defaultPlaceholder = (
  <span className="text-muted-foreground italic">N/A</span>
);

//function get complexity description 1-3

export const getComplexityDescription = (value: number): string => {
  if (value < 1 || value > 3) return "Invalid Complexity";
  return ["Simple", "Detailed", "Intricate"][value - 1];
};

export const getFreedomDescription = (
  value: number | null | undefined
): string => {
  const creativityValue = value ?? 50; // Default to 50 if null/undefined
  if (creativityValue <= 20) return "Exact Copy";
  if (creativityValue <= 40) return "Slight Changes";
  if (creativityValue <= 60) return "Small Changes";
  if (creativityValue <= 80) return "Custom";
  return "All Original";
};

export const displayOrDefault = (
  value: unknown,
  placeholder: React.ReactNode = defaultPlaceholder // Use the variable
): React.ReactNode => {
  if (value === null || value === undefined || value === "") return placeholder;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (React.isValidElement(value)) return value;
  return String(value);
};

export const renderLink = (
  url: string | null | undefined,
  prefix: string,
  label?: string
): React.ReactNode => {
  if (!url) return displayOrDefault(url); // Use corrected displayOrDefault
  const displayLabel = label || url;
  const fullUrl =
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith(prefix)
      ? url
      : `${prefix}${url}`;

  // Ensure this returns a single, valid JSX element
  return (
    <a
      href={fullUrl} // Use curly braces for variable
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline break-all flex items-center gap-1 text-right ml-auto" // Class names as string
      title={fullUrl} // Use curly braces for variable
    >
      {" "}
      {/* Closing bracket for the opening tag */}
      <LinkIcon className="h-3 w-3 flex-shrink-0" /> {/* Component usage */}
      <span className="truncate">{displayLabel}</span> {/* Component usage */}
    </a> // Closing tag for the 'a' element
  ); // End of return statement
}; // End of function definition

export const formatDetailDate = (
  dateString: string | null | undefined,
  formatString = "MMM d, yyyy" // Corrected example format
): React.ReactNode => {
  if (!dateString) return displayOrDefault(null);
  try {
    const dateToParse =
      dateString.length === 10 ? `${dateString}T00:00:00Z` : dateString;
    return format(parseISO(dateToParse), formatString);
  } catch (e) {
    try {
      return format(new Date(dateString), formatString);
    } catch (e2) {
      console.error("Error formatting date:", dateString, e2);
      // Ensure JSX is correctly formed
      return <span className="text-destructive">Invalid Date</span>;
    }
  }
};

export const formatDetailDateTime = (
  dateString: string | null | undefined,
  timeString: string | null | undefined
): React.ReactNode => {
  if (!dateString) return displayOrDefault(null);
  try {
    let baseDate: Date;
    if (dateString.length === 10) {
      const [year, month, day] = dateString.split("-").map(Number);
      baseDate = new Date(year, month - 1, day);
      if (isNaN(baseDate.getTime())) throw new Error("Invalid date components");
    } else {
      baseDate = parseISO(dateString);
      if (isNaN(baseDate.getTime())) throw new Error("Invalid ISO date string");
    }

    if (timeString) {
      const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const period = timeParts[3]?.toUpperCase();
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        if (
          !isNaN(hours) &&
          hours >= 0 &&
          hours <= 23 &&
          !isNaN(minutes) &&
          minutes >= 0 &&
          minutes <= 59
        ) {
          baseDate.setHours(hours, minutes, 0, 0);
        } else {
          console.warn("Could not parse valid time parts from:", timeString);
        }
      } else {
        console.warn("Time format not recognized:", timeString);
      }
      return format(baseDate, "MMM d, yyyy, h:mm a"); // Corrected example format
    } else if (dateString.includes("T") || dateString.includes(":")) {
      return format(baseDate, "MMM d, yyyy, h:mm a"); // Corrected example format
    } else {
      return format(baseDate, "MMM d, yyyy"); // Corrected example format
    }
  } catch (e) {
    console.error(
      "Error formatting detail date/time:",
      dateString,
      timeString,
      e
    );
    // Ensure JSX is correctly formed
    return <span className="text-destructive">Invalid Date/Time</span>;
  }
};

export const formatCurrency = (amount: number | undefined): React.ReactNode => {
  if (amount === undefined || amount === null || isNaN(amount))
    return displayOrDefault(null);
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatDuration = (
  totalMinutes: number | undefined
): React.ReactNode => {
  const MINIMUM_DURATION_MINUTES = 30;

  if (totalMinutes === undefined || totalMinutes < 1 || isNaN(totalMinutes)) {
    return displayOrDefault(null);
  }

  const effectiveMinutes = Math.max(MINIMUM_DURATION_MINUTES, totalMinutes);
  const hoursDecimal = effectiveMinutes / 60;
  const formattedHours = parseFloat(hoursDecimal.toFixed(1)); // One decimal place

  return `~ ${formattedHours} hr${formattedHours === 1 ? "" : "s"}`;
};

export const getComplexityLabel = (level?: number): React.ReactNode => {
  if (level === undefined || level === null || level < 1 || level > 3)
    return displayOrDefault(null);
  return ["Simple", "Detailed", "Intricate"][level - 1];
};

interface BookingStatus {
  status:
    | "Available"
    | "Pending"
    | "Confirmed"
    | "Rejected"
    | "Completed"
    | "Needs Info"
    | "Conflict";
}

export const getStatusBadgeVariant = (
  status: BookingStatus["status"]
): "default" | "secondary" | "destructive" | "outline" | "warning" => {
  switch (status) {
    case "Conflict":
      return "destructive";
    case "Available":
      return "default";
    case "Confirmed":
      return "default";
    case "Pending":
      return "secondary";
    case "Needs Info":
      return "warning";
    case "Rejected":
      return "destructive";
    case "Completed":
      return "outline";
    default:
      return "secondary";
  }
};

// formatAppointmentDateTime
export const formatAppointmentDateTime = (
  dateString: string | null | undefined,
  timeString: string | null | undefined
): React.ReactNode => {
  if (!dateString) return displayOrDefault(null);
  try {
    const date = parseISO(dateString);
    if (timeString) {
      const [hours, minutes] = timeString.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    return format(date, "MMM d, yyyy, h:mm a");
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return displayOrDefault(null);
  }
};
