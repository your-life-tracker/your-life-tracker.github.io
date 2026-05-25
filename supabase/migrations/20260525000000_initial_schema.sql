create type public.action_period as enum ('weekly', 'monthly');
create type public.action_unit as enum ('count', 'minutes');

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  period public.action_period not null,
  unit public.action_unit not null,
  target_amount integer not null check (target_amount > 0),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.action_entries (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount integer not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now(),
  constraint action_entries_period_order check (period_end >= period_start),
  constraint action_entries_action_period_unique unique (action_id, period_start)
);

create table public.action_daily_entries (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  amount integer not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now(),
  constraint action_daily_entries_action_date_unique unique (action_id, entry_date)
);

create index actions_user_active_idx
  on public.actions (user_id, created_at)
  where archived_at is null;

create index action_entries_user_period_idx
  on public.action_entries (user_id, period_start desc);

create index action_daily_entries_user_date_idx
  on public.action_daily_entries (user_id, entry_date desc);

alter table public.actions enable row level security;
alter table public.action_entries enable row level security;
alter table public.action_daily_entries enable row level security;

create policy "Users can read own actions"
  on public.actions for select
  using (auth.uid() = user_id);

create policy "Users can create own actions"
  on public.actions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own actions"
  on public.actions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own action entries"
  on public.action_entries for select
  using (auth.uid() = user_id);

create policy "Users can create own action entries"
  on public.action_entries for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.actions
      where actions.id = action_entries.action_id
        and actions.user_id = auth.uid()
    )
  );

create policy "Users can update own action entries"
  on public.action_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own action daily entries"
  on public.action_daily_entries for select
  using (auth.uid() = user_id);

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

create policy "Users can update own action daily entries"
  on public.action_daily_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
