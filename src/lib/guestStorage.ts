import { subYears } from "date-fns";
import { getCurrentPeriod, toDateKey } from "./periods";
import type {
  Action,
  ActionDailyEntry,
  ActionEntry,
  ActionPeriod,
  ActionUnit,
} from "./types";

const GUEST_DATA_STORAGE_KEY = "life-tracker:guest-data";

type GuestData = {
  actions: Action[];
  entries: ActionEntry[];
  dailyEntries: ActionDailyEntry[];
};

type GuestCreateActionInput = {
  userId: string;
  name: string;
  period: ActionPeriod;
  unit: ActionUnit;
  targetAmount: number;
};

type GuestAdjustEntryInput = {
  action: Action;
  userId: string;
  delta: number;
  currentAmount: number;
  currentTodayAmount: number;
};

function emptyGuestData(): GuestData {
  return {
    actions: [],
    entries: [],
    dailyEntries: [],
  };
}

function readGuestData() {
  const raw = window.localStorage.getItem(GUEST_DATA_STORAGE_KEY);
  if (!raw) {
    return emptyGuestData();
  }

  try {
    return { ...emptyGuestData(), ...JSON.parse(raw) } as GuestData;
  } catch {
    return emptyGuestData();
  }
}

function writeGuestData(data: GuestData) {
  window.localStorage.setItem(GUEST_DATA_STORAGE_KEY, JSON.stringify(data));
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function fetchGuestActions(userId: string) {
  return readGuestData()
    .actions.filter(
      (action) => action.user_id === userId && action.archived_at === null,
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function fetchGuestCurrentEntries(userId: string) {
  const weekly = getCurrentPeriod("weekly");
  const monthly = getCurrentPeriod("monthly");

  return readGuestData().entries.filter(
    (entry) =>
      entry.user_id === userId &&
      [weekly.startKey, monthly.startKey].includes(entry.period_start),
  );
}

export function fetchGuestCurrentDailyEntries(userId: string) {
  const todayKey = toDateKey(new Date());
  return readGuestData().dailyEntries.filter(
    (entry) => entry.user_id === userId && entry.entry_date === todayKey,
  );
}

export function fetchGuestActionHistory(userId: string, actionIds: string[]) {
  if (actionIds.length === 0) return [];

  const since = toDateKey(subYears(new Date(), 5));
  return readGuestData()
    .entries.filter(
      (entry) =>
        entry.user_id === userId &&
        actionIds.includes(entry.action_id) &&
        entry.period_start >= since,
    )
    .sort((a, b) => b.period_start.localeCompare(a.period_start));
}

export function fetchGuestActionDailyEntries(
  userId: string,
  actionId: string,
  startDate: Date,
  endDate: Date,
) {
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  return readGuestData()
    .dailyEntries.filter(
      (entry) =>
        entry.user_id === userId &&
        entry.action_id === actionId &&
        entry.entry_date >= startKey &&
        entry.entry_date <= endKey,
    )
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

export function fetchGuestFirstActionDailyEntry(userId: string, actionId: string) {
  return (
    readGuestData()
      .dailyEntries.filter(
        (entry) =>
          entry.user_id === userId &&
          entry.action_id === actionId &&
          entry.amount > 0,
      )
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date))[0] ?? null
  );
}

export function createGuestAction(input: GuestCreateActionInput) {
  const data = readGuestData();
  const action: Action = {
    id: createId("action"),
    user_id: input.userId,
    name: input.name,
    period: input.period,
    unit: input.unit,
    target_amount: input.targetAmount,
    created_at: new Date().toISOString(),
    archived_at: null,
  };

  writeGuestData({ ...data, actions: [...data.actions, action] });
  return action;
}

export function archiveGuestAction(actionId: string) {
  const data = readGuestData();
  const archivedAt = new Date().toISOString();
  const archivedAction = data.actions.find((action) => action.id === actionId);

  if (!archivedAction) {
    throw new Error("액션을 찾을 수 없습니다.");
  }

  const actions = data.actions.map((action) =>
    action.id === actionId ? { ...action, archived_at: archivedAt } : action,
  );
  writeGuestData({ ...data, actions });

  return { ...archivedAction, archived_at: archivedAt };
}

export function adjustGuestEntry(input: GuestAdjustEntryInput) {
  const data = readGuestData();
  const period = getCurrentPeriod(input.action.period);
  const todayKey = toDateKey(new Date());
  const appliedDelta =
    input.delta < 0
      ? -Math.min(Math.abs(input.delta), input.currentTodayAmount)
      : input.delta;
  const nextAmount = Math.max(0, input.currentAmount + appliedDelta);
  const nextTodayAmount = Math.max(0, input.currentTodayAmount + appliedDelta);
  const now = new Date().toISOString();

  const entryIndex = data.entries.findIndex(
    (entry) =>
      entry.action_id === input.action.id &&
      entry.period_start === period.startKey,
  );
  const entry: ActionEntry = {
    id:
      entryIndex >= 0
        ? data.entries[entryIndex].id
        : createId("entry"),
    action_id: input.action.id,
    user_id: input.userId,
    period_start: period.startKey,
    period_end: period.endKey,
    amount: nextAmount,
    updated_at: now,
  };
  const entries =
    entryIndex >= 0
      ? data.entries.map((current, index) => (index === entryIndex ? entry : current))
      : [...data.entries, entry];

  const dailyIndex = data.dailyEntries.findIndex(
    (dailyEntry) =>
      dailyEntry.action_id === input.action.id &&
      dailyEntry.entry_date === todayKey,
  );
  const dailyEntry: ActionDailyEntry = {
    id:
      dailyIndex >= 0
        ? data.dailyEntries[dailyIndex].id
        : createId("daily-entry"),
    action_id: input.action.id,
    user_id: input.userId,
    entry_date: todayKey,
    amount: nextTodayAmount,
    updated_at: now,
  };
  const dailyEntries =
    dailyIndex >= 0
      ? data.dailyEntries.map((current, index) =>
          index === dailyIndex ? dailyEntry : current,
        )
      : [...data.dailyEntries, dailyEntry];

  writeGuestData({ ...data, entries, dailyEntries });
  return entry;
}
