export type ActionPeriod = "weekly" | "monthly";
export type ActionUnit = "count" | "minutes";

export type Action = {
  id: string;
  user_id: string;
  name: string;
  period: ActionPeriod;
  unit: ActionUnit;
  target_amount: number;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
};

export type ActionEntry = {
  id: string;
  action_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  amount: number;
  updated_at: string;
};

export type ActionDailyEntry = {
  id: string;
  action_id: string;
  user_id: string;
  entry_date: string;
  amount: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      actions: {
        Row: Action;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          period: ActionPeriod;
          unit: ActionUnit;
          target_amount: number;
          sort_order?: number;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Omit<Action, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      action_entries: {
        Row: ActionEntry;
        Insert: {
          id?: string;
          action_id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          amount: number;
          updated_at?: string;
        };
        Update: Partial<
          Omit<ActionEntry, "id" | "action_id" | "user_id" | "period_start">
        >;
        Relationships: [];
      };
      action_daily_entries: {
        Row: ActionDailyEntry;
        Insert: {
          id?: string;
          action_id: string;
          user_id: string;
          entry_date: string;
          amount: number;
          updated_at?: string;
        };
        Update: Partial<
          Omit<ActionDailyEntry, "id" | "action_id" | "user_id" | "entry_date">
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      action_period: ActionPeriod;
      action_unit: ActionUnit;
    };
    CompositeTypes: Record<string, never>;
  };
};
