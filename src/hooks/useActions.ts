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
  fetchActionHistory,
  fetchActions,
  fetchCurrentEntries,
  type AdjustEntryInput,
  type CreateActionInput,
} from "../api/actions";
import { getCurrentPeriod } from "../lib/periods";
import type { Action, ActionEntry } from "../lib/types";

export const actionKeys = {
  actions: (userId: string) => ["actions", userId] as const,
  currentEntries: (userId: string) => ["current-entries", userId] as const,
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
      const historyKeyPrefix = ["action-history", userId] satisfies QueryKey;
      await queryClient.cancelQueries({ queryKey: currentKey });
      await queryClient.cancelQueries({ queryKey: historyKeyPrefix });

      const previousCurrent =
        queryClient.getQueryData<ActionEntry[]>(currentKey) ?? [];
      const period = getCurrentPeriod(input.action.period);
      const nextAmount = Math.max(0, input.currentAmount + input.delta);
      const optimisticEntry: ActionEntry = {
        id: `optimistic-${input.action.id}-${period.startKey}`,
        action_id: input.action.id,
        user_id: userId,
        period_start: period.startKey,
        period_end: period.endKey,
        amount: nextAmount,
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

      return { previousCurrent, previousHistories, currentKey };
    },
    onError: (_error, _input, context) => {
      if (!context) return;
      queryClient.setQueryData(context.currentKey, context.previousCurrent);
      context.previousHistories.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: actionKeys.currentEntries(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["action-history", userId],
      });
    },
  });
}
