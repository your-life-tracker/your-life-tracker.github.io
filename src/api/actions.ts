import { subYears } from "date-fns";
import { getCurrentPeriod, toDateKey } from "../lib/periods";
import { supabase } from "../lib/supabase";
import type {
  Action,
  ActionDailyEntry,
  ActionEntry,
  ActionPeriod,
  ActionUnit,
} from "../lib/types";

export type CreateActionInput = {
  userId: string;
  name: string;
  period: ActionPeriod;
  unit: ActionUnit;
  targetAmount: number;
};

export async function fetchActions(userId: string) {
  const { data, error } = await supabase
    .from("actions")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data satisfies Action[];
}

export async function fetchCurrentEntries(userId: string) {
  const weekly = getCurrentPeriod("weekly");
  const monthly = getCurrentPeriod("monthly");

  const { data, error } = await supabase
    .from("action_entries")
    .select("*")
    .eq("user_id", userId)
    .in("period_start", [weekly.startKey, monthly.startKey]);

  if (error) throw error;
  return data satisfies ActionEntry[];
}

export async function fetchCurrentDailyEntries(userId: string) {
  const todayKey = toDateKey(new Date());
  const { data, error } = await supabase
    .from("action_daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", todayKey);

  if (error) throw error;
  return data satisfies ActionDailyEntry[];
}

export async function fetchActionDailyEntries(
  userId: string,
  actionId: string,
  startDate: Date,
  endDate: Date,
) {
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  const { data, error } = await supabase
    .from("action_daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("action_id", actionId)
    .gte("entry_date", startKey)
    .lte("entry_date", endKey)
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return data satisfies ActionDailyEntry[];
}

export async function fetchFirstActionDailyEntry(
  userId: string,
  actionId: string,
) {
  const { data, error } = await supabase
    .from("action_daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("action_id", actionId)
    .gt("amount", 0)
    .order("entry_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ActionDailyEntry | null;
}

export async function fetchActionHistory(userId: string, actionIds: string[]) {
  if (actionIds.length === 0) return [] satisfies ActionEntry[];

  const since = toDateKey(subYears(new Date(), 5));
  const { data, error } = await supabase
    .from("action_entries")
    .select("*")
    .eq("user_id", userId)
    .in("action_id", actionIds)
    .gte("period_start", since)
    .order("period_start", { ascending: false });

  if (error) throw error;
  return data satisfies ActionEntry[];
}

export async function createAction(input: CreateActionInput) {
  const { data: latestAction, error: latestActionError } = await supabase
    .from("actions")
    .select("sort_order")
    .eq("user_id", input.userId)
    .eq("period", input.period)
    .is("archived_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestActionError) throw latestActionError;

  const { data, error } = await supabase
    .from("actions")
    .insert({
      user_id: input.userId,
      name: input.name,
      period: input.period,
      unit: input.unit,
      target_amount: input.targetAmount,
      sort_order: (latestAction?.sort_order ?? -1000) + 1000,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data satisfies Action;
}

export type ReorderActionsInput = {
  userId: string;
  actions: Array<{
    id: string;
    sortOrder: number;
  }>;
};

export async function reorderActions(input: ReorderActionsInput) {
  await Promise.all(
    input.actions.map(async (action) => {
      const { error } = await supabase
        .from("actions")
        .update({ sort_order: action.sortOrder })
        .eq("id", action.id)
        .eq("user_id", input.userId);

      if (error) throw error;
    }),
  );

  return input.actions;
}

export async function archiveAction(actionId: string) {
  const { data, error } = await supabase
    .from("actions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", actionId)
    .select("*")
    .single();

  if (error) throw error;
  return data satisfies Action;
}

export type AdjustEntryInput = {
  action: Action;
  userId: string;
  delta: number;
  currentAmount: number;
  currentTodayAmount: number;
};

export async function adjustEntry(input: AdjustEntryInput) {
  const period = getCurrentPeriod(input.action.period);
  const todayKey = toDateKey(new Date());
  const appliedDelta =
    input.delta < 0
      ? -Math.min(Math.abs(input.delta), input.currentTodayAmount)
      : input.delta;
  const nextAmount = Math.max(0, input.currentAmount + appliedDelta);
  const nextTodayAmount = Math.max(0, input.currentTodayAmount + appliedDelta);

  const { data, error } = await supabase
    .from("action_entries")
    .upsert(
      {
        action_id: input.action.id,
        user_id: input.userId,
        period_start: period.startKey,
        period_end: period.endKey,
        amount: nextAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "action_id,period_start" },
    )
    .select("*")
    .single();

  if (error) throw error;

  const { error: dailyError } = await supabase
    .from("action_daily_entries")
    .upsert(
      {
        action_id: input.action.id,
        user_id: input.userId,
        entry_date: todayKey,
        amount: nextTodayAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "action_id,entry_date" },
    );

  if (dailyError) throw dailyError;

  return data satisfies ActionEntry;
}
