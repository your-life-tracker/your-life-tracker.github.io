import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { overlay } from "overlay-kit";
import { LogOut, Plus } from "lucide-react";
import { ActionDialog } from "./ActionDialog";
import { ActionItem } from "./ActionItem";
import { Button } from "./ui/Button";
import {
  useActionHistoryQuery,
  useActionsQuery,
  useAdjustEntryMutation,
  useArchiveActionMutation,
  useCreateActionMutation,
  useCurrentEntriesQuery,
} from "../hooks/useActions";
import {
  formatMonthlyRange,
  formatWeeklyRange,
  getCurrentPeriod,
} from "../lib/periods";
import { calculateStreak } from "../lib/streak";
import { supabase } from "../lib/supabase";
import type { Action, ActionEntry } from "../lib/types";

type HomeScreenProps = {
  session: Session;
};

export function HomeScreen({ session }: HomeScreenProps) {
  const userId = session.user.id;
  const actionsQuery = useActionsQuery(userId);
  const currentEntriesQuery = useCurrentEntriesQuery(userId);
  const actions = actionsQuery.data ?? [];
  const currentEntries = currentEntriesQuery.data ?? [];
  const historyQuery = useActionHistoryQuery(userId, actions);
  const historyEntries = historyQuery.data ?? [];
  const createAction = useCreateActionMutation(userId);
  const archiveAction = useArchiveActionMutation(userId);
  const adjustEntry = useAdjustEntryMutation(userId);

  const weeklyPeriod = getCurrentPeriod("weekly");
  const monthlyPeriod = getCurrentPeriod("monthly");
  const weeklyActions = actions.filter((action) => action.period === "weekly");
  const monthlyActions = actions.filter((action) => action.period === "monthly");

  function openActionDialog() {
    overlay.open(({ isOpen, close, unmount }) => (
      <ActionDialog
        open={isOpen}
        onClose={close}
        onExit={unmount}
        onCreate={createAction.mutateAsync}
      />
    ));
  }

  function getCurrentAmount(action: Action) {
    const period = action.period === "weekly" ? weeklyPeriod : monthlyPeriod;
    return (
      currentEntries.find(
        (entry) =>
          entry.action_id === action.id && entry.period_start === period.startKey,
      )?.amount ?? 0
    );
  }

  function renderAction(action: Action) {
    const amount = getCurrentAmount(action);
    const period = action.period === "weekly" ? weeklyPeriod : monthlyPeriod;
    const mergedEntries = mergeEntries(historyEntries, currentEntries);

    return (
      <ActionItem
        key={action.id}
        action={action}
        amount={amount}
        streak={calculateStreak(action, mergedEntries, period.startKey)}
        isAdjusting={adjustEntry.isPending}
        isArchiving={archiveAction.isPending}
        onArchive={() => archiveAction.mutate(action.id)}
        onAdjust={(delta) =>
          adjustEntry.mutate({
            action,
            currentAmount: amount,
            delta,
          })
        }
      />
    );
  }

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-950">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
          <div>
            <h1 className="text-lg font-semibold">Life Tracker</h1>
            <p className="text-xs text-stone-500">{session.user.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="로그아웃"
            onClick={() => void supabase.auth.signOut()}
          >
            <LogOut size={19} aria-hidden />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">
        {actionsQuery.isLoading ? (
          <p className="py-16 text-center text-sm text-stone-500">
            액션을 불러오는 중...
          </p>
        ) : actions.length === 0 ? (
          <section className="flex min-h-[calc(100dvh-180px)] items-center justify-center text-center">
            <p className="text-sm text-stone-500">
              액션을 생성해서 흐름을 기록해보세요
            </p>
          </section>
        ) : (
          <div className="space-y-8">
            <PeriodSection
              title="주간"
              subtitle={formatWeeklyRange(weeklyPeriod)}
              actions={weeklyActions}
              renderAction={renderAction}
            />
            <PeriodSection
              title="월간"
              subtitle={formatMonthlyRange(monthlyPeriod)}
              actions={monthlyActions}
              renderAction={renderAction}
            />
          </div>
        )}
      </div>

      <Button
        type="button"
        className="fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full shadow-lg"
        aria-label="액션 생성"
        onClick={openActionDialog}
      >
        <Plus size={24} aria-hidden />
      </Button>
    </main>
  );
}

function PeriodSection({
  title,
  subtitle,
  actions,
  renderAction,
}: {
  title: string;
  subtitle: string;
  actions: Action[];
  renderAction: (action: Action) => ReactNode;
}) {
  return (
    <section>
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-stone-950">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      {actions.length > 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white px-4 shadow-sm">
          {actions.map(renderAction)}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-400">
          해당 주기의 액션이 없습니다.
        </div>
      )}
    </section>
  );
}

function mergeEntries(historyEntries: ActionEntry[], currentEntries: ActionEntry[]) {
  const byKey = new Map<string, ActionEntry>();
  [...historyEntries, ...currentEntries].forEach((entry) => {
    byKey.set(`${entry.action_id}:${entry.period_start}`, entry);
  });
  return [...byKey.values()];
}
