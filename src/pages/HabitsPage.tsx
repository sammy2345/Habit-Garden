import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/ui/toast";
import { CreateHabitModal } from "../features/habits/CreateHabitModal";
import { CompleteHabitModal } from "../features/habits/CompleteHabitModal";

type HabitRow = {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  xp_reward: number;
  is_active: boolean;
};

type PlantRow = {
  id: string;
  name: string;
  stage: number;
  xp: number;
};

type CompletionRow = {
  habit_id: string;
  completed_on: string; // yyyy-mm-dd
};

function isoToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function HabitsPage(): JSX.Element {
  const { pushToast } = useToast();

  const [openCreate, setOpenCreate] = useState(false);
  const [openComplete, setOpenComplete] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitRow | null>(null);

  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  const [busy, setBusy] = useState<boolean>(false);

  const today = useMemo(() => isoToday(), []);

  const loadAll = useCallback(async () => {
    setBusy(true);

    const [habitsRes, plantsRes, completionsRes] = await Promise.all([
      supabase
        .from("habits")
        .select("id,title,frequency,xp_reward,is_active")
        .order("created_at", { ascending: false }),

      supabase
        .from("plants")
        .select("id,name,stage,xp")
        .order("created_at", { ascending: false }),

      supabase
        .from("habit_completions")
        .select("habit_id,completed_on")
        .eq("completed_on", today),
    ]);

    setBusy(false);

    if (habitsRes.error) {
      pushToast({ tone: "error", title: "Load habits failed", message: habitsRes.error.message });
      return;
    }
    if (plantsRes.error) {
      pushToast({ tone: "error", title: "Load plants failed", message: plantsRes.error.message });
      return;
    }
    if (completionsRes.error) {
      pushToast({ tone: "error", title: "Load completions failed", message: completionsRes.error.message });
      return;
    }

    setHabits((habitsRes.data ?? []) as HabitRow[]);
    setPlants((plantsRes.data ?? []) as PlantRow[]);
    setCompletedToday(new Set(((completionsRes.data ?? []) as CompletionRow[]).map((x) => x.habit_id)));
  }, [pushToast, today]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  function openCompleteModal(h: HabitRow): void {
    setSelectedHabit(h);
    setOpenComplete(true);
  }

  const alreadyCompleted = selectedHabit ? completedToday.has(selectedHabit.id) : false;

  return (
    <div className="grid gap-6">
      <Card title="Habits" subtitle="Complete habits to grow your plants.">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {busy ? "Loading..." : `${habits.length} habit(s) • ${plants.length} plant(s)`}
          </div>

          <Button size="sm" onClick={() => setOpenCreate(true)}>
            New Habit
          </Button>
        </div>

        <div className="mt-4 grid gap-2">
          {habits.map((h) => {
            const done = completedToday.has(h.id);

            return (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
              >
                <div>
                  <div className="text-sm font-semibold">{h.title}</div>
                  <div className="text-xs text-slate-500">
                    {h.frequency} • +{h.xp_reward} XP
                    {done && <span className="ml-2 text-emerald-700 font-semibold">• Completed today</span>}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => openCompleteModal(h)}
                  disabled={!h.is_active || done || plants.length === 0}
                >
                  {done ? "Done" : "Complete"}
                </Button>
              </div>
            );
          })}

          {!busy && habits.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No habits yet. Create one!
            </div>
          )}

          {!busy && habits.length > 0 && plants.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You have habits, but no plants. Go to <span className="font-semibold">Plants</span> and create one first.
            </div>
          )}
        </div>
      </Card>

      <CreateHabitModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => void loadAll()}
      />

      <CompleteHabitModal
        open={openComplete}
        onClose={() => setOpenComplete(false)}
        habit={selectedHabit}
        plants={plants}
        todayISO={today}
        alreadyCompleted={alreadyCompleted}
        onCompleted={() => void loadAll()}
      />
    </div>
  );
}
