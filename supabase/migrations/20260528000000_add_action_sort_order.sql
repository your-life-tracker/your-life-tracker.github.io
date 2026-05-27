alter table public.actions
  add column sort_order integer not null default 0;

with ranked_actions as (
  select
    id,
    (row_number() over (
      partition by user_id, period
      order by created_at asc, id asc
    ) - 1) * 1000 as next_sort_order
  from public.actions
)
update public.actions
set sort_order = ranked_actions.next_sort_order
from ranked_actions
where actions.id = ranked_actions.id;

create index actions_user_active_period_sort_idx
  on public.actions (user_id, period, sort_order, created_at)
  where archived_at is null;
