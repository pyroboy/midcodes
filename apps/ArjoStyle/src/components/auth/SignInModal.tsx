import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom"; // <-- 1. Import useNavigate
import {
  Dialog,
  // ... other Dialog imports
} from "@/components/ui/dialog";
// ... other imports (Button, Input, Label, Alert, icons, supabase) ...
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, LogIn } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
// Import AuthError if needed for more specific handling, but checking structure is often sufficient
// import { AuthError } from '@supabase/supabase-js';

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // <-- 2. Get navigate function

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log("Attempting sign in with:", { email });

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (signInError) throw signInError; // Throw error if sign-in fails

      console.log("Sign in successful:", data);

      // Reset fields (optional, good practice)
      setEmail("");
      setPassword("");

      // Close the modal
      onOpenChange(false);

      // --- 3. ADD NAVIGATION HERE ---
      console.log("Navigating to /admin/booking-manager");
      navigate("/admin/booking-manager");
      // --- End Navigation ---

      // Note: Global auth state update (e.g., context) happens automatically
      // via the onAuthStateChange listener in AuthContext.tsx
    } catch (err: unknown) {
      // --- Type Safe Error Handling ---
      let errorMessage = "Sign in failed. Please check your credentials."; // Default message
      if (typeof err === "object" && err !== null) {
        // Supabase errors often have a 'message' property
        if ("message" in err && typeof err.message === "string") {
          errorMessage = err.message;
        }
        // Older Supabase errors might have error_description
        else if (
          "error_description" in err &&
          typeof err.error_description === "string"
        ) {
          errorMessage = err.error_description;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message; // Standard JS Error
      } else if (typeof err === "string") {
        errorMessage = err; // Sometimes errors might just be strings
      }
      setError(errorMessage);
      console.error("Sign in error:", err);
      // --- End Type Safe Error Handling ---
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form state when modal is closed manually
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError(null);
      setIsLoading(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* ... DialogContent JSX remains the same ... */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Sign In</DialogTitle>
          <DialogDescription className="text-center">
            Access your account or manage your bookings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSignIn} className="grid gap-6 py-4">
          {error && (
            <Alert variant="destructive">
              {" "}
              <AlertCircle className="h-4 w-4" /> <AlertTitle>Error</AlertTitle>{" "}
              <AlertDescription>{error}</AlertDescription>{" "}
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              "Signing In..."
            ) : (
              <>
                {" "}
                <LogIn className="mr-2 h-4 w-4" /> Sign In{" "}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
