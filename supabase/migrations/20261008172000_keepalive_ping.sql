-- Single-row heartbeat for the Vercel keep-alive cron.
-- RLS is on with no policies so PostgREST table access is denied;
-- anon/authenticated may only call keepalive_ping().

create table if not exists public.keepalive (
  id int primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);

insert into public.keepalive (id)
values (1)
on conflict do nothing;

alter table public.keepalive enable row level security;

create or replace function public.keepalive_ping()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update public.keepalive
  set pinged_at = now()
  where id = 1
  returning pinged_at;
$$;

revoke execute on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon, authenticated;
