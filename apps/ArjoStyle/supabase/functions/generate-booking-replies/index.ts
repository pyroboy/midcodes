// supabase/functions/generate-booking-replies/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts"; // VERIFY PATH
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.49.4";

console.log("Function 'generate-booking-replies' initializing...");

// --- Environment Variables ---
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const PROMPT_ID = "booking_reply_prompt"; // ID for the prompt in the DB

// --- Default Fallback Prompt (in case DB fetch fails) ---
// Make sure this default matches the structure expected by the function/frontend
const DEFAULT_PROMPT_TEMPLATE = `
You are a friendly and helpful booking assistant for 'ArjoStyle Tattoo' in Tagbilaran City, Bohol, Philippines. Generate 5 reply suggestions for the admin based on the client's booking request and any admin notes.

**Individual Reply Structure:**
----- TITLE -----
<br>
<Greetings>
<br>
<br>
<Message about their tattoo idea>
<br>
<br>
<Booking info with price and deposit details>
<br>
<br>
<Payment Details>

**Client Information:**
- Client Name: \${clientName}
- Tattoo Type: \${category}
- Placement: \${placementInfo}
- Size: \${sizeInfo}
- Color: \${isColor}
- Cover-up/Enhancement: \${isCoverUp}
- Complexity: \${complexity}
- Their Idea/Requirements: \${specificReqs}
- Must-Have Elements: \${mustHaves}
- Color Preferences: \${colorPrefs}
- Reference Images Provided: \${hasReferences}
- Artist Freedom Level: \${creativeFreedom}
- Requested Date/Time: \${requestedDateTime}
- Preferred Artist: \${artistPreference}
- Total Price Estimate: \${estimatedPrice}
- Time Estimate: \${estimatedDuration}
- Number of Sessions: \${estimatedSessions}
- Admin's Notes: \${adminReviewNotes}
- Tattoo Style: \${primaryTattooStyle}
- Style Description: \${styleDescription}

**Instructions:**
1.  Acknowledge the client (\${clientName}) and their idea (use specifics like \${category}, \${placementInfo}, \${mustHaves}). Consider \${adminReviewNotes}.
2.  If \${estimatedPrice} is available, state it, the duration/sessions, calculate the 50% deposit (\${estimatedPrice / 2}), and request it clearly using placeholder: [Payment Details/Link - e.g., GCash/Bank Transfer instructions].
3.  If \${estimatedPrice} is 'Pending', reassure them a quote and deposit details are coming soon.
4.  If it's a cover-up (\${isCoverUp} is 'Yes' or mentioned in \${adminReviewNotes}), ask for photos of the existing tattoo before finalizing details.
5.  Generate 5 distinct replies following the **Individual Reply Structure** above, including the title line and <br> tags.
6.  Separate each full reply suggestion from the next using a line containing **only**: ----- REPLY SEPARATOR -----
7.  Output **ONLY** the 5 replies and the separators as plain text. No JSON, no markdown.
`.trim();

// --- Auth Helper ---
async function authenticateAndGetClient(
  req: Request
): Promise<{ client: SupabaseClient | null; error: string | null }> {
  // ... (Keep existing unchanged Auth Helper code) ...
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      client: null,
      error: "Missing or malformed Authorization header.",
    };
  }
  const token = authHeader.split(" ")[1];
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase URL/Anon Key missing.");
    return {
      client: null,
      error: "Authentication service configuration error.",
    };
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();
    if (getUserError) {
      console.error("Supabase auth.getUser error:", getUserError.message);
      return { client: null, error: "Invalid or expired token." };
    }
    if (!user) {
      return { client: null, error: "User not found for the provided token." };
    }
    console.log(`Authenticated user: ${user.id}`);
    return { client: supabase, error: null };
  } catch (catchError) {
    console.error("Error during Supabase client/auth interaction:", catchError);
    return { client: null, error: "Failed to validate authentication." };
  }
}

function formatForPrompt(value: unknown, noneString = "Not specified"): string {
  if (value === null || value === undefined) {
    return noneString;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return String(value);
  }

  const stringValue = String(value);
  if (stringValue.trim() === "") {
    return noneString;
  }
  return stringValue.trim();
}

function formatDurationForPrompt(
  totalMinutes: number | undefined | null
): string {
  // ... (Keep existing unchanged Formatting Helper code) ...
  if (
    totalMinutes === undefined ||
    totalMinutes === null ||
    totalMinutes < 1 ||
    isNaN(totalMinutes)
  )
    return "Not specified";
  const MINIMUM_DURATION_MINUTES = 30;
  const roundedMinutes = Math.max(
    MINIMUM_DURATION_MINUTES,
    Math.round(totalMinutes / 30) * 30
  );
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  let result = "";
  if (hours > 0) result += `${hours} hr${hours > 1 ? "s" : ""}`;
  if (minutes > 0) {
    if (result.length > 0) result += " ";
    result += `${minutes} min${minutes > 1 ? "s" : ""}`;
  }
  return result.length > 0
    ? `approx. ${result}`
    : `approx. ${MINIMUM_DURATION_MINUTES} mins`;
}

