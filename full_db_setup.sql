-- ⚠️ DANGER ZONE: DROP EVERYTHING ⚠️
-- This section deletes all existing data and structures.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_new_incident();
drop function if exists public.has_role(user_role);

drop table if exists audit_logs cascade;
drop table if exists tasks cascade;
drop table if exists resource_allocations cascade;
drop table if exists resources cascade;
drop table if exists incident_messages cascade;
drop table if exists incident_rooms cascade;
drop table if exists incidents cascade;
drop table if exists profiles cascade;

drop type if exists incident_severity cascade;
drop type if exists incident_status cascade;
drop type if exists user_role cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUMS & ROLES
create type user_role as enum ('user', 'volunteer', 'agency');
create type incident_status as enum ('pending', 'verified', 'dispatched', 'resolved', 'closed');
create type incident_severity as enum ('low', 'medium', 'high', 'critical');

-- 2. PROFILES (Linked to Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role user_role default 'user',
  avatar_url text,
  phone_number text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Helper to check role
create or replace function public.has_role(required_role user_role)
returns boolean as $$
declare
  current_user_role user_role;
begin
  select role into current_user_role from public.profiles
  where id = auth.uid();
  return current_user_role = required_role;
end;
$$ language plpgsql security definer;

-- 3. INCIDENTS
create table incidents (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id),
  title text not null,
  description text,
  latitude float not null,
  longitude float not null,
  severity incident_severity default 'medium',
  status incident_status default 'pending',
  type text,
  image_url text,
  ai_analysis jsonb, -- Stores Gemini Output
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. INCIDENT CHAT ROOMS & MESSAGES
create table incident_rooms (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table incident_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references incident_rooms(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. RESOURCES & ALLOCATIONS (Agency)
create table resources (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null, -- 'ambulance', 'fire_truck', etc.
  total_quantity int default 0,
  available_quantity int default 0,
  agency_id uuid references profiles(id), -- Owner agency
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table resource_allocations (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id),
  resource_id uuid references resources(id),
  quantity int default 1,
  allocated_at timestamp with time zone default timezone('utc'::text, now()),
  released_at timestamp with time zone
);

-- 6. TASKS (For Volunteers)
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id),
  assignee_id uuid references profiles(id),
  title text not null,
  status text default 'pending', -- pending, accepted, completed
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. AUDIT LOGS
create table audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ===========================
-- RLS POLICIES (SECURITY)
-- ===========================

-- PROFILES
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- INCIDENTS
alter table incidents enable row level security;
-- READ: Users see own, Agencies/Volunteers see all
create policy "Users see own incidents" on incidents for select using (auth.uid() = reporter_id);
create policy "Agencies and volunteers see all incidents" on incidents for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('agency', 'volunteer'))
);
-- CREATE: Authenticated users can create
create policy "Users can create incidents" on incidents for insert with check (auth.role() = 'authenticated');
-- UPDATE: Only Agencies can update status/severity, Users can update desc if pending
create policy "Agencies can update incidents" on incidents for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'agency')
);

-- CHAT
alter table incident_messages enable row level security;
create policy "Participants can read messages" on incident_messages for select using (
  exists (select 1 from incidents i where i.id = (select incident_id from incident_rooms where id = room_id) 
  and (i.reporter_id = auth.uid() or has_role('agency') or has_role('volunteer')))
);
create policy "Participants can send messages" on incident_messages for insert with check (
  exists (select 1 from incidents i where i.id = (select incident_id from incident_rooms where id = room_id) 
  and (i.reporter_id = auth.uid() or has_role('agency') or has_role('volunteer')))
);

-- ===========================
-- TRIGGERS & AUTOMATION
-- ===========================

-- 1. Auto-create Chat Room on Incident Creation
create or replace function public.handle_new_incident() 
returns trigger as $$
begin
  insert into incident_rooms (incident_id) values (new.id);
  return new;
end;
$$ language plpgsql;

create trigger on_incident_created
  after insert on incidents
  for each row execute procedure public.handle_new_incident();

-- 2. Auto-create Profile on Signup (FIXED ROLE LOGIC)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    -- Correctly cast the string role to the enum, default to 'user'
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
  );
  return new;
end;
$$ language plpgsql;

-- Attach trigger to auth.users
-- Note: This requires appropriate permissions in Supabase SQL editor
create trigger on_auth_user_created 
  after insert on auth.users 
  for each row execute procedure public.handle_new_user();
