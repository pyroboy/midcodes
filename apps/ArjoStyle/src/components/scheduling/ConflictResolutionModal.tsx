// src/components/scheduling/ConflictResolutionModal.tsx

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // Import DialogClose for a standard close button
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  User,
  XCircle,
  AlertCircle as AlertCircleIcon,
  CheckCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Import types and status colors
import { Appointment, statusColors } from "@/types/appointments"; // Adjust path if needed

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conflictDate: Date | null;
  conflictSlot: string | null;
  conflictingAppointments: Appointment[];
  onViewDetails: (appointmentId: string) => void; // Callback to view full booking
  onUpdateStatus: (
    appointmentId: string,
    newStatus: Appointment["status"]
  ) => void; // Callback to update status
  onDeleteBooking?: (appointmentId: string) => void; // Optional: Callback to delete directly
}

export const ConflictResolutionModal: React.FC<
  ConflictResolutionModalProps
> = ({
  isOpen,
  onOpenChange,
  conflictDate,
  conflictSlot,
  conflictingAppointments,
  onViewDetails,
  onUpdateStatus,
  onDeleteBooking,
}) => {
  if (!conflictDate || !conflictSlot || conflictingAppointments.length < 2) {
    // Don't render if data is incomplete or there's no conflict
    return null;
  }

  const formattedDate = format(conflictDate, "MMMM d, yyyy");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pr-6">
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Booking Conflict Detected
          </DialogTitle>
          <DialogDescription className="text-base">
            Multiple appointments found for{" "}
            <strong className="text-foreground">{conflictSlot}</strong> on{" "}
            <strong className="text-foreground">{formattedDate}</strong>. Please
            review and resolve.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-3 flex-shrink-0" />

        {/* Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-4">
          {conflictingAppointments.map((app, index) => {
            const statusClass =
              statusColors[app.status] ||
              "bg-gray-500 border-gray-600 text-white"; // Fallback color
            return (
              <div
                key={app.id}
                className="p-4 border rounded-lg bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                {/* Appointment Details */}
                <div className="flex-grow space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", statusClass)}
                    >
                      {app.status}
                    </Badge>
                    <p className="font-semibold text-foreground truncate">
                      <User className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {app.clientName}
                    </p>
                  </div>
                  {app.service && (
                    <p className="text-muted-foreground truncate">
                      Service: {app.service}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    ID: {app.id.substring(0, 8)}...
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => onViewDetails(app.id)}
                    title="View Full Booking Details"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  {/* Quick Status Change Buttons */}
                  {app.status !== "Needs Info" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                      onClick={() => onUpdateStatus(app.id, "Needs Info")}
                      title="Mark as 'Needs Info'"
                    >
                      <AlertCircleIcon className="h-3.5 w-3.5 mr-1" /> Needs
                      Info
                    </Button>
                  )}
                  {app.status !== "Rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                      onClick={() => onUpdateStatus(app.id, "Rejected")}
                      title="Reject this Booking"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  )}
                  {/* Optional: Add Confirm button if applicable */}
                  {/* {['Pending', 'Needs Info'].includes(app.status) && (
                             <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                                onClick={() => onUpdateStatus(app.id, 'Confirmed')}
                                title="Confirm this Booking"
                             >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Confirm
                             </Button>
                        )} */}
                  {/* Optional: Direct Delete Button */}
                  {onDeleteBooking && (
                    <Button
                      variant="ghost" // Use ghost for less emphasis than reject
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => onDeleteBooking(app.id)}
                      title="Delete this Booking"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="mt-3 mb-3 flex-shrink-0" />

        <DialogFooter className="flex-shrink-0 pt-0">
          {/* Use DialogClose for standard closing behavior */}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
