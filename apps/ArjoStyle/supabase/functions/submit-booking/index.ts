// supabase/functions/submit-booking/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
// If after configuring deno.jsonc and npm install, the npm: specifier still shows errors,
// you might need an import map or try a different import method depending on your setup.
// But let's assume npm: works after fixing configuration.
import { v2 as cloudinary } from "npm:cloudinary@2.6.0"; // Use exact version from package.json

// --- Constants ---
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_RECAPTCHA_SCORE = 0.5;
const BOOKINGS_TABLE = "bookings";
const CLOUDINARY_UPLOAD_PRESET = "tattoo_booking_references"; // Your preset name
const CLOUDINARY_FOLDER = "arjostyleReferences"; // Your target folder

// --- CORS Headers ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Replace with your frontend URL in production
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Cloudinary Upload Helper ---
async function uploadFilesToCloudinary(
  filesBase64: { name: string; dataUrl: string }[],
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  uploadPreset: string,
  folderName: string
): Promise<
  { public_id: string; secure_url: string; original_filename: string }[]
> {
  if (!filesBase64 || filesBase64.length === 0) {
    return [];
  }
  console.log(`Uploading ${filesBase64.length} file(s) to Cloudinary...`);

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const uploadPromises = filesBase64.map(async (fileInfo) => {
    if (!fileInfo.dataUrl || !fileInfo.name) {
      console.warn("Skipping invalid file data:", fileInfo);
      return null;
    }
    try {
      console.log(`Uploading ${fileInfo.name}...`);
      const uploadResult = await cloudinary.uploader.upload(fileInfo.dataUrl, {
        upload_preset: uploadPreset,
        folder: folderName,
        resource_type: "image",
        type: "private",
      });
      console.log(`Successfully uploaded ${fileInfo.name}`);
      return {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        original_filename: fileInfo.name,
      };
    } catch (uploadError: unknown) {
      // <-- Catch as unknown
      // ** FIX for 'unknown' type **
      let errorMessage = "Unknown Cloudinary upload error";
      if (uploadError instanceof Error) {
        errorMessage = uploadError.message;
      } else if (typeof uploadError === "string") {
        errorMessage = uploadError;
      }
      console.error(
        `Failed to upload ${fileInfo.name} to Cloudinary:`,
        uploadError
      );
      throw new Error(`Upload failed for ${fileInfo.name}: ${errorMessage}`);
    }
  });

  const results = await Promise.all(uploadPromises);
  return results.filter((result) => result !== null) as {
    public_id: string;
    secure_url: string;
    original_filename: string;
  }[];
}

