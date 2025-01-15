import { e as error } from "../../../../../chunks/index.js";
import "../../../../../chunks/formData.js";
import { s as superValidate } from "../../../../../chunks/superValidate.js";
import { z } from "zod";
import "ts-deepmerge";
import "memoize-weak";
import { a as zod } from "../../../../../chunks/zod.js";
const emailReceiptSchema = z.object({
  email: z.string().email("Invalid email address")
});
const load = async ({ locals: { supabase, session }, params }) => {
  const { event_url, reference_number } = params;
  let event;
  if (session) {
    const { data, error: eventError } = await supabase.from("events").select("*, organizations(id)").eq("event_url", event_url).single();
    if (eventError || !data) {
      throw error(404, "Event not found");
    }
    event = data;
  } else {
    const { data, error: eventError } = await supabase.from("public_events").select("*").eq("event_url", event_url).single();
    if (eventError || !data) {
      throw error(404, "Event not found");
    }
    event = data;
    if (!event.is_public) {
      throw error(403, "This event is private. Please log in to view registration details.");
    }
  }
  const { data: attendee, error: attendeeError } = await supabase.from("attendees").select(`
            id,
            basic_info,
            is_paid,
            qr_link,
            reference_code_url,
            ticket_info,
            created_at,
            updated_at
        `).eq("event_id", event.id).eq("reference_code_url", reference_number).single();
  if (attendeeError || !attendee) {
    throw error(404, "Attendee not found");
  }
  const form = await superValidate(zod(emailReceiptSchema));
  return {
    form,
    event,
    attendee,
    session
  };
};
const actions = {
  sendReceipt: async ({ request, locals: { supabase }, params }) => {
    const form = await superValidate(request, zod(emailReceiptSchema));
    if (!form.valid) {
      return { form };
    }
    try {
      return {
        form,
        success: true
      };
    } catch (err) {
      console.error("Error sending receipt:", err);
      return {
        form,
        error: "Failed to send receipt"
      };
    }
  }
};
export {
  actions,
  load
};
