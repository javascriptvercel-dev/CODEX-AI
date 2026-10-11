create table if not exists public.assistant_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 10 and 180),
  answer text not null check (char_length(answer) between 10 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null
);

create index if not exists assistant_faqs_status_created_idx
  on public.assistant_faqs (status, created_at desc);

alter table public.assistant_faqs enable row level security;

drop policy if exists assistant_faqs_backend_only on public.assistant_faqs;
create policy assistant_faqs_backend_only on public.assistant_faqs
  for all to anon, authenticated using (false) with check (false);
