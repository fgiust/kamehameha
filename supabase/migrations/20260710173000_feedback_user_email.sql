alter table public.feedback_entries
  add column if not exists user_email text;
