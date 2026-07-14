-- feedback_entries is read/written only by /api/feedback (Vercel) using SUPABASE_SERVICE_ROLE_KEY.
-- Service role bypasses RLS; anon and authenticated must not access rows via PostgREST.

alter table public.feedback_entries enable row level security;

revoke all on table public.feedback_entries from anon, authenticated;

grant select, insert, update on table public.feedback_entries to service_role;
