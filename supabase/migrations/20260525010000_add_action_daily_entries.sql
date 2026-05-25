create table if not exists public.action_daily_entries (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  amount integer not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now(),
  constraint action_daily_entries_action_date_unique unique (action_id, entry_date)
);

create index if not exists action_daily_entries_user_date_idx
  on public.action_daily_entries (user_id, entry_date desc);

alter table public.action_daily_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_daily_entries'
      and policyname = 'Users can read own action daily entries'
  ) then
    create policy "Users can read own action daily entries"
      on public.action_daily_entries for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_daily_entries'
      and policyname = 'Users can create own action daily entries'
  ) then
    create policy "Users can create own action daily entries"
      on public.action_daily_entries for insert
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.actions
          where actions.id = action_daily_entries.action_id
            and actions.user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'action_daily_entries'
      and policyname = 'Users can update own action daily entries'
  ) then
    create policy "Users can update own action daily entries"
      on public.action_daily_entries for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