// --- Main Function Handler ---
serve(async (req: Request) => {
  console.log(`Function invoked with method: ${req.method}`);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.warn(`Invalid method: ${req.method}`);
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // --- 1. Get Secrets & Config ---
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    const recaptchaSecret = Deno.env.get("RECAPTCHA_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const notificationEmail = Deno.env.get("NOTIFICATION_EMAIL");

    if (
      !cloudName ||
      !apiKey ||
      !apiSecret ||
      !recaptchaSecret ||
      !supabaseUrl ||
      !serviceRoleKey ||
      !resendApiKey || // Added check
      !notificationEmail // Added check
    ) {
      console.error(
        "CRITICAL: Missing required environment variables/secrets (Cloudinary, reCAPTCHA, Supabase, Resend)."
      );
      throw new Error("Server configuration error.");
    }
    console.log("Secrets loaded.");

    // --- 2. Parse Request Body ---
    console.log("Parsing request body...");
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      console.error("Failed to parse request body JSON:", e);
      throw new Error("Invalid request body. Expected JSON.");
    }
    const { formData, recaptchaToken, referenceFilesBase64 } = payload;

    if (!formData || typeof formData !== "object" || formData === null)
      throw new Error('Missing/invalid "formData".');
    if (!recaptchaToken || typeof recaptchaToken !== "string")
      throw new Error('Missing/invalid "recaptchaToken".');
    if (!Array.isArray(referenceFilesBase64)) payload.referenceFilesBase64 = []; // Default to empty array if missing/invalid
    console.log("Request body parsed.");

    // --- 3. Verify reCAPTCHA Token ---
    console.log("Verifying reCAPTCHA...");
    const recaptchaVerifyParams = new URLSearchParams({
      secret: recaptchaSecret,
      response: recaptchaToken,
      // Optionally add remoteip if available and needed
    });

    const recaptchaRes = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: recaptchaVerifyParams,
    });
    const recaptchaData = await recaptchaRes.json();
    console.log("reCAPTCHA response:", recaptchaData);

    if (!recaptchaData.success || recaptchaData.score < MIN_RECAPTCHA_SCORE) {
      console.warn("reCAPTCHA verification failed or low score.");
      throw new Error("CAPTCHA verification failed.");
    }
    console.log("reCAPTCHA verified.");

    // --- 4. Upload Files to Cloudinary ---
    const uploadedImageDetails = await uploadFilesToCloudinary(
      payload.referenceFilesBase64,
      cloudName,
      apiKey,
      apiSecret,
      CLOUDINARY_UPLOAD_PRESET, // Use constant defined above
      CLOUDINARY_FOLDER // Use constant defined above
    );
    console.log("Cloudinary uploads finished.");

    // --- 5. Prepare Supabase Payload ---
    console.log("Preparing Supabase payload...");
    const bookingPayload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dateOfBirth,
      preferred_contact: formData.preferredContactMethod,
      instagram_handle: formData.instagramHandle || null,
      facebook_profile: formData.facebookProfile || null,
      category: formData.selectedCategory,
      placement: formData.currentPlacement,
      tattoo_size: formData.size,
      is_color: formData.isColor,
      is_cover_up: formData.isCoverUp,
      complexity: formData.complexity,
      creative_freedom: formData.creativeFreedom,
      specific_reqs: formData.specificRequirements,
      must_haves: formData.mustHaveElements,
      color_prefs: formData.colorPreferences,
      placement_notes: formData.placementNotes,
      requested_date: formData.appointmentDate,
      requested_time: formData.appointmentTime,
      artist_preference: formData.artistPreference || null,
      primary_tattoo_style: formData.primaryTattooStyle || null,
      style_description: formData.styleDescription || null,
      estimated_duration: formData.estimatedDurationMinutes,
      estimated_sessions: formData.estimatedSessions,
      pricing_details: formData.pricing,
      reference_image_urls:
        uploadedImageDetails.length > 0 ? uploadedImageDetails : null,
      terms_agreed: formData.termsAgreed,
      medical_confirmed: formData.medicalConfirmed,
      age_confirmed: formData.ageConfirmed,
      status: "Pending",
    };
    console.log("Supabase payload prepared.");

    // --- 6. Insert into Supabase ---
    console.log(`Inserting into ${BOOKINGS_TABLE}...`);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from(BOOKINGS_TABLE)
      .insert([bookingPayload])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }
    console.log("Booking insert successful:", insertData.id);

    // --- 7. Send Email Notification (New Step) ---
    try {
      console.log("Attempting to send booking notification email...");
      const emailSubject = `New Tattoo Booking Received: ${insertData.id} - ${bookingPayload.name}`; // Added name to subject
      const emailHtmlBody = `
        <h1>New Booking Submitted</h1>
        <p>A new booking request has been received:</p>
        <h2>Client Details:</h2>
        <ul>
          <li><strong>Booking ID:</strong> ${insertData.id}</li>
          <li><strong>Name:</strong> ${bookingPayload.name}</li>
          <li><strong>Email:</strong> ${bookingPayload.email}</li>
          <li><strong>Phone:</strong> ${bookingPayload.phone || "N/A"}</li>
          <li><strong>Preferred Contact:</strong> ${bookingPayload.preferred_contact || "N/A"}</li>
          <li><strong>Instagram:</strong> ${bookingPayload.instagram_handle || "N/A"}</li>
        </ul>
        <h2>Tattoo Details:</h2>
        <ul>
          <li><strong>Category:</strong> ${bookingPayload.category || "N/A"}</li>
          <li><strong>Placement:</strong> ${bookingPayload.placement || "N/A"}</li>
          <li><strong>Size:</strong> ${bookingPayload.tattoo_size || "N/A"}</li>
          <li><strong>Color:</strong> ${bookingPayload.is_color ? "Yes" : "No"}</li>
          <li><strong>Cover-up:</strong> ${bookingPayload.is_cover_up ? "Yes" : "No"}</li>
          <li><strong>Complexity:</strong> ${bookingPayload.complexity || "N/A"}</li>
          <li><strong>Creative Freedom:</strong> ${bookingPayload.creative_freedom || "N/A"}</li>
          <li><strong>Primary Style:</strong> ${bookingPayload.primary_tattoo_style || "N/A"}</li>
          <li><strong>Style Description:</strong> ${bookingPayload.style_description || "N/A"}</li>
          <li><strong>Specific Requirements:</strong> ${bookingPayload.specific_reqs || "N/A"}</li>
          <li><strong>Must Haves:</strong> ${bookingPayload.must_haves || "N/A"}</li>
        </ul>
        <h2>Scheduling & Pricing:</h2>
        <ul>
          <li><strong>Requested Date:</strong> ${bookingPayload.requested_date || "N/A"}</li>
          <li><strong>Requested Time:</strong> ${bookingPayload.requested_time || "N/A"}</li>
          <li><strong>Artist Preference:</strong> ${bookingPayload.artist_preference || "N/A"}</li>
          <li><strong>Est. Duration (min):</strong> ${bookingPayload.estimated_duration || "N/A"}</li>
          <li><strong>Est. Sessions:</strong> ${bookingPayload.estimated_sessions || "N/A"}</li>
          <li><strong>Pricing Tier:</strong> ${bookingPayload.pricing_details?.tier || "N/A"}</li>
          <li><strong>Estimated Price:</strong> ${bookingPayload.pricing_details?.estimatedPrice || "N/A"}</li>
        </ul>
        <p><strong>Reference images were ${bookingPayload.reference_image_urls ? `uploaded (${bookingPayload.reference_image_urls.length})` : "not uploaded"}.</strong></p>
        <p>Please review the full details and reference images (if any) in the admin panel.</p>
      `;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Tattoo Booking <noreply@arjostyle.midcodes.one>", // CHANGE THIS: Use a verified sender domain in Resend
          to: [notificationEmail],
          subject: emailSubject,
          html: emailHtmlBody,
        }),
      });

      if (!resendResponse.ok) {
        const errorBody = await resendResponse.text();
        console.error(
          `Failed to send notification email via Resend. Status: ${resendResponse.status}. Body: ${errorBody}`
        );
        // Do not throw error here, allow booking to succeed anyway
      } else {
        const successData = await resendResponse.json();
        console.log("Booking notification email sent successfully:", successData.id);
      }
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      // Do not throw error here
    }

    // --- 8. Return Success Response ---
    return new Response(
      JSON.stringify({ success: true, bookingId: insertData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    // <-- Catch as unknown
    // ** FIX for 'unknown' type **
    let message = "An unexpected error occurred.";
    let status = 500; // Default to internal server error
    if (error instanceof Error) {
      message = error.message;
      // Set specific status codes for client-fixable errors
      if (
        message.includes("CAPTCHA") ||
        message.includes("Missing") ||
        message.includes("Invalid request")
      ) {
        status = 400; // Bad Request
      }
    } else if (typeof error === "string") {
      message = error;
    }
    console.error("Edge Function Error:", message, error); // Log original error too

    return new Response(JSON.stringify({ error: message }), {
      status: status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("Submit Booking Edge Function initialized.");
