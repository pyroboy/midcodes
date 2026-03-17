// src/App.tsx (Updated)

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import React, { useEffect } from "react";

// --- Auth Imports ---
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// --- Page Imports ---
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import AdminModelMappingPage from "@/pages/AdminModelMappingPage";
import MappingDebugPage from "@/pages/MappingDebugPage";
import { BookingManagerPage } from "@/pages/BookingManagerPage";
import { TermsAndConditionsPage } from "@/pages/TermsAndConditionsPage";
import { ContactPage } from "@/pages/ContactPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { CookiePolicyPage } from "@/pages/CookiePolicyPage";
import { AftercarePage } from "@/pages/AfterCarePage";
import { PasswordRecoveryPage } from "@/pages/PasswordRecoveryPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import { AdminLayout } from "./components/layout/AdminLayout";

// --- Data & Utils Imports ---
import "./data/defaultModels";
import "./data/defaultMappings";
import { initializeMappingDiagnostics } from "./utils/mappingDebugger";

// --- ADD RECAPTCHA IMPORT ---
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

// --- ADD SCROLLTOTOP IMPORT ---
import { ScrollToTop } from "@/components/layout/ScrollToTop"; // Adjust path if necessary

const queryClient = new QueryClient();

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (!recaptchaSiteKey) {
  console.warn(
    "WARNING: VITE_RECAPTCHA_SITE_KEY is not set in the root .env file. reCAPTCHA will not function."
  );
}

export const App = () => {
  useEffect(() => {
    console.log(" App initialized - running mapping diagnostics");
    initializeMappingDiagnostics();
  }, []);

  if (!recaptchaSiteKey) {
    console.error(
      "FATAL: Cannot initialize GoogleReCaptchaProvider without a site key."
    );
    // Optionally return an error component or allow rendering without reCAPTCHA
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GoogleReCaptchaProvider
          reCaptchaKey={recaptchaSiteKey || "MISSING_KEY"} // Provide a fallback or handle error
        >
          <ThemeProvider defaultTheme="dark">
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                {/* === Add ScrollToTop here === */}
                <ScrollToTop />
                {/* ============================ */}
                <Routes>
                  {/* --- Public Routes --- */}
                  <Route path="/" element={<Index />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/terms" element={<TermsAndConditionsPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/cookies" element={<CookiePolicyPage />} />
                  <Route path="/aftercare" element={<AftercarePage />} />
                  <Route
                    path="/debug/mappings"
                    element={<MappingDebugPage />}
                  />
                  <Route path="/recovery" element={<PasswordRecoveryPage />} />
                  <Route
                    path="/update-password"
                    element={<UpdatePasswordPage />}
                  />

                  {/* --- Protected Admin Routes --- */}
                  {/* Using AdminLayout which contains an <Outlet> */}
                  <Route element={<ProtectedRoute element={<AdminLayout />} />}>
                    <Route
                      path="/admin/booking-manager"
                      element={<BookingManagerPage />}
                    />
                    <Route
                      path="/admin/model-mapping"
                      element={<AdminModelMappingPage />}
                    />
                    {/* Add other admin child routes here if they should use AdminLayout */}
                    {/* Example: <Route path="/admin/settings" element={<AdminSettingsPage />} /> */}
                  </Route>
                  {/* Add other top-level routes if needed */}

                  {/* --- Catch-all Not Found Route --- */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </GoogleReCaptchaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;