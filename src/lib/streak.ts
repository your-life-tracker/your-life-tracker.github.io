import { parseISO } from "date-fns";
import { getPreviousPeriodStart } from "./periods";
import type { Action, ActionEntry } from "./types";

export function calculateStreak(
  action: Action,
  entries: ActionEntry[],
  currentStartKey: string,
) {
  const byStart = new Map(
    entries
      .filter((entry) => entry.action_id === action.id)
      .map((entry) => [entry.period_start, entry.amount]),
  );
  let cursor = parseISO(currentStartKey);

  const currentAmount = byStart.get(currentStartKey) ?? 0;
  if (currentAmount < action.target_amount) {
    cursor = getPreviousPeriodStart(action.period, cursor);
  }

  let streak = 0;
  while (streak < 260) {
    const key = cursor.toISOString().slice(0, 10);
    const amount = byStart.get(key) ?? 0;
    if (amount < action.target_amount) {
      break;
    }
    streak += 1;
    cursor = getPreviousPeriodStart(action.period, cursor);
  }

  return streak;
}
