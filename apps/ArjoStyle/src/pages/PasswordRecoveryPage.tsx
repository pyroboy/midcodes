// src/pages/PasswordRecoveryPage.tsx

import React, { useState, FormEvent } from "react";
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
import { Loader2, MailCheck, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom"; // For linking back

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- IMPORTANT: Set your password update URL here ---
  // This is where Supabase will redirect the user AFTER they click the email link.
  // It must be added to your Supabase project's Auth > URL Configuration > Redirect URLs.
  // You'll need to create a separate page/route component (e.g., UpdatePasswordPage) to handle this.
  const passwordUpdateUrl = `${window.location.origin}/update-password`;
  // Example for local dev: 'http://localhost:5173/update-password'
  // Example for prod: 'https://arjostyle.midcodes.one/update-password'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);
    console.log(`Requesting password reset for: ${email}`);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: passwordUpdateUrl,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        `If an account exists for ${email}, a password reset link has been sent. Please check your inbox (and spam folder).`
      );
      setEmail(""); // Clear email field on success
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      let errorMessage =
        "Failed to send password reset email. Please try again later.";
      if (err instanceof Error) {
        if (err.message.includes("rate limit")) {
          errorMessage =
            "Too many requests. Please wait a moment before trying again.";
        } else if (err.message.includes("valid email")) {
          errorMessage = "Please enter a valid email address.";
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for dummy Header prop
  const handleOpenBookingModal = () => {
    console.log(
      "Booking modal trigger clicked from Password Recovery Page (no-op)"
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
                Reset Your Password
              </CardTitle>
              <CardDescription>
                Enter your email address below, and we'll send you a link to
                reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <Alert
                    variant="default"
                    className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                  >
                    <MailCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">
                      Check Your Email
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {message}
                    </AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="h-11 text-base"
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={isLoading || !email}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Link...
                      </>
                    ) : (
                      "Send Password Reset Link"
                    )}
                  </Button>
                </div>
              </form>
              <div className="mt-6 text-center text-sm">
                {/* Link back to the homepage where Sign In is likely triggered */}
                <Link
                  to="/"
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Remembered your password? Go back
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PasswordRecoveryPage;
