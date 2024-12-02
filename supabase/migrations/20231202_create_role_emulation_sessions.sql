-- Create role_emulation_sessions table
create table if not exists role_emulation_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    original_role text not null,
    emulated_role text not null,
    status text not null check (status in ('active', 'ended')),
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now() not null
);

-- Create index for faster lookups of active sessions
create index if not exists idx_role_emulation_sessions_user_status 
on role_emulation_sessions (user_id, status);

-- Add RLS policies
alter table role_emulation_sessions enable row level security;

-- Allow super_admins to view all sessions
create policy "Super admins can view all sessions"
on role_emulation_sessions for select
to authenticated
using (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
    )
);

-- Allow users to view their own sessions
create policy "Users can view their own sessions"
on role_emulation_sessions for select
to authenticated
using (user_id = auth.uid());

-- Only super_admins can insert/update sessions
create policy "Only super admins can manage sessions"
on role_emulation_sessions for all
to authenticated
using (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
    )
);
