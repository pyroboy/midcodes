// src/components/admin/ReferenceImageViewer.tsx (Secure - No Anon Key)

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Import toast

interface ReferenceImageViewerProps {
  reference: { public_id: string; original_filename: string };
}

export const ReferenceImageViewer: React.FC<ReferenceImageViewerProps> = ({
  reference,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Initialize toast

  const fetchSignedImageUrl = useCallback(async () => {
    if (!reference.public_id) {
      setError("Missing image identifier.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSignedUrl(null);

    try {
      // 1. Get User Session Token (JWT)
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session)
        throw new Error(
          sessionError?.message ||
            "User not authenticated. Please log in again."
        );
      const token = session.access_token;

      // 2. Get Edge Function URL
      const edgeFunctionBaseUrl = import.meta.env
        .VITE_EDGE_FUNCTION_URL_CLOUDINARY;
      if (!edgeFunctionBaseUrl) {
        console.error("Missing env var: VITE_EDGE_FUNCTION_URL_CLOUDINARY");
        throw new Error("Cloudinary function URL config missing.");
      }

      // 3. Construct Function URL
      const functionUrl = `${edgeFunctionBaseUrl}?publicId=${encodeURIComponent(
        reference.public_id
      )}`;
      console.log(`Workspaceing signed URL from: ${functionUrl}`);

      // 4. Call Edge Function (JWT Auth only)
      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(
        `Workspace response status for ${reference.public_id}: ${response.status}`
      );

      // 5. Handle Response
      if (!response.ok) {
        let backendMessage = `Failed (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          backendMessage =
            errorData.message ||
            errorData.error ||
            `${backendMessage}: ${response.statusText}`;
          console.error("Error response body:", errorData);
        } catch (parseError) {
          const textError = await response.text();
          console.warn(
            "Could not parse error response body. Raw text:",
            textError
          );
          backendMessage = `${backendMessage}: ${response.statusText}`;
        }
        throw new Error(backendMessage);
      }

      const data = await response.json();
      if (!data.signedUrl) {
        console.error("Function response missing 'signedUrl':", data);
        throw new Error("Function did not return a signed URL.");
      }
      setSignedUrl(data.signedUrl);
    } catch (err: unknown) {
      console.error("Error fetching signed URL:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Could not load image.";
      setError(errorMsg);
      // Optionally notify user
      // toast({ variant: "destructive", title: "Image Load Failed", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [reference.public_id]); // Added toast to dependency array

  useEffect(() => {
    // Fetch immediately when component mounts
    fetchSignedImageUrl();
  }, [fetchSignedImageUrl]); // Run effect when the callback changes (i.e., when public_id changes)

  // --- Rendering ---
  return (
    <div className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow w-full sm:w-48 flex-shrink-0 flex flex-col">
      <div className="min-h-[100px] flex items-center justify-center p-1 relative flex-grow bg-muted/20 dark:bg-slate-800/30">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 dark:bg-slate-900/80 text-sm text-muted-foreground p-2 z-10">
            <Loader2 className="h-5 w-5 mb-1 animate-spin" /> Loading...
          </div>
        )}
        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-sm text-destructive p-2 text-center z-10">
            <AlertCircle className="h-5 w-5 mb-1 flex-shrink-0" />
            <span className="text-xs mb-1 max-w-[150px] break-words">
              {error}
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={fetchSignedImageUrl}
              className="h-auto p-0 text-xs text-destructive hover:text-destructive/80"
            >
              Retry
            </Button>
          </div>
        )}
        {/* Success State */}
        {signedUrl && !isLoading && !error && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`View: ${
              reference.original_filename || reference.public_id
            }`}
            className="block max-h-48"
          >
            <img
              src={signedUrl}
              alt={`Reference: ${
                reference.original_filename || reference.public_id
              }`}
              className="max-w-full h-auto max-h-48 object-contain cursor-pointer hover:opacity-85 transition-opacity"
              loading="lazy"
            />
          </a>
        )}
        {/* Initial/No ID State */}
        {!isLoading && !error && !signedUrl && (
          <div className="text-xs text-muted-foreground italic p-2 text-center">
            {reference.public_id ? "Processing..." : "No ID"}
          </div>
        )}
      </div>
      <p
        className="text-xs text-muted-foreground truncate p-2 border-t dark:border-slate-700 bg-muted/30 dark:bg-slate-800/50 flex-shrink-0"
        title={reference.original_filename || reference.public_id}
      >
        {reference.original_filename || reference.public_id || "Reference"}
      </p>
    </div>
  );
};
