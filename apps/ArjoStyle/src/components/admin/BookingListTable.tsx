// src/components/admin/BookingListTable.tsx

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  FileImage,
  Trash2,
  XCircle,
} from "lucide-react";
import { BookingData } from "@/types/bookings"; // Adjust path
import { Appointment } from "@/types/appointments"; // Adjust path if needed for status types

// Re-import or redefine helpers if not globally available
const formatDateForDisplay = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "N/A";
  try {
    // Use a more specific locale if desired, e.g., 'en-PH'
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
      new Date(dateString)
    );
  } catch (e) {
    return "Invalid Date";
  }
};
const formatAppointmentDateTime = (
  dateString: string | null | undefined,
  timeString: string | null | undefined
): string => {
  if (!dateString) return "N/A";
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }; // Adjusted format
    let dateToFormat: Date;
    // Handle 'YYYY-MM-DD' - Assume local timezone if no time provided initially
    if (dateString.length === 10 && !dateString.includes("T")) {
      // Use UTC parsing to avoid timezone shifts from just date string
      dateToFormat = new Date(dateString + "T00:00:00Z");
      // Add time if available, interpreting it in the *local* timezone context of the originally parsed UTC date
      if (timeString) {
        const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const period = timeParts[3]?.toUpperCase();
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0; // Handle midnight
          // Set hours/minutes based on the *date* object already created (which is UTC midnight)
          dateToFormat.setUTCHours(hours, minutes); // Keep setting in UTC since base date is UTC
          options.hour = "numeric";
          options.minute = "2-digit";
          options.timeZone = "UTC"; // Display in UTC since we constructed it that way
        }
      }
    } else {
      // Assume it's an ISO string already
      dateToFormat = new Date(dateString);
      if (timeString) {
        // If time string is ALSO provided with ISO date, prefer the time string
        const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeParts) {
          /* .. set hours/minutes as above .. */
          // Need to decide if ISO date's time or separate timeString takes precedence
          // Let's assume timeString overrides for now if present
          const hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          // ... AM/PM logic ...
          dateToFormat.setHours(hours, minutes); // Set in local time based on ISO date's base
          options.hour = "numeric";
          options.minute = "2-digit";
          // Don't set timeZone option if using local time conversion
        } else {
          // ISO includes time, use it
          options.hour = "numeric";
          options.minute = "2-digit";
        }
      } else if (dateString.includes("T")) {
        // ISO includes time, use it
        options.hour = "numeric";
        options.minute = "2-digit";
      }
    }

    if (isNaN(dateToFormat.getTime())) return "Invalid Date"; // Check validity
    return new Intl.DateTimeFormat("en-US", options).format(dateToFormat);
  } catch (e) {
    return "Invalid Date/Time";
  }
};

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return "N/A";
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};
const getStatusBadgeVariant = (
  status: BookingData["status"]
): "default" | "secondary" | "destructive" | "outline" | "warning" => {
  switch (status) {
    case "Confirmed":
      return "default";
    case "Pending":
      return "secondary";
    case "Needs Info":
      return "warning"; // Use warning variant
    case "Rejected":
      return "destructive";
    case "Completed":
      return "outline";
    default:
      return "secondary";
  }
};

interface BookingListTableProps {
  bookings: BookingData[];
  onRowClick: (booking: BookingData) => void;
  onUpdateStatus: (id: string, status: Appointment["status"]) => void;
  onDeleteClick: (booking: BookingData) => void; // Pass the full booking for context
}

export const BookingListTable: React.FC<BookingListTableProps> = ({
  bookings,
  onRowClick,
  onUpdateStatus,
  onDeleteClick,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[130px]">Submitted</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="w-[200px]">Appointment</TableHead>
            <TableHead>Placement</TableHead>
            <TableHead className="w-[80px] text-center">Refs</TableHead>
            <TableHead className="w-[120px]">Est. Price</TableHead>
            <TableHead className="text-right w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow
              key={booking.id}
              onClick={() => onRowClick(booking)}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <Badge variant={getStatusBadgeVariant(booking.status)}>
                  {booking.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDateForDisplay(booking.created_at)}</TableCell>
              <TableCell>
                <div className="font-medium">{booking.name}</div>
                <div
                  className="text-xs text-muted-foreground truncate"
                  title={booking.email}
                >
                  {booking.email}
                </div>
              </TableCell>
              <TableCell>
                {formatAppointmentDateTime(
                  booking.requested_date,
                  booking.requested_time
                )}
              </TableCell>
              <TableCell
                className="max-w-[150px] truncate"
                title={booking.placement || booking.category || undefined}
              >
                {booking.placement || booking.category || "N/A"}
              </TableCell>
              <TableCell className="text-center">
                {(booking.reference_image_urls?.length ?? 0) > 0 ? (
                  <Badge
                    variant="outline"
                    title={`${booking.reference_image_urls!.length} image(s)`}
                  >
                    <FileImage className="h-3 w-3 mr-1" />
                    {booking.reference_image_urls!.length}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {formatCurrency(booking.pricing_details?.total)}
              </TableCell>
              <TableCell className="text-right space-x-1">
                {/* Status Change Buttons */}
                {booking.status === "Pending" && (
                  <>
                    {" "}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(booking.id, "Confirmed");
                      }}
                      title="Confirm"
                    >
                      {" "}
                      <CheckCircle className="h-4 w-4" />{" "}
                    </Button>{" "}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(booking.id, "Needs Info");
                      }}
                      title="Needs Info"
                    >
                      {" "}
                      <AlertCircle className="h-4 w-4" />{" "}
                    </Button>{" "}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(booking.id, "Rejected");
                      }}
                      title="Reject"
                    >
                      {" "}
                      <XCircle className="h-4 w-4" />{" "}
                    </Button>{" "}
                  </>
                )}
                {booking.status === "Confirmed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(booking.id, "Completed");
                    }}
                    title="Mark Completed"
                  >
                    {" "}
                    <CheckCircle className="h-4 w-4" />{" "}
                  </Button>
                )}
                {booking.status === "Needs Info" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(booking.id, "Confirmed");
                    }}
                    title="Confirm"
                  >
                    {" "}
                    <CheckCircle className="h-4 w-4" />{" "}
                  </Button>
                )}
                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(booking);
                  }}
                  title="Delete Booking"
                >
                  {" "}
                  <Trash2 className="h-4 w-4" />{" "}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
