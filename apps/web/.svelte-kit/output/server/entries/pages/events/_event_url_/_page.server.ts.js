import { e as error } from "../../../../chunks/index.js";
const load = async ({ params, locals: { supabase } }) => {
  const { data: event, error: eventError } = await supabase.from("events").select(`
            *,
            organizations(id, name)
        `).eq("event_url", params.event_url).single();
  if (eventError || !event) {
    throw error(404, "Event not found");
  }
  const eventData = event;
  const otherInfo = eventData.other_info;
  const now = /* @__PURE__ */ new Date();
  const regStartDate = otherInfo.startDate ? new Date(otherInfo.startDate) : /* @__PURE__ */ new Date(0);
  const regEndDate = otherInfo.endDate ? new Date(otherInfo.endDate) : /* @__PURE__ */ new Date(864e13);
  const eventStatus = {
    isActive: true,
    // You might want to add a status field to your event table
    isRegistrationOpen: now >= regStartDate && now <= regEndDate,
    hasCapacity: await checkEventCapacity(supabase, eventData.id, otherInfo.capacity),
    registrationStartDate: regStartDate,
    registrationEndDate: regEndDate
  };
  const [
    registrationCount,
    paymentStats,
    ticketCounts,
    recentActivity
  ] = await Promise.all([
    getRegistrationCount(supabase, eventData.id),
    getPaymentStats(supabase, eventData.id),
    getTicketTypeCounts(supabase, eventData.id),
    getRecentActivity(supabase, eventData.id)
  ]);
  const stats = {
    totalRegistrations: registrationCount,
    paidCount: paymentStats.paidCount,
    totalRevenue: paymentStats.totalRevenue,
    ticketTypeCounts: ticketCounts,
    recentActivity
  };
  return {
    event: eventData,
    eventStatus,
    stats
  };
};
async function checkEventCapacity(supabase, eventId, maxCapacity) {
  const { count } = await supabase.from("attendees").select("id", { count: "exact" }).eq("event_id", eventId);
  return (count || 0) < maxCapacity;
}
async function getRegistrationCount(supabase, eventId) {
  const { count } = await supabase.from("attendees").select("id", { count: "exact" }).eq("event_id", eventId);
  return count || 0;
}
async function getPaymentStats(supabase, eventId) {
  const { data } = await supabase.from("attendees").select(`
            is_paid,
            ticket_info
        `).eq("event_id", eventId);
  if (!data) return { paidCount: 0, totalRevenue: 0 };
  const paidCount = data.filter((item) => item.is_paid).length;
  const totalRevenue = data.reduce((sum, item) => {
    if (item.is_paid && item.ticket_info?.price) {
      return sum + item.ticket_info.price;
    }
    return sum;
  }, 0);
  return { paidCount, totalRevenue };
}
async function getTicketTypeCounts(supabase, eventId) {
  const { data } = await supabase.from("attendees").select("ticket_info").eq("event_id", eventId);
  return data?.reduce((acc, item) => {
    const type = item.ticket_info?.type;
    if (type) {
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {}) || {};
}
async function getRecentActivity(supabase, eventId) {
  const { data: registrations } = await supabase.from("attendees").select("basic_info, created_at").eq("event_id", eventId).order("created_at", { ascending: false }).limit(5);
  const { data: payments } = await supabase.from("attendees").select("basic_info, payment_date").eq("event_id", eventId).not("payment_date", "is", null).order("payment_date", { ascending: false }).limit(5);
  const activity = [
    ...registrations?.map((r) => ({
      type: "registration",
      description: `${r.basic_info.firstName} ${r.basic_info.lastName} registered`,
      timestamp: r.created_at
    })) || [],
    ...payments?.map((p) => ({
      type: "payment",
      description: `${p.basic_info.firstName} ${p.basic_info.lastName} completed payment`,
      timestamp: p.payment_date
    })) || []
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  return activity;
}
export {
  load
};
