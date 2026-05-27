import {
  addDays,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import {
  adjustEntry,
  archiveAction,
  createAction,
  updateAction,
  fetchActionDailyEntries,
  fetchFirstActionDailyEntry,
  fetchActionHistory,
  fetchActions,
  fetchCurrentDailyEntries,
  fetchCurrentEntries,
  reorderActions,
  type AdjustEntryInput,
  type CreateActionInput,
} from "../api/actions";
import {
  adjustGuestEntry,
  archiveGuestAction,
  createGuestAction,
  updateGuestAction,
  fetchGuestActionDailyEntries,
  fetchGuestFirstActionDailyEntry,
  fetchGuestActionHistory,
  fetchGuestActions,
  fetchGuestCurrentDailyEntries,
  fetchGuestCurrentEntries,
  reorderGuestActions,
} from "../lib/guestStorage";
import { getCurrentPeriod, toDateKey } from "../lib/periods";
import type { Action, ActionDailyEntry, ActionEntry } from "../lib/types";

export const actionKeys = {
  actions: (userId: string) => ["actions", userId] as const,
  currentEntries: (userId: string) => ["current-entries", userId] as const,
  currentDailyEntries: (userId: string) =>
    ["current-daily-entries", userId] as const,
  dailyEntries: (
    userId: string,
    actionId: string,
    startKey: string,
    endKey: string,
  ) => ["action-daily-entries", userId, actionId, startKey, endKey] as const,
  firstDailyEntry: (userId: string, actionId: string) =>
    ["action-first-daily-entry", userId, actionId] as const,
  history: (userId: string, actionIds: string[]) =>
    ["action-history", userId, actionIds.join(",")] as const,
};

function getCalendarRange(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const minimumCalendarEnd = addDays(calendarStart, 41);
  const monthCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return {
    start: calendarStart,
    end:
      monthCalendarEnd > minimumCalendarEnd
        ? monthCalendarEnd
        : minimumCalendarEnd,
  };
}

export function useActionsQuery(userId: string, isGuest = false) {
  return useQuery({
    queryKey: actionKeys.actions(userId),
    queryFn: () =>
      isGuest ? fetchGuestActions(userId) : fetchActions(userId),
  });
}

export function useCurrentEntriesQuery(userId: string, isGuest = false) {
  return useQuery({
    queryKey: actionKeys.currentEntries(userId),
    queryFn: () =>
      isGuest ? fetchGuestCurrentEntries(userId) : fetchCurrentEntries(userId),
  });
}

export function useCurrentDailyEntriesQuery(userId: string, isGuest = false) {
  return useQuery({
    queryKey: actionKeys.currentDailyEntries(userId),
    queryFn: () =>
      isGuest
        ? fetchGuestCurrentDailyEntries(userId)
        : fetchCurrentDailyEntries(userId),
  });
}

export function useActionDailyEntriesQuery(
  userId: string,
  actionId: string,
  monthDate: Date,
  isGuest = false,
) {
  const calendarRange = getCalendarRange(monthDate);
  const startKey = toDateKey(calendarRange.start);
  const endKey = toDateKey(calendarRange.end);

  return useQuery({
    queryKey: actionKeys.dailyEntries(userId, actionId, startKey, endKey),
    queryFn: () =>
      isGuest
        ? fetchGuestActionDailyEntries(
            userId,
            actionId,
            calendarRange.start,
            calendarRange.end,
          )
        : fetchActionDailyEntries(
            userId,
            actionId,
            calendarRange.start,
            calendarRange.end,
          ),
  });
}

export function useActionFirstDailyEntryQuery(
  userId: string,
  actionId: string,
  isGuest = false,
) {
  return useQuery({
    queryKey: actionKeys.firstDailyEntry(userId, actionId),
    queryFn: () =>
      isGuest
        ? fetchGuestFirstActionDailyEntry(userId, actionId)
        : fetchFirstActionDailyEntry(userId, actionId),
  });
}

export function useActionHistoryQuery(
  userId: string,
  actions: Action[],
  isGuest = false,
) {
  const actionIds = actions.map((action) => action.id).sort();

  return useQuery({
    queryKey: actionKeys.history(userId, actionIds),
    queryFn: () =>
      isGuest
        ? fetchGuestActionHistory(userId, actionIds)
        : fetchActionHistory(userId, actionIds),
    enabled: actionIds.length > 0,
  });
}

export function useCreateActionMutation(userId: string, isGuest = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateActionInput, "userId">) =>
      isGuest
        ? createGuestAction({ ...input, userId })
        : await createAction({ ...input, userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: actionKeys.actions(userId),
      });
    },
  });
}

export function useUpdateActionMutation(userId: string, isGuest = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; name: string }) =>
      isGuest ? updateGuestAction(input) : await updateAction(input),
    onMutate: async (input) => {
      const key = actionKeys.actions(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Action[]>(key);

      queryClient.setQueryData<Action[]>(key, (current = []) =>
        current.map((action) =>
          action.id === input.id ? { ...action, name: input.name } : action,
        ),
      );

      return { previous, key };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: actionKeys.actions(userId),
      });
    },
  });
}

export function useArchiveActionMutation(userId: string, isGuest = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string) =>
      isGuest ? archiveGuestAction(actionId) : await archiveAction(actionId),
    onMutate: async (actionId) => {
      const key = actionKeys.actions(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Action[]>(key);

      queryClient.setQueryData<Action[]>(key, (current = []) =>
        current.filter((action) => action.id !== actionId),
      );

      return { previous, key };
    },
    onError: (_error, _actionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: actionKeys.actions(userId),
      });
    },
  });
}

