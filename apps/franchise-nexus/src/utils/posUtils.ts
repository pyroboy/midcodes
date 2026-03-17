import React from 'react';
import { Badge } from "@/components/ui/badge";

// Mock POS systems
export const posSystems = [
  {
    id: "1",
    name: "Square",
    status: "connected",
    lastSync: "Today, 10:23 AM",
    icon: "/square-logo.png",
  },
  {
    id: "2",
    name: "Toast",
    status: "error",
    lastSync: "Yesterday, 2:15 PM",
    icon: "/toast-logo.png",
  },
  {
    id: "3",
    name: "Clover",
    status: "pending",
    lastSync: "Never",
    icon: "/clover-logo.png",
  },
];

// Mock menu sync status
export const menuSyncStatus = {
  pendingChanges: 12,
  lastPublished: "Yesterday, 4:30 PM",
  syncProgress: 68,
};