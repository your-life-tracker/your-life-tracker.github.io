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
  fetchActionDailyEntries,
  fetchActionHistory,
  fetchActions,
  fetchCurrentDailyEntries,
  fetchCurrentEntries,
  type AdjustEntryInput,
  type CreateActionInput,
} from "../api/actions";
import { getCurrentPeriod, toDateKey } from "../lib/periods";
import type { Action, ActionDailyEntry, ActionEntry } from "../lib/types";

export const actionKeys = {
  actions: (userId: string) => ["actions", userId] as const,
  currentEntries: (userId: string) => ["current-entries", userId] as const,
  currentDailyEntries: (userId: string) =>
    ["current-daily-entries", userId] as const,
  dailyEntries: (userId: string, actionId: string, monthKey: string) =>
    ["action-daily-entries", userId, actionId, monthKey] as const,
  history: (userId: string, actionIds: string[]) =>
    ["action-history", userId, actionIds.join(",")] as const,
};

export function useActionsQuery(userId: string) {
  return useQuery({
    queryKey: actionKeys.actions(userId),
    queryFn: () => fetchActions(userId),
  });
}

export function useCurrentEntriesQuery(userId: string) {
  return useQuery({
    queryKey: actionKeys.currentEntries(userId),
    queryFn: () => fetchCurrentEntries(userId),
  });
}

export function useCurrentDailyEntriesQuery(userId: string) {
  return useQuery({
    queryKey: actionKeys.currentDailyEntries(userId),
    queryFn: () => fetchCurrentDailyEntries(userId),
  });
}

export function useActionDailyEntriesQuery(
  userId: string,
  actionId: string,
  monthDate: Date,
) {
  const monthKey = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));

  return useQuery({
    queryKey: actionKeys.dailyEntries(userId, actionId, monthKey),
    queryFn: () => fetchActionDailyEntries(userId, actionId, monthDate),
  });
}

export function useActionHistoryQuery(userId: string, actions: Action[]) {
  const actionIds = actions.map((action) => action.id).sort();

  return useQuery({
    queryKey: actionKeys.history(userId, actionIds),
    queryFn: () => fetchActionHistory(userId, actionIds),
    enabled: actionIds.length > 0,
  });
}

export function useCreateActionMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateActionInput, "userId">) =>
      createAction({ ...input, userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: actionKeys.actions(userId),
      });
    },
  });
}

export function useArchiveActionMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveAction,
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

export function useAdjustEntryMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<AdjustEntryInput, "userId">) =>
      adjustEntry({ ...input, userId }),
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
    },
  });
}
