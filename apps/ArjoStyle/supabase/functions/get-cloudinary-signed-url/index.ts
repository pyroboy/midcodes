// supabase/functions/get-cloudinary-signed-url/index.ts (Corrected Env Vars)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts"; // Adjust path if needed
import { v2 as cloudinary } from "npm:cloudinary@2.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

console.log("Function 'get-cloudinary-signed-url' initializing...");

// --- getSupabaseUser function (Using Standard Supabase Env Vars) ---
async function getSupabaseUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or malformed Authorization header." };
  }
  const token = authHeader.split(" ")[1];

  // --- Use standard env var names typically injected by Supabase CLI ---
  // These are set when using 'supabase functions serve' or deploying
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Use the standard anon key

  if (!supabaseUrl || !supabaseAnonKey) {
    // This error would typically happen if the function isn't run via Supabase CLI
    console.error(
      "CRITICAL: Supabase URL/Anon Key missing in Edge Function environment. Ensure function is run via Supabase CLI (serve/deploy)."
    );
    return { user: null, error: "Server configuration error (URL/Key)." };
  }

  console.log("getSupabaseUser connecting to Supabase URL:", supabaseUrl); // Log the URL being used

  // Initialize client WITH the standard anon key - needed for client creation
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Verify the provided token against the correct Supabase instance
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    console.error("Supabase auth.getUser error:", error.message);
    // Add more context if possible
    if (error.message.toLowerCase().includes("invalid jwt")) {
      console.error(
        "Detail: The provided JWT is malformed or signed with an incorrect secret."
      );
    } else if (error.message.toLowerCase().includes("expired")) {
      console.error("Detail: The provided JWT has expired.");
    }
    return { user: null, error: "Invalid or expired token." };
  }
  if (!user) {
    // Should be covered by error check, but good safety measure
    console.warn("No user found for the provided token.");
    return { user: null, error: "No user found for token." };
  }
  // If successful, return the user object
  return { user, error: null };
}

// --- Cloudinary config ---
console.log("Initializing Cloudinary configuration...");
try {
  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) missing!"
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true, // Ensure HTTPS URLs
  });
  console.log("Cloudinary configured successfully.");
} catch (configError) {
  console.error(
    "FATAL: Cloudinary config failed in Edge Function!",
    configError
  );
  // Depending on requirements, you might want the function to fail hard here
  // For now, it will proceed but likely fail later when trying to use Cloudinary utils
}

// --- Main Handler ---
serve(async (req: Request) => {
  const requestStartTime = Date.now();
  const requestOrigin = req.headers.get("origin");
  const currentCorsHeaders = getCorsHeaders(requestOrigin);

  console.log(
    `\n--- New Request [${requestStartTime}]: ${req.method} ${req.url} Origin: ${requestOrigin} ---`
  );

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    console.log(`[${requestStartTime}] Handling OPTIONS request.`);
    return new Response("ok", { headers: currentCorsHeaders });
  }
  // Check if origin is allowed by CORS policy
  if (!currentCorsHeaders["Access-Control-Allow-Origin"]) {
    console.warn(
      `[${requestStartTime}] Origin not allowed by CORS: ${requestOrigin}`
    );
    return new Response(
      JSON.stringify({ error: "Origin not allowed by CORS policy" }),
      {
        status: 403,
        headers: { ...currentCorsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Declare publicId outside the try block for error reporting
  let publicId: string | null = null;

  try {
    // 1. Authenticate User via JWT FIRST
    // This is the primary security check ensuring only logged-in users can proceed
    const { user, error: authError } = await getSupabaseUser(req);
    if (authError || !user) {
      console.warn(`[${requestStartTime}] Authentication failed: ${authError}`);
      return new Response(
        JSON.stringify({ message: authError || "Authentication required." }),
        {
          status: 401,
          headers: {
            ...currentCorsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Logged for audit/debug purposes
    console.log(`[${requestStartTime}] Authenticated user: ${user.id}`);

    // 2. Get publicId from Query Parameter
    const url = new URL(req.url);
    publicId = url.searchParams.get("publicId");
    if (!publicId || typeof publicId !== "string") {
      console.warn(
        `[${requestStartTime}] Bad request: Missing or invalid publicId`
      );
      return new Response(
        JSON.stringify({
          message: "Missing or invalid publicId query parameter.",
        }),
        {
          status: 400,
          headers: {
            ...currentCorsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log(
      `[${requestStartTime}] Attempting to generate signed URL for publicId: ${publicId}`
    );

    // 3. Generate Signed URL using Cloudinary Utils
    // Ensure Cloudinary config succeeded earlier
    if (!cloudinary.config()?.cloud_name) {
      // Basic check if config ran
      throw new Error("Cloudinary configuration is missing or invalid.");
    }
    const options = {
      resource_type: "image", // Assuming images
      type: "private", // Access control type on Cloudinary
      expires_in: 3600, // URL valid for 1 hour (in seconds)
      // You might add other transformations or options here if needed
    };

    // Generate the secure, time-limited URL
    const signedUrl = cloudinary.utils.private_download_url(
      publicId,
      "",
      options
    );

    if (!signedUrl) {
      // Check if URL generation actually returned something
      console.error(
        `[${requestStartTime}] Cloudinary failed to generate signed URL for publicId: ${publicId}`
      );
      throw new Error("Failed to generate signed URL.");
    }
    console.log(
      `[${requestStartTime}] Successfully generated signed URL for ${publicId}`
    );

    // 4. Return Signed URL Success Response
    const durationMs = Date.now() - requestStartTime;
    console.log(
      `[${requestStartTime}] Request successful. Duration: ${durationMs}ms`
    );
    return new Response(JSON.stringify({ signedUrl: signedUrl }), {
      headers: { ...currentCorsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    // --- Catch-all Error Handling ---
    const durationMs = Date.now() - requestStartTime;
    let errorMessage = "Internal Server Error";
    let errorStatus = 500;

    // Try to extract a more specific message/status
    if (typeof err === "object" && err !== null && "http_code" in err) {
      // Cloudinary errors often have http_code
      const cloudinaryError = err as { http_code?: number; message?: string };
      errorMessage = cloudinaryError.message || errorMessage;
      errorStatus =
        typeof cloudinaryError.http_code === "number"
          ? cloudinaryError.http_code
          : 500;
      if (errorStatus === 404) {
        errorMessage = `Image resource with publicId '${
          publicId || "unknown"
        }' not found on Cloudinary.`;
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
      // Set specific status codes for certain client-fixable errors if needed
      if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("Missing")
      ) {
        errorStatus = 400; // Bad Request
      }
    }

    console.error(
      `[${requestStartTime}] Edge Function Error after ${durationMs}ms: ${errorMessage}`,
      err
    ); // Log full error

    // Return error response
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorStatus,
      headers: { ...currentCorsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("Function 'get-cloudinary-signed-url' handler registered.");
