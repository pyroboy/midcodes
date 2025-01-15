import { e as error, f as fail } from "../../../../../chunks/index.js";
import "../../../../../chunks/formData.js";
import { s as superValidate, m as message } from "../../../../../chunks/superValidate.js";
import "ts-deepmerge";
import "memoize-weak";
import { z as zod } from "../../../../../chunks/zod.js";
import { r as registrationSchema } from "../../../../../chunks/schema3.js";
import { b as PUBLIC_RECAPTCHA_SITE_KEY } from "../../../../../chunks/public.js";
import { R as RECAPTCHA_SECRET_KEY } from "../../../../../chunks/private.js";
import { a as generateQRCode, g as generateReferenceCode } from "../../../../../chunks/generators.js";
import { R as RoleConfig } from "../../../../../chunks/roleConfig.js";
const requests = /* @__PURE__ */ new Map();
async function rateLimit(key, config) {
  const now = Date.now();
  const windowStart = now - config.window;
  for (const [storedKey, data2] of requests.entries()) {
    if (data2.startTime < windowStart) {
      requests.delete(storedKey);
    }
  }
  const data = requests.get(key) || { count: 0, startTime: now };
  if (data.startTime < windowStart) {
    data.count = 0;
    data.startTime = now;
  }
  if (data.count >= config.max) {
    const resetAt = new Date(data.startTime + config.window);
    return {
      success: false,
      remaining: 0,
      resetAt
    };
  }
  data.count++;
  requests.set(key, data);
  return {
    success: true,
    remaining: config.max - data.count,
    resetAt: new Date(data.startTime + config.window)
  };
}
const RATE_LIMIT = {
  window: 60 * 1e3,
  max: 10
};
async function verifyCaptcha(token) {
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
  });
  const data = await response.json();
  if (!data.success) {
    throw error(400, "reCAPTCHA verification failed");
  }
}
const load = async ({ locals: { supabase, safeGetSession, user, profile }, params }) => {
  const rateLimitResult = await rateLimit(user?.id || "anonymous", RATE_LIMIT);
  if (!rateLimitResult.success) {
    throw error(429, "Too many requests");
  }
  await safeGetSession();
  if (user) {
    await supabase.from("profiles").select("role, org_id").eq("id", user.id).single();
  }
  const { data: event, error: eventError } = await supabase.from("events").select("*, organizations(id)").eq("event_url", params.event_url).single();
  if (eventError || !event) {
    throw error(404, "Event not found");
  }
  if (!event.is_public) {
    throw error(403, "Event not public");
  }
  const ticketingData = Array.isArray(event.ticketing_data) ? event.ticketing_data : [];
  const availableTickets = ticketingData.some((ticket) => ticket.available > 0);
  if (!availableTickets) {
    throw error(403, "No tickets available");
  }
  const form = await superValidate(zod(registrationSchema));
  const isAdmin = profile?.role && RoleConfig[profile.role].isAdmin;
  return {
    form,
    event: {
      ...event,
      ticketing_data: ticketingData
    },
    local: {
      recaptcha: !isAdmin ? PUBLIC_RECAPTCHA_SITE_KEY : null
    },
    userRole: profile?.role || null
  };
};
const actions = {
  default: async ({ request, locals: { supabase, profile }, params }) => {
    console.log("Starting registration process...");
    try {
      const formData = await request.formData();
      console.log("Form data received:", Object.fromEntries(formData));
      const form = await superValidate(formData, zod(registrationSchema));
      console.log("Form validation result:", { valid: form.valid, errors: form.errors });
      if (!form.valid) {
        console.log("Form validation failed:", form.errors);
        return fail(400, { form });
      }
      const isAdmin = profile?.role && RoleConfig[profile.role].isAdmin;
      console.log("User role check:", { isAdmin, profile });
      if (!isAdmin) {
        const captchaToken = formData.get("captchaToken");
        if (!captchaToken || typeof captchaToken !== "string") {
          return fail(400, { form, message: "Security verification missing" });
        }
        await verifyCaptcha(captchaToken);
      }
      console.log("Fetching event:", params.event_url);
      const { data: event } = await supabase.from("events").select("*").eq("event_url", params.event_url).single();
      if (!event) {
        throw error(404, "Event not found");
      }
      console.log("Event found:", { id: event.id, name: event.event_name });
      const ticketingData = Array.isArray(event.ticketing_data) ? event.ticketing_data : [];
      console.log("Ticket data:", ticketingData);
      const selectedTicket = ticketingData.find((t) => t.type === form.data.ticketType);
      console.log("Selected ticket:", selectedTicket);
      if (!selectedTicket) {
        return fail(400, { form, message: "Ticket not available" });
      }
      console.log("Generating codes...");
      const qrLink = await generateQRCode();
      const referenceCode = await generateReferenceCode();
      console.log("Generated codes:", { qrLink, referenceCode });
      const org_id = event.org_id;
      if (!org_id) {
        throw error(500, "Organization ID not found");
      }
      const registrationData = {
        p_event_id: event.id,
        p_ticket_type: form.data.ticketType,
        p_basic_info: {
          firstName: form.data.firstName,
          lastName: form.data.lastName,
          email: form.data.email,
          phone: form.data.phone
        },
        p_ticket_info: {
          type: form.data.ticketType,
          price: selectedTicket.price,
          includes: selectedTicket.includes
        },
        p_org_id: org_id,
        p_qr_link: qrLink,
        p_reference_code: referenceCode
      };
      console.log("Calling register_attendee with data:", registrationData);
      const { data: result, error: registrationError } = await supabase.rpc(
        "register_attendee",
        registrationData
      );
      if (registrationError) {
        console.error("Registration error:", registrationError);
        throw error(500, registrationError.message || "Registration failed");
      }
      console.log("Registration successful:", result);
      return message(form, {
        type: "success",
        status: 200,
        text: `Registration successful! Please complete payment within ${result.payment_timeout_minutes} minutes.`,
        data: {
          name: `${form.data.firstName} ${form.data.lastName}`,
          email: form.data.email,
          phone: form.data.phone,
          ticketType: `${form.data.ticketType} - ₱${selectedTicket.price}`,
          referenceCode,
          paymentTimeoutMinutes: result.payment_timeout_minutes,
          event: {
            name: event.event_name,
            longName: event.event_long_name,
            otherInfo: event.other_info
          }
        }
      });
    } catch (err) {
      console.error("Registration process error:", err);
      const errorForm = await superValidate(zod(registrationSchema));
      let errorMessage = "Registration failed";
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack
        });
        errorMessage = err.message;
      }
      return fail(500, {
        form: errorForm,
        message: errorMessage
      });
    }
  }
};
export {
  actions,
  load
};
