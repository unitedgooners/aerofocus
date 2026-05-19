-- ─── 002_triggers.sql ────────────────────────────────────────────────────────

-- ── Archive flight to history when it lands ───────────────────────────────────

create or replace function archive_landed_flight()
returns trigger as $$
begin
  if NEW.status = 'landed' and OLD.status = 'airborne' then
    insert into flight_history select NEW.*, now()
    on conflict (id) do nothing;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_archive_landed_flight
  after update on active_flights
  for each row execute function archive_landed_flight();

-- ── Update user stats when a session ends ─────────────────────────────────────

create or replace function update_user_stats_on_session_end()
returns trigger as $$
declare
  min_minutes int := 25; -- minimum for streak/stats credit
begin
  if NEW.status in ('landed', 'aborted') and OLD.status = 'active' then
    if NEW.focused_minutes >= min_minutes then
      update profiles set
        total_focus_minutes = total_focus_minutes + NEW.focused_minutes,
        total_flights       = total_flights + 1,
        total_distance_km   = total_distance_km + NEW.distance_covered_km,
        streak_days = case
          when last_session_date = current_date - 1 then streak_days + 1
          when last_session_date = current_date then streak_days  -- already counted today
          else 1                                                  -- streak broken
        end,
        last_session_date = current_date
      where id = NEW.user_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_update_user_stats
  after update on sessions
  for each row execute function update_user_stats_on_session_end();

-- ── Auto-create profile on signup ─────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();