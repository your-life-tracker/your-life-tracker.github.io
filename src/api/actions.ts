import { subYears } from "date-fns";
import { getCurrentPeriod, toDateKey } from "../lib/periods";
import { supabase } from "../lib/supabase";
import type { Action, ActionEntry, ActionPeriod, ActionUnit } from "../lib/types";

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
  const { data, error } = await supabase
    .from("actions")
    .insert({
      user_id: input.userId,
      name: input.name,
      period: input.period,
      unit: input.unit,
      target_amount: input.targetAmount,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data satisfies Action;
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
};

export async function adjustEntry(input: AdjustEntryInput) {
  const period = getCurrentPeriod(input.action.period);
  const nextAmount = Math.max(0, input.currentAmount + input.delta);

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
  return data satisfies ActionEntry;
}