// --- Simple Template Renderer ---
function renderTemplate(
  template: string,
  data: Record<string, string>
): string {
  let rendered = template;
  for (const key in data) {
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    rendered = rendered.replace(regex, data[key]);
  }
  return rendered;
}

// --- Main Server Logic ---
serve(async (req: Request) => {
  const requestStartTime = Date.now();
  console.log(
    `\n--- New Request [${requestStartTime}]: ${req.method} ${req.url} ---`
  );

  // 1. CORS / OPTIONS
  const requestOrigin = req.headers.get("origin");
  const responseHeaders = getCorsHeaders(requestOrigin);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: responseHeaders, status: 204 });
  }
  if (!responseHeaders["Access-Control-Allow-Origin"]) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...responseHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Authentication
  const { client: supabase, error: authError } = await authenticateAndGetClient(
    req
  );
  if (authError || !supabase) {
    return new Response(
      JSON.stringify({ error: authError || "Authentication required." }),
      {
        status: 401,
        headers: { ...responseHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 3. API Key Check
  if (!GOOGLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service is not configured." }),
      {
        status: 500,
        headers: { ...responseHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // --- Main Logic ---
  try {
    // 4. Parse Body
    let body;
    try {
      body = await req.json();
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body received." }),
        {
          status: 400,
          headers: { ...responseHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log(`[${requestStartTime}] Body parsed.`);

    // 5. Destructure Input (including adminReviewNotes)
    const {
      bookingId,
      name,
      category,
      placement,
      tattoo_size,
      is_color,
      is_cover_up,
      complexity,
      specific_reqs,
      must_haves,
      placement_notes,
      adminReviewNotes,
      color_prefs,
      creative_freedom,
      has_references,
      requested_date,
      requested_time,
      artist_preference,
      pricing_details,
      estimated_duration,
      estimated_sessions,
      primaryTattooStyle,
      styleDescription,
    } = body;
    if (!bookingId || typeof bookingId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid bookingId." }),
        {
          status: 400,
          headers: { ...responseHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log(
      `[${requestStartTime}] Processing for Booking ID: ${bookingId}`
    );

    // 6. Fetch Custom Prompt from DB
    let promptTemplate = DEFAULT_PROMPT_TEMPLATE;
    try {
      /* ... (DB fetch logic remains the same) ... */
      const { data: promptData, error: promptError } = await supabase
        .from("ai_prompts")
        .select("prompt_text")
        .eq("prompt_id", PROMPT_ID)
        .single();
      if (promptError) {
        console.error(
          `[${requestStartTime}] DB_FETCH_ERROR: ${promptError.message}. Using default.`
        );
      } else if (promptData?.prompt_text) {
        promptTemplate = promptData.prompt_text;
        console.log(`[${requestStartTime}] Using custom prompt from DB.`);
      } else {
        console.warn(
          `[${requestStartTime}] Prompt ID ${PROMPT_ID} not found. Using default.`
        );
      }
    } catch (fetchCatchError) {
      console.error(
        `[${requestStartTime}] DB_FETCH_CATCH_ERROR:`,
        fetchCatchError,
        ". Using default."
      );
    }
    const estimatedTotal = pricing_details?.total;
    const templateData = {
      /* ... (templateData preparation remains the same, including adminReviewNotes) ... */
      clientName: formatForPrompt(name, "Client"),
      category: formatForPrompt(category),
      placement: formatForPrompt(placement),
      placementNotes: formatForPrompt(placement_notes),
      adminReviewNotes: formatForPrompt(adminReviewNotes, "None provided."),
      sizeInfo: tattoo_size
        ? `${formatForPrompt(tattoo_size)} sq. inches`
        : "Not specified",
      isColor: formatForPrompt(is_color),
      isCoverUp: formatForPrompt(is_cover_up),
      complexity: formatForPrompt(complexity),
      specificReqs: formatForPrompt(specific_reqs, "None provided."),
      mustHaves: formatForPrompt(must_haves, "None provided."),
      colorPrefs: formatForPrompt(color_prefs, "None provided."),
      hasReferences: formatForPrompt(has_references),
      creativeFreedom: formatForPrompt(creative_freedom),
      primaryTattooStyle: formatForPrompt(primaryTattooStyle, "Not specified"),
      styleDescription: formatForPrompt(styleDescription, "Not specified"),
      requestedDateTime: requested_date
        ? `${formatForPrompt(requested_date)} ${formatForPrompt(
            requested_time
          )}`
        : "Not specified",
      artistPreference: formatForPrompt(artist_preference),
      estimatedPrice: estimatedTotal
        ? `₱${formatForPrompt(estimatedTotal)}`
        : "Pending",
      estimatedDuration: formatDurationForPrompt(estimated_duration),
      estimatedSessions: formatForPrompt(estimated_sessions, "1 (default)"),
      placementInfo: `${formatForPrompt(placement)} ${
        placement_notes ? `(${formatForPrompt(placement_notes)})` : ""
      }`.trim(),
    };

    // 8. Render the Prompt
    const finalPrompt = renderTemplate(promptTemplate, templateData);

    // 9. Call Google AI API
    const aiRequestPayload = { contents: [{ parts: [{ text: finalPrompt }] }] };
    console.log(
      `[${requestStartTime}] Sending request to Google AI API for booking ${bookingId}...`
    );
    const aiResponse = await fetch(
      `${GEMINI_API_ENDPOINT}?key=${GOOGLE_API_KEY}`,
      {
        // Add key to URL query param
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiRequestPayload),
      }
    );
    console.log(
      `[${requestStartTime}] Google AI Response Status: ${aiResponse.status} ${aiResponse.statusText} for booking ${bookingId}`
    );
    if (!aiResponse.ok) {
      const errorBodyText = await aiResponse.text();
      console.error(`[${requestStartTime}] AI_ERROR_BODY:`, errorBodyText);
      throw new Error(`AI service request failed: ${aiResponse.statusText}`);
    }

    // *** 10. Process AI Response (UPDATED: Parse Plain Text) ***
    const aiData = await aiResponse.json();
    let recommendations: string[] = [];
    try {
      const textContent = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof textContent !== "string") {
        throw new Error("AI response structure missing expected text content.");
      }

      // Define the delimiter EXACTLY as specified in the prompt
      const delimiter = "----- REPLY SEPARATOR -----";
      const rawReplies = textContent.split(delimiter);

      // Clean up each part: trim whitespace and filter out empty strings
      recommendations = rawReplies
        .map((reply) => reply.trim()) // Remove leading/trailing whitespace/newlines
        .filter((reply) => reply.length > 0); // Remove empty strings resulting from split

      console.log(
        `[${requestStartTime}] Successfully split AI response into ${recommendations.length} replies using delimiter.`
      );

      // Optional: Add a warning if the number of replies is not 5
      if (recommendations.length !== 5) {
        console.warn(
          `[${requestStartTime}] AI generated ${recommendations.length} replies, but 5 were expected.`
        );
      }
    } catch (processingError) {
      console.error(
        `[${requestStartTime}] [ERROR] Error processing AI plain text response for booking ${bookingId}:`,
        processingError
      );
      // Log the raw content that caused the error
      const rawContent =
        aiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unavailable";
      console.error(
        `[${requestStartTime}] Raw text content was: ${rawContent.substring(
          0,
          500
        )}...`
      ); // Log snippet
      // Keep throwing error, but maybe make it more specific
      throw new Error(
        `Failed to process AI response text: ${String(processingError)}`
      );
    }

    // 11. Save Recommendations to DB (Optional)
    if (recommendations.length > 0) {
      console.log(
        `[${requestStartTime}] Saving ${recommendations.length} recommendations to DB for booking ${bookingId}...`
      );
      try {
        const { error: dbError } = await supabase
          .from("bookings")
          .update({ saved_reply_recommendations: recommendations })
          .eq("id", bookingId);
        if (dbError) {
          console.error(
            `[${requestStartTime}] DB_SAVE_ERROR: ${dbError.message}`
          );
        } else {
          console.log(`[${requestStartTime}] Saved recommendations to DB.`);
        }
      } catch (dbCatchError) {
        console.error(
          `[${requestStartTime}] DB_SAVE_CATCH_ERROR:`,
          dbCatchError
        );
      }
    } else {
      console.log(
        `[${requestStartTime}] No recommendations generated or parsed, skipping DB save.`
      );
    }

    // 12. Return Success (still return JSON array to frontend)
    const durationMs = Date.now() - requestStartTime;
    console.log(
      `[${requestStartTime}] Returning successful response for booking ${bookingId}. Duration: ${durationMs}ms`
    );
    return new Response(JSON.stringify(recommendations), {
      headers: { ...responseHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // 13. Catch All
    const durationMs = Date.now() - requestStartTime;
    console.error(
      `[${requestStartTime}] [FATAL] Edge function failed after ${durationMs}ms:`,
      error
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown internal error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...responseHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

console.log("Function 'generate-booking-replies' initialized successfully.");
