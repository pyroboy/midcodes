
import { useState, useEffect } from "react";
import { User, LogOut, UserRound, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string | null;
  onLogout: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export function UserProfileModal({ 
  open, 
  onOpenChange, 
  userRole, 
  onLogout,
  isDarkMode = false,
  onToggleTheme = () => {}
}: UserProfileModalProps) {
  
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("User signing out:", { role: userRole, timestamp: new Date().toISOString() });
    localStorage.removeItem("userRole");
    onLogout();
    toast("Logged out successfully", {
      description: "You have been signed out of your account."
    });
    onOpenChange(false);
    navigate("/");
  };

  // Capitalize first letter of role for display
  const displayRole = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Guest";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            Your current session and role information
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-4 py-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10">
              <UserRound className="h-10 w-10 text-primary" />
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <h3 className="font-medium text-lg">{displayRole}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4" />
              <span>Role-based access user</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Logged in with {displayRole} permissions
            </p>
          </div>
        </div>
        
        <div className="bg-muted p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-2">Access Information</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium">{displayRole}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Session:</span>
              <span className="font-medium">Active</span>
            </li>
          </ul>
        </div>
        
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Dark Mode</span>
            {isDarkMode && <Sun className="h-4 w-4 text-yellow-400 ml-2" />}
          </div>
          <Switch
            checked={isDarkMode}
            onCheckedChange={onToggleTheme}
          />
        </div>

        <DialogFooter>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
