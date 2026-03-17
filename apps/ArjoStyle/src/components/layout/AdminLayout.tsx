// src/layouts/AdminLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { AdminNavbar } from "@/components/admin/AdminNavbar"; // Adjust path

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <AdminNavbar />
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Outlet renders the specific admin page component matched by the route */}
        <Outlet />
      </main>
      {/* Optional: Add a minimal admin footer if needed */}
      {/* <footer className="py-4 text-center text-xs text-muted-foreground border-t">Admin Footer</footer> */}
    </div>
  );
};
