import { e as error, f as fail } from "../../../../../chunks/index.js";
import { z } from "zod";
import "ts-deepmerge";
import "memoize-weak";
import { z as zod } from "../../../../../chunks/zod.js";
import "../../../../../chunks/formData.js";
import { s as superValidate } from "../../../../../chunks/superValidate.js";
const qrScanSchema = z.object({
  attendeeId: z.string().uuid(),
  scannedUrl: z.string().url(),
  scanType: z.enum(["entry", "exit"]),
  scanNotes: z.string().optional()
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
  const { data: scanLogs, error: scanLogsError } = await supabase.from("attendees").select(`
            id,
            basic_info,
            qr_scan_info,
            attendance_status,
            reference_code_url
        `).eq("event_id", event.id).order("created_at", { ascending: false });
  if (scanLogsError) {
    throw error(500, "Failed to fetch scan logs");
  }
  const form = await superValidate(zod(qrScanSchema));
  return {
    form,
    event,
    scanLogs,
    session: {
      user: session.user
    }
  };
};
const actions = {
  recordScan: async ({ request, locals: { supabase } }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return fail(401, { message: "Unauthorized" });
    }
    const form = await superValidate(request, zod(qrScanSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { data: attendee, error: attendeeError } = await supabase.from("attendees").select("event_id, qr_scan_info").eq("id", form.data.attendeeId).single();
    if (attendeeError || !attendee) {
      return fail(404, {
        form,
        message: "Attendee not found"
      });
    }
    const newScanInfo = {
      scan_time: (/* @__PURE__ */ new Date()).toISOString(),
      scanned_by: session.user.id,
      scan_type: form.data.scanType,
      scan_notes: form.data.scanNotes || null,
      scan_location: null
      // Can be added later if needed
    };
    const { error: updateError } = await supabase.from("attendees").update({
      qr_scan_info: attendee.qr_scan_info ? [...attendee.qr_scan_info, newScanInfo] : [newScanInfo],
      attendance_status: form.data.scanType === "entry" ? "present" : "exited",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", form.data.attendeeId);
    if (updateError) {
      return fail(500, {
        form,
        message: "Failed to update attendee scan info"
      });
    }
    return {
      form,
      success: true,
      message: `Successfully recorded ${form.data.scanType} scan`
    };
  }
};
export {
  actions,
  load
};
