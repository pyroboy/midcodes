-- Create role_emulation_sessions table
create table if not exists role_emulation_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  emulated_role text not null,
  token text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  
  -- Indexes for faster lookups
  constraint role_emulation_sessions_token_key unique (token)
);

-- Set up RLS policies
alter table role_emulation_sessions enable row level security;

-- Only super admins can create/delete sessions
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

-- Users can read their own sessions
create policy "Users can read their own sessions"
  on role_emulation_sessions
  for select
  using (user_id = auth.uid());
