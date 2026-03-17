// src/components/auth/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContextDefinition"; // Adjust path if needed
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  element: React.ReactElement;
  adminOnly?: boolean; // Optional: Add flag for admin-specific routes
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  adminOnly = false,
}) => {
  const { session, loading, user /*, isAdmin*/ } = useAuth(); // Get auth state
  const location = useLocation();

  if (loading) {
    // Show a loading indicator while checking authentication status
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !user) {
    // User not logged in, redirect them to the home page (or a login page)
    // Pass the current location to redirect back after login (optional)
    console.log("ProtectedRoute: No session, redirecting to /");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // --- Optional: Role Check ---
  // if (adminOnly && !isAdmin) {
  //   // User is logged in but not an admin, redirect or show 'Unauthorized'
  //   console.log("ProtectedRoute: User is not admin, redirecting to /");
  //   // return <Navigate to="/unauthorized" replace />; // Or redirect home
  //   return <Navigate to="/" replace />;
  // }
  // --- End Optional Role Check ---

  // User is authenticated (and authorized if adminOnly check passes)
  return element;
};
