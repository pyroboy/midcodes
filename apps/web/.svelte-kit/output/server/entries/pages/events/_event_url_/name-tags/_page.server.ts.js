import { e as error, f as fail } from "../../../../../chunks/index.js";
import { z } from "zod";
import "ts-deepmerge";
import "memoize-weak";
import { a as zod } from "../../../../../chunks/zod.js";
import "../../../../../chunks/formData.js";
import { s as superValidate } from "../../../../../chunks/superValidate.js";
import { g as generateReferenceCode } from "../../../../../chunks/generators.js";
const printStatusSchema = z.object({
  attendeeId: z.string().uuid(),
  isPrinted: z.boolean()
});
const load = async ({ locals: { supabase }, params }) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw error(401, "Unauthorized");
  }
  const { data: event, error: eventError } = await supabase.from("events").select("*, organizations(id)").eq("event_url", params.event_url).single();
  if (eventError || !event) {
    throw error(404, "Event not found");
  }
  const { data: attendees, error: attendeesError } = await supabase.from("attendees").select(`
            id,
            basic_info,
            event_id,
            ticket_info,
            is_printed,
            reference_code_url,
            created_at,
            updated_at
        `).eq("event_id", event.id).order("created_at", { ascending: false });
  if (attendeesError) {
    throw error(500, "Failed to fetch attendees");
  }
  for (const attendee of attendees) {
    if (!attendee.reference_code_url) {
      const referenceCode = generateReferenceCode();
      const { error: updateError } = await supabase.from("attendees").update({
        reference_code_url: `${event.event_url}/${referenceCode}`
      }).eq("id", attendee.id);
      if (!updateError) {
        attendee.reference_code_url = `${event.event_url}/${referenceCode}`;
      }
    }
  }
  const form = await superValidate(zod(printStatusSchema));
  return {
    form,
    event,
    attendees,
    session: {
      user: session.user
    }
  };
};
const actions = {
  updatePrintStatus: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) {
      return fail(401, { message: "Unauthorized" });
    }
    const form = await superValidate(request, zod(printStatusSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { error: updateError } = await supabase.from("attendees").update({
      is_printed: form.data.isPrinted,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", form.data.attendeeId);
    if (updateError) {
      return fail(500, {
        form,
        message: "Failed to update print status"
      });
    }
    return { form };
  }
};
export {
  actions,
  load
};
