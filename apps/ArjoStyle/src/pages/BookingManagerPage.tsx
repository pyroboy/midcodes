// src/pages/BookingManagerPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
// Keep UI imports used directly on this page
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertCircle, Inbox, CalendarDays } from "lucide-react"; // Keep icons used here
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { parse, isValid, format as formatDateFn } from "date-fns";

// Component Imports
import { BookingDetailModal } from "@/components/admin/BookingDetailModal";
import { AiPromptEditor } from "@/components/admin/AiPromptEditor";
import { MultiMonthScheduler } from "@/components/scheduling/MultiMonthScheduler"; // Adjust path
import { ConflictResolutionModal } from "@/components/scheduling/ConflictResolutionModal"; // Adjust path
import { BookingListTable } from "@/components/admin/BookingListTable"; // <-- Import the new table component

// Type Imports
import { BookingData } from "@/types/bookings"; // Adjust path
import { Appointment, ALL_DAY_TIME_SLOTS } from "@/types/appointments"; // Adjust path

// --- Booking Manager Page Component ---
export const BookingManagerPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [schedulerAppointments, setSchedulerAppointments] = useState<
    Appointment[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingData | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [bookingToDelete, setBookingToDelete] = useState<BookingData | null>(
    null
  );
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [currentConflictData, setCurrentConflictData] = useState<{
    appointments: Appointment[];
    slot: string;
    date: Date;
  } | null>(null);

  // --- Map BookingData to Appointment format ---
  const mapBookingToAppointment = useCallback(
    (booking: BookingData): Appointment | null => {
      // Validate date and time
      if (
        !booking.requested_date ||
        !booking.requested_time ||
        !ALL_DAY_TIME_SLOTS.includes(booking.requested_time)
      ) {
        return null;
      }
      let parsedDate = parse(booking.requested_date, "yyyy-MM-dd", new Date());
      if (!isValid(parsedDate)) parsedDate = new Date(booking.requested_date);
      if (!isValid(parsedDate)) return null;

      // --- Get duration safely ---
      const duration =
        booking.estimated_duration !== null &&
        booking.estimated_duration !== undefined &&
        !isNaN(booking.estimated_duration) &&
        booking.estimated_duration > 0
          ? Number(booking.estimated_duration)
          : 60; // Default to 60 mins if invalid/missing for scheduling purpose

      const serviceValue: string =
        booking.category || booking.placement || "Tattoo";

      return {
        id: booking.id,
        date: parsedDate,
        time: booking.requested_time,
        status: booking.status,
        clientName: booking.name || "Unknown Client",
        service: serviceValue,
        durationMinutes: duration, // <-- MAP DURATION HERE
      };
    },
    []
  );
  // --- Fetch Bookings ---
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSchedulerAppointments([]); // Reset scheduler data
    console.log("Fetching bookings...");
    try {
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      const fetchedBookings = (data as BookingData[]) || [];
      setBookings(fetchedBookings);
      const mappedAppointments = fetchedBookings
        .map(mapBookingToAppointment)
        .filter((app): app is Appointment => app !== null);
      setSchedulerAppointments(mappedAppointments);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error fetching bookings.";
      console.error("Fetch Bookings error:", err);
      setError(`Failed to load bookings: ${message}`);
      setBookings([]);
      toast({
        variant: "destructive",
        title: "Error Loading Bookings",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [mapBookingToAppointment]); // Add mapBookingToAppointment as dependency

  // --- Effect to Fetch Data ---
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // --- Action Handlers ---
  const handleRowClick = useCallback((booking: BookingData) => {
    setViewingBooking(booking);
  }, []);

  const handleUpdateStatus = useCallback(
    async (id: string, newStatus: Appointment["status"]) => {
      try {
        const { error } = await supabase
          .from("bookings")
          .update({ status: newStatus })
          .eq("id", id);
        if (error) throw error;
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
        );
        setSchedulerAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
        // Also update data in conflict modal if open and relevant
        setCurrentConflictData((prev) => {
          if (!prev || !prev.appointments.some((app) => app.id === id))
            return prev; // No change needed if not relevant
          const updatedApps = prev.appointments.map((app) =>
            app.id === id ? { ...app, status: newStatus } : app
          );
          const remainingActive = updatedApps.filter(
            (app) => app.status !== "Rejected"
          );
          if (remainingActive.length < 2) {
            // Check if conflict resolved
            setIsConflictModalOpen(false);
            return null;
          }
          return { ...prev, appointments: updatedApps };
        });
        toast({
          title: "Status Updated",
          description: `Booking marked as ${newStatus}.`,
        });
      } catch (error) {
        console.error("Error updating status:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: (error as Error).message,
        });
      }
    },
    []
  ); // Dependency on setCurrentConflictData might be needed if used directly

  const openDeleteConfirmation = useCallback((booking: BookingData) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteBooking = useCallback(
    async (idToDelete?: string) => {
      const bookingId = idToDelete ?? bookingToDelete?.id;
      if (!bookingId) return;

      const bookingName =
        bookingToDelete?.name ?? // Get name before clearing state
        bookings.find((b) => b.id === bookingId)?.name ??
        currentConflictData?.appointments.find((a) => a.id === bookingId)
          ?.clientName ??
        "this booking";

      console.log(
        `Attempting to delete booking: ${bookingId} (${bookingName})`
      );
      setIsDeleteDialogOpen(false); // Close confirmation dialog immediately
      setBookingToDelete(null);

      try {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", bookingId);
        if (error) throw error;

        // Update lists
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setSchedulerAppointments((prev) =>
          prev.filter((a) => a.id !== bookingId)
        );

        toast({
          title: "Booking Deleted",
          description: `Booking for ${bookingName} removed.`,
        });

        // Update conflict modal if the deleted item was part of the conflict
        if (
          currentConflictData?.appointments.some((app) => app.id === bookingId)
        ) {
          const remainingConflicts = currentConflictData.appointments.filter(
            (app) => app.id !== bookingId
          );
          if (remainingConflicts.length < 2) {
            setIsConflictModalOpen(false);
            setCurrentConflictData(null);
          } else {
            setCurrentConflictData((prev) =>
              prev ? { ...prev, appointments: remainingConflicts } : null
            );
          }
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: (error as Error).message,
        });
      }
    },
    [bookingToDelete, bookings, currentConflictData]
  ); // Include dependencies

  const handleCalendarAppointmentClick = useCallback(
    (appointment: Appointment) => {
      const bookingData = bookings.find((b) => b.id === appointment.id);
      if (bookingData) {
        setViewingBooking(bookingData);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load booking details.",
        });
      }
    },
    [bookings]
  );

  const handleCalendarConflictClick = useCallback(
    (conflictingApps: Appointment[], slot: string, date: Date) => {
      console.warn(
        `Conflict detected at ${slot} on ${formatDateFn(date, "yyyy-MM-dd")}:`,
        conflictingApps
      );
      setCurrentConflictData({ appointments: conflictingApps, slot, date });
      setIsConflictModalOpen(true);
    },
    []
  );

  const handleViewConflictDetails = useCallback(
    (appointmentId: string) => {
      const bookingData = bookings.find((b) => b.id === appointmentId);
      if (bookingData) {
        setIsConflictModalOpen(false);
        setCurrentConflictData(null);
        setTimeout(() => {
          setViewingBooking(bookingData);
        }, 100); // Short delay
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load booking details.",
        });
      }
    },
    [bookings]
  );

  const handleConflictUpdateStatus = useCallback(
    async (appointmentId: string, newStatus: Appointment["status"]) => {
      console.log(
        `Updating status via conflict modal for ${appointmentId} to ${newStatus}`
      );
      // Re-use the main status update logic
      await handleUpdateStatus(appointmentId, newStatus);
    },
    [handleUpdateStatus]
  ); // Depend on the main updater

  // --- Rendering ---
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <AiPromptEditor />

      {/* Scheduler Card */}
      {!isLoading &&
        !error &&
        schedulerAppointments.length > 0 && ( // Show only if data available
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Appointment Calendar Overview
              </CardTitle>
              <CardDescription>
                Visual representation of scheduled appointments. Click a booked
                slot for details. Conflicts are highlighted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiMonthScheduler
                appointments={schedulerAppointments}
                onAppointmentClick={handleCalendarAppointmentClick}
                onConflictClick={handleCalendarConflictClick}
              />
            </CardContent>
          </Card>
        )}
      {/* Show loading indicator for scheduler if main loading is true */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Loading Calendar...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      )}

      {/* Booking List Card */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
            Booking Request List
          </CardTitle>
          <CardDescription>
            View, manage, and respond to incoming tattoo booking requests. Click
            a row to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading/Error/Empty states */}
          {isLoading && (
            <div className="flex flex-col justify-center items-center text-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-lg font-medium text-muted-foreground">
                Loading Bookings...
              </p>
            </div>
          )}
          {error && !isLoading && (
            <div className="py-10 px-4">
              <Alert variant="destructive" className="max-w-lg mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Bookings</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {!isLoading && !error && bookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-14 w-14 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold mb-1">No Bookings Found</p>
              <p className="text-sm text-muted-foreground">
                There are currently no booking requests to display.
              </p>
            </div>
          )}

          {/* Use the Extracted Table Component */}
          {!isLoading && !error && bookings.length > 0 && (
            <BookingListTable
              bookings={bookings}
              onRowClick={handleRowClick}
              onUpdateStatus={handleUpdateStatus}
              onDeleteClick={openDeleteConfirmation} // Pass handler to open confirmation dialog
            />
          )}
        </CardContent>
      </Card>

      {/* --- Modals --- */}
      <BookingDetailModal
        booking={viewingBooking}
        isOpen={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
        allBookings={bookings}
        onBookingUpdate={(updatedBooking) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
          );
          const updatedAppointment = mapBookingToAppointment(updatedBooking);
          if (updatedAppointment) {
            setSchedulerAppointments((prev) =>
              prev.map((a) =>
                a.id === updatedAppointment.id ? updatedAppointment : a
              )
            );
          }
        }}
      />
      {/* Standard Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              booking request for{" "}
              <span className="font-semibold">
                {bookingToDelete?.name ?? "this client"}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            {/* Calls confirmDeleteBooking using the state variable */}
            <AlertDialogAction
              onClick={() => confirmDeleteBooking()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onOpenChange={setIsConflictModalOpen}
        conflictDate={currentConflictData?.date ?? null}
        conflictSlot={currentConflictData?.slot ?? null}
        conflictingAppointments={currentConflictData?.appointments ?? []}
        onViewDetails={handleViewConflictDetails}
        onUpdateStatus={handleConflictUpdateStatus}
        onDeleteBooking={(id) => confirmDeleteBooking(id)} // Pass delete handler directly
      />
    </div> // End container div
  );
};
