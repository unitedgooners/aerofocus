-- ─── 001_schema.sql ──────────────────────────────────────────────────────────
-- Run this once against your Supabase project via the SQL editor
-- or: supabase db push

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── active_flights ──────────────────────────────────────────────────────────
-- Shared cache. Polled every 5 min by backend job. All users read from here.

create table if not exists active_flights (
  id                text primary key,        -- flight number e.g. "UA924"
  icao24            text unique not null,     -- ADS-B hex code
  airline           text,
  origin            text,                    -- IATA e.g. "EWR"
  origin_city       text,
  destination       text,
  destination_city  text,
  departure_time    timestamptz,
  estimated_arrival timestamptz,
  remaining_minutes int,
  lat               float not null,
  lng               float not null,
  altitude          int default 0,
  status            text default 'airborne', -- airborne | landed
  last_updated      timestamptz default now()
);

create index if not exists idx_active_flights_status
  on active_flights(status);
create index if not exists idx_active_flights_origin
  on active_flights(origin);
create index if not exists idx_active_flights_remaining
  on active_flights(remaining_minutes);

-- ─── flight_history ───────────────────────────────────────────────────────────
-- Landed flights archived here so session records still have a flight reference.

create table if not exists flight_history (
  like active_flights including all,
  landed_at timestamptz default now()
);

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data.

create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique not null,
  avatar_url          text,
  tier                text default 'free',   -- free | premium
  home_airport        text,
  streak_days         int default 0,
  total_focus_minutes int default 0,
  total_flights       int default 0,
  total_distance_km   int default 0,
  last_session_date   date,
  created_at          timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read any profile"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ─── sessions ────────────────────────────────────────────────────────────────

create table if not exists sessions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles(id) on delete cascade,
  flight_id             text not null,        -- references active_flights.id or flight_history.id
  mode                  text not null,        -- traditional | pomodoro | flowtime
  seat_class            text default 'economy',
  subject               text,
  started_at            timestamptz default now(),
  ended_at              timestamptz,
  focused_minutes       int default 0,
  distance_covered_km   int default 0,
  pomodoros_completed   int default 0,
  status                text default 'active' -- active | landed | aborted
);

alter table sessions enable row level security;

create policy "Users can read own sessions"
  on sessions for select using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on sessions for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update using (auth.uid() = user_id);

-- Allow the crew feed to see active sessions (status = 'active') for followed users
create policy "Users can see active sessions of followed users"
  on sessions for select using (
    status = 'active' and
    user_id in (
      select following_id from follows where follower_id = auth.uid()
    )
  );

create index if not exists idx_sessions_user_id
  on sessions(user_id);
create index if not exists idx_sessions_status
  on sessions(status);

-- ─── follows ─────────────────────────────────────────────────────────────────

create table if not exists follows (
  follower_id   uuid references profiles(id) on delete cascade,
  following_id  uuid references profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id)
);

-- ─── cheers ───────────────────────────────────────────────────────────────────

create table if not exists cheers (
  id            uuid primary key default uuid_generate_v4(),
  from_user_id  uuid references profiles(id) on delete cascade,
  session_id    uuid references sessions(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (from_user_id, session_id)              -- one cheer per session per user
);

-- ─── Enable Realtime on tables the app subscribes to ─────────────────────────

alter publication supabase_realtime add table active_flights;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table cheers;