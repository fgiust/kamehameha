create table if not exists public.feedback_entries (
  id bigint generated always as identity primary key,
  exercise_id text,
  section text,
  question text,
  correct_answer text,
  user_answer text,
  notes text,
  entry_text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  exported_at timestamptz
);

create index if not exists feedback_entries_created_at_idx
  on public.feedback_entries (created_at);

create index if not exists feedback_entries_exported_at_idx
  on public.feedback_entries (exported_at, created_at);