export function useReorderActionsMutation(userId: string, isGuest = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actions: Action[]) => {
      const input = actions.map((action, index) => ({
        id: action.id,
        sortOrder: index * 1000,
      }));

      return isGuest
        ? reorderGuestActions(userId, input)
        : await reorderActions({ userId, actions: input });
    },
    onMutate: async (actions) => {
      const key = actionKeys.actions(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Action[]>(key);
      const sortOrderById = new Map(
        actions.map((action, index) => [action.id, index * 1000]),
      );

      queryClient.setQueryData<Action[]>(key, (current = []) =>
        current
          .map((action) => {
            const sortOrder = sortOrderById.get(action.id);
            return sortOrder === undefined
              ? action
              : { ...action, sort_order: sortOrder };
          })
          .sort(
            (a, b) =>
              a.sort_order - b.sort_order ||
              a.created_at.localeCompare(b.created_at),
          ),
      );

      return { previous, key };
    },
    onError: (_error, _actions, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: actionKeys.actions(userId),
      });
    },
  });
}

export function useAdjustEntryMutation(userId: string, isGuest = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<AdjustEntryInput, "userId">) =>
      isGuest
        ? adjustGuestEntry({ ...input, userId })
        : await adjustEntry({ ...input, userId }),
    onMutate: async (input) => {
      const currentKey = actionKeys.currentEntries(userId);
      const currentDailyKey = actionKeys.currentDailyEntries(userId);
      const historyKeyPrefix = ["action-history", userId] satisfies QueryKey;
      await queryClient.cancelQueries({ queryKey: currentKey });
      await queryClient.cancelQueries({ queryKey: currentDailyKey });
      await queryClient.cancelQueries({ queryKey: historyKeyPrefix });

      const previousCurrent =
        queryClient.getQueryData<ActionEntry[]>(currentKey) ?? [];
      const previousCurrentDaily =
        queryClient.getQueryData<ActionDailyEntry[]>(currentDailyKey) ?? [];
      const period = getCurrentPeriod(input.action.period);
      const todayKey = toDateKey(new Date());
      const appliedDelta =
        input.delta < 0
          ? -Math.min(Math.abs(input.delta), input.currentTodayAmount)
          : input.delta;
      const nextAmount = Math.max(0, input.currentAmount + appliedDelta);
      const nextTodayAmount = Math.max(
        0,
        input.currentTodayAmount + appliedDelta,
      );
      const optimisticEntry: ActionEntry = {
        id: `optimistic-${input.action.id}-${period.startKey}`,
        action_id: input.action.id,
        user_id: userId,
        period_start: period.startKey,
        period_end: period.endKey,
        amount: nextAmount,
        updated_at: new Date().toISOString(),
      };
      const optimisticDailyEntry: ActionDailyEntry = {
        id: `optimistic-daily-${input.action.id}-${todayKey}`,
        action_id: input.action.id,
        user_id: userId,
        entry_date: todayKey,
        amount: nextTodayAmount,
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<ActionEntry[]>(currentKey, (current = []) => {
        const withoutEntry = current.filter(
          (entry) =>
            !(
              entry.action_id === input.action.id &&
              entry.period_start === period.startKey
            ),
        );
        return [...withoutEntry, optimisticEntry];
      });

      queryClient.setQueryData<ActionDailyEntry[]>(
        currentDailyKey,
        (current = []) => {
          const withoutEntry = current.filter(
            (entry) =>
              !(
                entry.action_id === input.action.id &&
                entry.entry_date === todayKey
              ),
          );
          return [...withoutEntry, optimisticDailyEntry];
        },
      );

      const previousHistories = queryClient.getQueriesData<ActionEntry[]>({
        queryKey: historyKeyPrefix,
      });

      previousHistories.forEach(([key, value = []]) => {
        queryClient.setQueryData<ActionEntry[]>(key, () => {
          const withoutEntry = value.filter(
            (entry) =>
              !(
                entry.action_id === input.action.id &&
                entry.period_start === period.startKey
              ),
          );
          return [optimisticEntry, ...withoutEntry];
        });
      });

      const dailyKeyPrefix = ["action-daily-entries", userId] satisfies QueryKey;
      const previousDailyQueries = queryClient.getQueriesData<ActionDailyEntry[]>({
        queryKey: dailyKeyPrefix,
      });

      previousDailyQueries.forEach(([key, value = []]) => {
        queryClient.setQueryData<ActionDailyEntry[]>(key, () => {
          const withoutEntry = value.filter(
            (entry) =>
              !(
                entry.action_id === input.action.id &&
                entry.entry_date === todayKey
              ),
          );
          return [...withoutEntry, optimisticDailyEntry].sort((a, b) =>
            a.entry_date.localeCompare(b.entry_date),
          );
        });
      });

      return {
        previousCurrent,
        previousCurrentDaily,
        previousHistories,
        previousDailyQueries,
        currentKey,
        currentDailyKey,
      };
    },
    onError: (_error, _input, context) => {
      if (!context) return;
      queryClient.setQueryData(context.currentKey, context.previousCurrent);
      queryClient.setQueryData(
        context.currentDailyKey,
        context.previousCurrentDaily,
      );
      context.previousHistories.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      context.previousDailyQueries.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: actionKeys.currentEntries(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: actionKeys.currentDailyEntries(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["action-history", userId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["action-daily-entries", userId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["action-first-daily-entry", userId],
      });
    },
  });
}
