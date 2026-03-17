// src/components/admin/AdminNavbar.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContextDefinition";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, LayoutDashboard, Map } from "lucide-react"; // Added icons
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Optional: For user icon

export const AdminNavbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate("/"); // Redirect to home page after sign out
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: (error as Error).message || "Could not sign out.",
      });
    }
  };

  // Get first initial for Avatar fallback
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <nav className="bg-card dark:bg-gray-800 border-b border-border dark:border-gray-700 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side: Brand/Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-xl font-semibold text-foreground dark:text-white hover:opacity-80 transition-opacity"
            >
              ArjoStyle <span className="text-primary font-normal">Admin</span>
            </Link>
            {/* Admin Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/admin/booking-manager"
                className="text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard size={16} />
                Bookings
              </Link>
              <Link
                to="/admin/model-mapping"
                className="text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Map size={16} />
                3D Mapping
              </Link>
              {/* Add more admin links here */}
            </div>
          </div>

          {/* Right Side: User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    {/* Optional: Add Avatar image if you store one */}
                    {/* <AvatarImage src="/path-to-user-image.jpg" alt={user.email} /> */}
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin</p>
                    <p
                      className="text-xs leading-none text-muted-foreground truncate"
                      title={user.email}
                    >
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Add links to profile/settings if needed */}
                {/* <DropdownMenuItem>Profile</DropdownMenuItem> */}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
};
