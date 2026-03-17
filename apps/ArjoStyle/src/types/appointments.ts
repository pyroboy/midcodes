// src/types/appointments.ts (Create this file or add to existing types)
// src/types/appointments.ts (Ensure statuses match BookingData)
export interface Appointment {
  id: string;
  date: Date;
  time: string; // e.g., "10:00 AM"
  status:
    | "Available"
    | "Pending"
    | "Confirmed"
    | "Rejected"
    | "Completed"
    | "Needs Info"
    | "Conflict"; // Match BookingData

  clientName: string;
  service?: string;
  durationMinutes: number; // <-- ADD DURATION (in minutes)
}

export const statusColors: Record<Appointment["status"], string> = {
  Available: "bg-gray-200 border-gray-300 text-gray-900",
  Pending: "bg-yellow-400 border-yellow-500 text-yellow-900",
  "Needs Info": "bg-orange-400 border-orange-500 text-orange-900", // Added Needs Info
  Confirmed: "bg-green-500 border-green-600 text-white",
  Completed: "bg-blue-500 border-blue-600 text-white",
  Rejected: "bg-red-500 border-red-600 text-white",
  Conflict: "bg-red-600 border-red-600 text-white",
};

// Define possible time slots for a day
export const ALL_DAY_TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  // Add more if needed
];
