import type { CSSProperties, ReactNode } from "react";
import { overlay } from "overlay-kit";
import { LogOut, Plus } from "lucide-react";
import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionDialog } from "./ActionDialog";
import { ActionHistoryDialog } from "./ActionHistoryDialog";
import { ActionItem, type ActionDragHandleProps } from "./ActionItem";
import { ArchiveConfirmDialog } from "./ArchiveConfirmDialog";
import { Button } from "./ui/Button";
import { LoadingIndicator } from "./LoadingIndicator";
import { SignOutConfirmDialog } from "./SignOutConfirmDialog";
import {
  useCurrentDailyEntriesQuery,
  useActionsQuery,
  useAdjustEntryMutation,
  useArchiveActionMutation,
  useCreateActionMutation,
  useCurrentEntriesQuery,
  useReorderActionsMutation,
} from "../hooks/useActions";
import {
  formatMonthlyRange,
  formatWeeklyRange,
  getCurrentPeriod,
} from "../lib/periods";
import { supabase } from "../lib/supabase";
import type { HomeUser } from "../lib/authMode";
import type { Action } from "../lib/types";
import lifeTrackerLogo from "../assets/life-tracker-logo.svg";

type HomeScreenProps = {
  user: HomeUser;
  onSignOut: () => void;
};

export function HomeScreen({ user, onSignOut }: HomeScreenProps) {
  const userId = user.id;
  const actionsQuery = useActionsQuery(userId, user.isGuest);
  const currentEntriesQuery = useCurrentEntriesQuery(userId, user.isGuest);
  const currentDailyEntriesQuery = useCurrentDailyEntriesQuery(
    userId,
    user.isGuest,
  );
  const actions = actionsQuery.data ?? [];
  const currentEntries = currentEntriesQuery.data ?? [];
  const currentDailyEntries = currentDailyEntriesQuery.data ?? [];
  const createAction = useCreateActionMutation(userId, user.isGuest);
  const archiveAction = useArchiveActionMutation(userId, user.isGuest);
  const adjustEntry = useAdjustEntryMutation(userId, user.isGuest);
  const reorderActions = useReorderActionsMutation(userId, user.isGuest);
  const isInitialLoading =
    actionsQuery.isLoading ||
    currentEntriesQuery.isLoading ||
    currentDailyEntriesQuery.isLoading;

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

  function openArchiveConfirmDialog(action: Action) {
    overlay.open(({ isOpen, close, unmount }) => (
      <ArchiveConfirmDialog
        actionName={action.name}
        open={isOpen}
        onClose={close}
        onExit={unmount}
        onConfirm={() => archiveAction.mutateAsync(action.id)}
      />
    ));
  }

  function openActionHistoryDialog(action: Action) {
    overlay.open(({ isOpen, close, unmount }) => (
      <ActionHistoryDialog
        action={action}
        userId={userId}
        isGuest={user.isGuest}
        open={isOpen}
        onClose={close}
        onExit={unmount}
      />
    ));
  }

  function openSignOutConfirmDialog() {
    overlay.open(({ isOpen, close, unmount }) => (
      <SignOutConfirmDialog
        open={isOpen}
        onClose={close}
        onExit={unmount}
        onConfirm={async () => {
          if (!user.isGuest) {
            await supabase.auth.signOut();
          }
          onSignOut();
        }}
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

  function getTodayAmount(action: Action) {
    return (
      currentDailyEntries.find((entry) => entry.action_id === action.id)
        ?.amount ?? 0
    );
  }

  function renderAction(
    action: Action,
    dragHandleProps?: ActionDragHandleProps,
  ) {
    const amount = getCurrentAmount(action);
    const todayAmount = getTodayAmount(action);

    return (
      <ActionItem
        key={action.id}
        action={action}
        amount={amount}
        dragHandleProps={dragHandleProps}
        todayAmount={todayAmount}
        isAdjusting={
          adjustEntry.isPending && adjustEntry.variables?.action.id === action.id
        }
        isArchiving={archiveAction.isPending}
        onOpenHistory={() => openActionHistoryDialog(action)}
        onArchive={() => openArchiveConfirmDialog(action)}
        onAdjust={(delta) =>
          adjustEntry.mutate({
            action,
            currentAmount: amount,
            currentTodayAmount: todayAmount,
            delta,
          })
        }
      />
    );
  }

  if (isInitialLoading) {
    return (
        <main className="min-h-svh bg-stone-50">
          <LoadingIndicator className="min-h-svh" />
        </main>
    )
  }

  return (
    <main className="min-h-svh bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex min-h-[84px] w-full max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="leading-none">
              <button
                type="button"
                className="rounded-md bg-transparent p-0 text-left outline-none transition opacity-95 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                onClick={() => window.location.reload()}
              >
                <img
                  className="-ml-[6px] h-[40px] w-[120px] object-contain object-left"
                  src={lifeTrackerLogo}
                  alt="Life Tracker"
                />
              </button>
            </h1>
            <p className="mt-0.5 text-[12px] leading-tight text-stone-500">
              {user.email}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="로그아웃"
            onClick={openSignOutConfirmDialog}
          >
            <LogOut size={19} aria-hidden />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">
        {actions.length === 0 ? (
            <section className="flex min-h-[calc(100svh-180px)] items-center justify-center text-center">
              <p className="text-sm text-stone-500">
                목표를 세우고 꾸준히 실천해보세요
              </p>
            </section>
        ) : (
            <div className="space-y-9">
              <PeriodSection
                  title="주 단위"
                  subtitle={formatWeeklyRange(weeklyPeriod)}
                  actions={weeklyActions}
                  renderAction={renderAction}
                  onReorder={(nextActions) => reorderActions.mutate(nextActions)}
              />
              <PeriodSection
                  title="월 단위"
                  subtitle={formatMonthlyRange(monthlyPeriod)}
                  actions={monthlyActions}
                  renderAction={renderAction}
                  onReorder={(nextActions) => reorderActions.mutate(nextActions)}
              />
            </div>
        )}
      </div>

      <Button
        type="button"
        className="fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full shadow-lg shadow-stone-950/15"
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
  onReorder,
}: {
  title: string;
  subtitle: string;
  actions: Action[];
  renderAction: (
    action: Action,
    dragHandleProps?: ActionDragHandleProps,
  ) => ReactNode;
  onReorder: (actions: Action[]) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    }),
  );
  const actionIds = actions.map((action) => action.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = actionIds.indexOf(String(active.id));
    const newIndex = actionIds.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(actions, oldIndex, newIndex));
  }

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[15px] font-bold leading-snug text-stone-950">
          {title}
        </h2>
        <p className="mt-0.5 text-[13px] leading-5 text-stone-500">
          {subtitle}
        </p>
      </div>
      {actions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={actionIds} strategy={rectSortingStrategy}>
            <div className="grid gap-3 min-[720px]:auto-rows-fr min-[720px]:grid-cols-2">
              {actions.map((action) => (
                <SortableActionItem
                  key={action.id}
                  action={action}
                  renderAction={renderAction}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-200 bg-white px-4 py-9 text-center text-sm leading-6 text-stone-400">
          해당 주기의 액션이 없습니다.
        </div>
      )}
    </section>
  );
}

function SortableActionItem({
  action,
  renderAction,
}: {
  action: Action;
  renderAction: (
    action: Action,
    dragHandleProps?: ActionDragHandleProps,
  ) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });
  const style: CSSProperties = {
    position: isDragging ? "relative" : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} className="h-full" style={style}>
      {renderAction(action, {
        attributes,
        listeners,
        setActivatorNodeRef,
        isDragging,
      })}
    </div>
  );
}
