// src/pages/UpdatePasswordPage.tsx

import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient"; // Adjust path if needed
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Link,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextDefinition"; // To check if user is authenticated by the recovery link
import { toast } from "@/hooks/use-toast";

// Minimum password length requirement
const MIN_PASSWORD_LENGTH = 6;

export function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth(); // Use auth context to see if session is established

  // State to track if the recovery session is active
  const [isRecoverySessionActive, setIsRecoverySessionActive] = useState(false);

  useEffect(() => {
    // Supabase's onAuthStateChange (in AuthContext) handles the #access_token automatically.
    // We listen for the specific PASSWORD_RECOVERY event to confirm the context.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("UpdatePasswordPage Auth Event:", event, session);
        if (event === "PASSWORD_RECOVERY") {
          // This confirms the user arrived via a recovery link and Supabase is setting up the session
          setIsRecoverySessionActive(true);
          setError(null); // Clear any previous errors
          console.log("Password recovery session detected.");
          // No need to manually set session here, AuthContext does it.
        } else if (
          event === "SIGNED_IN" &&
          location.hash.includes("type=recovery")
        ) {
          // Fallback check if PASSWORD_RECOVERY event is missed but URL indicates recovery
          setIsRecoverySessionActive(true);
          console.log("Signed in via recovery link detected (fallback).");
        } else if (event === "SIGNED_OUT" || !session) {
          setIsRecoverySessionActive(false);
        }
      }
    );

    // Initial check in case the event fired before this component mounted
    if (session && location.hash.includes("type=recovery")) {
      setIsRecoverySessionActive(true);
      console.log("Initial check: Recovery session seems active.");
    } else if (!session && location.hash.includes("access_token")) {
      // Tokens might be in URL but session not yet established, wait for listener
      console.log(
        "Initial check: Recovery tokens present, waiting for auth event."
      );
    } else {
      console.log("Initial check: No active recovery session detected.");
      // Optional: Redirect if no recovery hash is present at all?
      // if (!location.hash.includes('access_token')) {
      //    setError("Invalid or expired recovery link.");
      // }
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [session, location.hash]); // Depend on session from context and location hash

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Frontend Validation
    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      return;
    }
    if (!isRecoverySessionActive && !session) {
      setError(
        "Authentication session is not active. Please use the link from your email again."
      );
      return;
    }

    setIsLoading(true);
    console.log("Attempting to update password...");

    try {
      // The user should be authenticated at this point via the recovery token
      // handled by onAuthStateChange
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Handle specific Supabase errors
        if (updateError.message.includes("same as the old password")) {
          throw new Error(
            "New password cannot be the same as the old password."
          );
        }
        if (updateError.message.includes("requires a valid session")) {
          throw new Error(
            "Your session may have expired. Please request a new password reset link."
          );
        }
        throw updateError;
      }

      console.log("Password updated successfully:", data.user?.email);
      setSuccessMessage("Your password has been updated successfully!");
      setPassword("");
      setConfirmPassword("");

      toast({
        title: "Password Updated",
        description: "You can now sign in with your new password.",
      });

      // Optional: Sign the user out automatically after password update for security
      await supabase.auth.signOut();

      // Redirect to sign-in page (or home page) after a short delay
      setTimeout(() => {
        navigate("/"); // Adjust if you have a specific sign-in route
      }, 3000);
    } catch (err: unknown) {
      console.error("Password update error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for dummy Header prop
  const handleOpenBookingModal = () => {
    console.log(
      "Booking modal trigger clicked from Update Password Page (no-op)"
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <Header onOpenBookingModal={handleOpenBookingModal} />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl font-bold">
                Set New Password
              </CardTitle>
              <CardDescription>
                Enter and confirm your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isRecoverySessionActive &&
                !session &&
                !location.hash.includes("access_token") && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Invalid Link</AlertTitle>
                    <AlertDescription>
                      This password recovery link appears to be invalid or
                      expired. Please request a new one.
                      <Link
                        to="/recovery"
                        className="block text-sm underline mt-2"
                      >
                        Request new link
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}

              {successMessage && (
                <Alert
                  variant="default"
                  className="mb-6 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-300">
                    Success!
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {successMessage} Redirecting...
                  </AlertDescription>
                </Alert>
              )}
              {error && !successMessage && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Disable form if recovery session isn't active or already succeeded */}
                <fieldset
                  disabled={
                    isLoading ||
                    !!successMessage ||
                    (!isRecoverySessionActive && !session)
                  }
                >
                  <div className="space-y-1.5 relative">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-11 text-base pr-10" // Add padding for the icon
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-2 top-[2.1rem] transform text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Minimum {MIN_PASSWORD_LENGTH} characters.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-11 text-base"
                    />
                  </div>

                  <div>
                    <Button type="submit" className="w-full h-11 text-base">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </fieldset>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default UpdatePasswordPage;
