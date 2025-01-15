-- Create a view for payment summary by receiver
create or replace view payment_summary_by_receiver as
select 
    p.email as receiver_email,
    count(distinct a.id) as total_attendees,
    sum(
        case 
            when (a.ticket_info->>'price')::numeric is null then 0 
            else (a.ticket_info->>'price')::numeric 
        end
    ) as total_amount
from attendees a
inner join profiles p on p.id = a.received_by
where a.is_paid = true
    and a.attendance_status != 'archived'
group by p.email
order by total_amount desc;
