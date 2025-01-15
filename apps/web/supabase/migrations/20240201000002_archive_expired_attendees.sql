-- Create a function to archive multiple attendees at once and restore ticket counts
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
    v_ticket_info record;
    v_event_id uuid;
    v_ticket_type text;
    v_ticket_index integer;
    v_ticketing_data jsonb[];
begin
    -- First, gather information about the tickets that need to be restored
    create temp table tickets_to_restore as
    select 
        a.id as attendee_id,
        a.event_id,
        a.ticket_info->>'type' as ticket_type
    from attendees a
    where 
        a.id = any(p_attendee_ids)
        and a.attendance_status != 'archived'  -- Only process non-archived entries
        and a.is_paid = false;                -- Only process unpaid entries

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

    -- Process each ticket that needs to be restored
    for v_ticket_info in select * from tickets_to_restore
    loop
        -- Get the event's current ticketing data
        select e.ticketing_data
        into v_ticketing_data
        from events e
        where e.id = v_ticket_info.event_id
        for update;  -- Lock the row for update

        -- Find the ticket index
        select array_position(v_ticketing_data, ticket) - 1, ticket::jsonb
        into v_ticket_index
        from unnest(v_ticketing_data) ticket
        where (ticket::jsonb)->>'type' = v_ticket_info.ticket_type
        limit 1;

        if v_ticket_index is not null then
            -- Update the available count for this ticket type
            update events
            set 
                ticketing_data = array_replace(
                    ticketing_data,
                    ticketing_data[v_ticket_index + 1],
                    jsonb_set(
                        ticketing_data[v_ticket_index + 1]::jsonb,
                        '{available}',
                        to_jsonb(
                            (ticketing_data[v_ticket_index + 1]::jsonb->>'available')::int + 1
                        )
                    )::jsonb
                ),
                updated_at = now()
            where id = v_ticket_info.event_id;
        end if;
    end loop;

    -- Clean up temporary table
    drop table tickets_to_restore;

    -- Return the result
    return query
    select 
        true as success,
        format('Successfully archived %s attendees and restored their tickets', v_updated_count) as message,
        v_updated_count as updated_count;

    -- Handle any exceptions
    exception when others then
        -- Clean up temporary table if it exists
        drop table if exists tickets_to_restore;
        
        -- Re-raise the exception
        raise exception 'Error in archive_expired_attendees: %', SQLERRM;
end;
$$;

-- Grant necessary permissions
grant execute on function archive_expired_attendees(uuid[]) to authenticated;

-- Create an index to help with ticket restoration queries if it doesn't exist
do $$ 
begin
    if not exists (
        select 1 
        from pg_indexes 
        where tablename = 'attendees' 
        and indexname = 'idx_attendees_event_status'
    ) then
        create index idx_attendees_event_status 
        on attendees(event_id, attendance_status, is_paid);
    end if;
end $$;