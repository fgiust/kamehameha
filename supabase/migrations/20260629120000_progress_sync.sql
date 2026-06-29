create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exercise_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  persist_key text not null,
  segments jsonb not null,
  total_segments integer not null check (total_segments >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, persist_key),
  constraint exercise_progress_segments_is_array check (jsonb_typeof(segments) = 'array')
);

create index if not exists exercise_progress_user_id_idx
  on public.exercise_progress (user_id);

alter table public.profiles enable row level security;
alter table public.exercise_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "exercise_progress_select_own" on public.exercise_progress;
create policy "exercise_progress_select_own"
  on public.exercise_progress
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "exercise_progress_insert_own" on public.exercise_progress;
create policy "exercise_progress_insert_own"
  on public.exercise_progress
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "exercise_progress_update_own" on public.exercise_progress;
create policy "exercise_progress_update_own"
  on public.exercise_progress
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_exercise_progress_updated_at on public.exercise_progress;
create trigger set_exercise_progress_updated_at
before update on public.exercise_progress
for each row
execute procedure public.set_current_timestamp_updated_at();

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.exercise_progress to authenticated;
