// supabase/functions/_shared/cors.ts

console.log("Loading CORS configuration...");

// Define allowed origins explicitly
const allowedOrigins = [
  "http://localhost:8080", // Local dev
  "https://arjostyle.midcodes.one", // Specific production domain
  "https://arjostyle.vercel.app", // Specific Vercel production deployment
  // Add other specific Vercel preview/production URLs as needed
];
console.log("Allowed Origins:", JSON.stringify(allowedOrigins));

// Function to determine the allowed origin value
const getAllowOrigin = (requestOrigin: string | null): string | null => {
  if (!requestOrigin) {
    console.warn("CORS Check: Request received without 'Origin' header.");
    return null; // Disallow requests missing the Origin header
  }
  if (allowedOrigins.includes(requestOrigin)) {
    console.log(`CORS Check: Origin "${requestOrigin}" is allowed.`);
    return requestOrigin; // Return the specific matching origin
  }
  // If no exact match found, disallow the origin
  console.warn(
    `CORS Check: Origin "${requestOrigin}" is NOT in the allowed list.`
  );
  return null;
};

// Define a type for the headers object to ensure compliance with HeadersInit
type ResponseHeaders = Record<string, string>;

// Export a function that returns the headers object
export const getCorsHeaders = (
  requestOrigin: string | null
): ResponseHeaders => {
  const allowOrigin = getAllowOrigin(requestOrigin);

  // --- Base headers included in ALL responses ---
  const baseHeaders: ResponseHeaders = {
    // It's good practice to always specify the content type
    "Content-Type": "application/json",
  };

  if (!allowOrigin) {
    // If origin is not allowed, return only the base headers.
    // The lack of 'Access-Control-Allow-Origin' blocks the request in the browser.
    console.log(
      "Origin not allowed, returning minimal headers (Content-Type only)."
    );
    return baseHeaders;
  }

  // If origin IS allowed, return base headers merged with CORS headers
  console.log("Origin allowed, returning full CORS headers.");
  return {
    ...baseHeaders, // Include Content-Type
    "Access-Control-Allow-Origin": allowOrigin, // Specific allowed origin
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type", // Headers allowed from client
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS", // Methods allowed
  };
};
