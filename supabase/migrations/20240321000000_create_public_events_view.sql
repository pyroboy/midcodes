-- Create public events view
CREATE OR REPLACE VIEW public_events AS
SELECT 
    e.id,
    e.event_name,
    e.event_long_name,
    e.event_url,
    e.other_info,
    e.ticketing_data,
    e.is_public,
    e.org_id,
    o.name as organization_name,
    o.id as organizations
FROM events e
LEFT JOIN organizations o ON e.org_id = o.id
WHERE e.is_public = true;
