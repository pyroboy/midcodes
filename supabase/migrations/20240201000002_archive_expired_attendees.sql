-- Create a function to archive multiple attendees at once
create or replace function archive_expired_attendees(p_attendee_ids uuid[])
returns table (
    success boolean,
    message text,
    updated_count integer
)
language plpgsql
security definer
as $$
declare
    v_updated_count integer;
begin
    -- Update attendees to archived status
    with updated_rows as (
        update attendees
        set 
            attendance_status = 'archived',
            updated_at = now()
        where 
            id = any(p_attendee_ids)
            and attendance_status != 'archived'  -- Only update non-archived entries
        returning id
    )
    select count(*) into v_updated_count
    from updated_rows;

    -- Return the result
    return query
    select 
        true as success,
        format('Successfully archived %s attendees', v_updated_count) as message,
        v_updated_count as updated_count;
end;
$$;
