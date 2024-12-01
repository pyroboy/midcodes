-- Role emulation sessions with enhanced security and tracking
create table if not exists role_emulation_sessions (
  id text primary key, -- Using the secure token as ID
  user_id uuid references auth.users(id) on delete cascade,
  emulated_role text not null,
  original_role text not null,
  session_context jsonb not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Audit logs for role emulation actions
create table if not exists role_emulation_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  details jsonb not null,
  created_at timestamp with time zone default now()
);

-- Rate limiting table
create table if not exists role_emulation_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Set up RLS policies
alter table role_emulation_sessions enable row level security;
alter table role_emulation_audit_logs enable row level security;
alter table role_emulation_attempts enable row level security;

-- Super admins can manage all records
create policy "Super admins can manage role emulation sessions"
  on role_emulation_sessions
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Super admins can manage audit logs"
  on role_emulation_audit_logs
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Super admins can manage attempts"
  on role_emulation_attempts
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

-- Create indexes for performance
create index role_emulation_sessions_user_id_idx on role_emulation_sessions(user_id);
create index role_emulation_sessions_expires_at_idx on role_emulation_sessions(expires_at);
create index role_emulation_attempts_user_id_created_at_idx on role_emulation_attempts(user_id, created_at);
