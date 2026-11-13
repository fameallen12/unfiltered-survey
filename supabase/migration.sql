create table if not exists public.survey_responses (
  id                uuid primary key default gen_random_uuid(),
  client_token      uuid not null unique,              -- prevents duplicate submissions
  creative_category text[] not null,
  usage_frequency   text   not null,
  platforms         text[] not null,
  challenges        text[] not null,
  usefulness_rating smallint not null check (usefulness_rating between 1 and 5),
  asset_categories  text[] not null,
  desired_features  text[] not null,
  payment_methods   text[] not null,
  price_range       text   not null,
  open_feedback     text check (open_feedback is null or char_length(open_feedback) <= 1500),
  created_at        timestamptz not null default now()
);

-- RLS on with NO policies: anon/authenticated roles can neither read nor write.
-- The server endpoint uses the service role key, which bypasses RLS.
alter table public.survey_responses enable row level security;
revoke all on public.survey_responses from anon, authenticated;
