import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/ui/toast";
import { CompleteHabitModal } from "../features/habits/CompleteHabitModal";
import { Link } from "react-router-dom";
import { PlantVisual } from "../components/ui/PlantVisual";

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
  species: string;
  xp: number;
  stage: number;
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

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

const MAIN_PLANT_KEY = "habit-garden:mainPlantId";

export default function DashboardPage(): JSX.Element {
  const { pushToast } = useToast();

  const today = useMemo(() => isoToday(), []);
  const last7Start = useMemo(() => isoDaysAgo(6), []);

  const [busy, setBusy] = useState<boolean>(false);

  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  // last 7 days completion count (not a true streak yet, but feels good)
  const [last7Count, setLast7Count] = useState<number>(0);

  // main plant selection (stored locally)
  const [mainPlantId, setMainPlantId] = useState<string>(() => {
    return localStorage.getItem(MAIN_PLANT_KEY) ?? "";
  });

  // Modal state
  const [completeOpen, setCompleteOpen] = useState<boolean>(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitRow | null>(null);

  const loadDashboard = useCallback(async () => {
    setBusy(true);

    const [habitsRes, plantsRes, completionsTodayRes, completions7Res] =
      await Promise.all([
        supabase
          .from("habits")
          .select("id,title,frequency,xp_reward,is_active")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("plants")
          .select("id,name,species,xp,stage")
          .order("created_at", { ascending: false }),

        supabase
          .from("habit_completions")
          .select("habit_id,completed_on")
          .eq("completed_on", today),

        supabase
          .from("habit_completions")
          .select("id", { count: "exact", head: true })
          .gte("completed_on", last7Start)
          .lte("completed_on", today),
      ]);

    setBusy(false);

    if (habitsRes.error) {
      pushToast({
        tone: "error",
        title: "Load habits failed",
        message: habitsRes.error.message,
      });
      return;
    }
    if (plantsRes.error) {
      pushToast({
        tone: "error",
        title: "Load plants failed",
        message: plantsRes.error.message,
      });
      return;
    }
    if (completionsTodayRes.error) {
      pushToast({
        tone: "error",
        title: "Load completions failed",
        message: completionsTodayRes.error.message,
      });
      return;
    }
    if (completions7Res.error) {
      pushToast({
        tone: "error",
        title: "Load stats failed",
        message: completions7Res.error.message,
      });
      return;
    }

    const h = (habitsRes.data ?? []) as HabitRow[];
    const p = (plantsRes.data ?? []) as PlantRow[];
    const c = (completionsTodayRes.data ?? []) as CompletionRow[];

    setHabits(h);
    setPlants(p);
    setCompletedToday(new Set(c.map((x) => x.habit_id)));
    setLast7Count(completions7Res.count ?? 0);

    // If no saved main plant, default to highest XP
    if (!mainPlantId && p.length > 0) {
      const top = [...p].sort((a, b) => b.xp - a.xp)[0];
      setMainPlantId(top.id);
      localStorage.setItem(MAIN_PLANT_KEY, top.id);
    }

    // If saved plant no longer exists, fallback
    if (mainPlantId && p.length > 0 && !p.some((x) => x.id === mainPlantId)) {
      const top = [...p].sort((a, b) => b.xp - a.xp)[0];
      setMainPlantId(top.id);
      localStorage.setItem(MAIN_PLANT_KEY, top.id);
    }
  }, [pushToast, today, last7Start, mainPlantId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const mainPlant = useMemo(() => {
    if (plants.length === 0) return null;
    return plants.find((p) => p.id === mainPlantId) ?? null;
  }, [plants, mainPlantId]);

  // XP bar math: stage = floor(xp / 25)
  const xpPerStage = 25;
  const plantProgress = useMemo(() => {
    if (!mainPlant) return null;

    const stageFromXp = Math.floor(mainPlant.xp / xpPerStage);
    const stage = Number.isFinite(mainPlant.stage)
      ? mainPlant.stage
      : stageFromXp;

    const stageStartXp = stage * xpPerStage;
    const nextStageXp = (stage + 1) * xpPerStage;

    const withinStage = mainPlant.xp - stageStartXp;
    const pct = clamp01(withinStage / xpPerStage);

    return { stage, stageStartXp, nextStageXp, withinStage, pct };
  }, [mainPlant]);

  const alreadyCompleted = selectedHabit
    ? completedToday.has(selectedHabit.id)
    : false;

  function openComplete(h: HabitRow): void {
    setSelectedHabit(h);
    setCompleteOpen(true);
  }

  const doneCount = habits.filter((h) => completedToday.has(h.id)).length;
  const totalCount = habits.length;

  function setMainPlant(id: string): void {
    setMainPlantId(id);
    localStorage.setItem(MAIN_PLANT_KEY, id);
  }

  return (
    <div className="grid gap-6">
      {/* Main Plant */}
      <Card
        title="Main Plant"
        subtitle="Choose your focus plant and level it up."
      >
        {plants.length === 0 || !mainPlant || !plantProgress ? (
          <div className="grid gap-3">
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No plants yet. Create one to start growing.
            </div>
            <Link to="/app/plants">
              <Button size="sm">Go to Plants</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Selector */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <label className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Main plant
                </span>
                <select
                  className="min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  value={mainPlantId}
                  onChange={(e) => setMainPlant(e.target.value)}
                >
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stage {p.stage})
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-2">
                <Badge tone="neutral">{`7-day: ${last7Count} done`}</Badge>
                <Badge tone="success">{`Stage ${plantProgress.stage}`}</Badge>
                <div className="flex items-center gap-4">
                  <PlantVisual stage={plantProgress.stage} size={160} />
                  <div>
                    <div className="text-lg font-semibold">
                      {mainPlant.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {mainPlant.species} • {mainPlant.xp} XP
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plant info */}
            <div>
              <div className="text-lg font-semibold">{mainPlant.name}</div>
              <div className="text-sm text-slate-600">
                {mainPlant.species} • {mainPlant.xp} XP
              </div>
            </div>

            {/* XP progress bar */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>
                  {plantProgress.withinStage}/{xpPerStage} XP to next stage
                </span>
                <span>
                  {plantProgress.stageStartXp} → {plantProgress.nextStageXp}
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.round(plantProgress.pct * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/app/habits">
                <Button size="sm">Complete habits</Button>
              </Link>
              <Link to="/app/plants">
                <Button size="sm" variant="secondary">
                  View plants
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* Today’s Habits */}
      <Card title="Today" subtitle="Quick actions for your daily progress.">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {busy ? "Loading..." : `${doneCount}/${totalCount} completed today`}
          </div>
          <Link to="/app/habits">
            <Button size="sm" variant="secondary">
              Manage habits
            </Button>
          </Link>
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
                    +{h.xp_reward} XP • {h.frequency}
                    {done && (
                      <span className="ml-2 font-semibold text-emerald-700">
                        • Done
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => openComplete(h)}
                  disabled={done || plants.length === 0}
                >
                  {done ? "Done" : "Complete"}
                </Button>
              </div>
            );
          })}

          {!busy && habits.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No habits yet. Create your first habit!
              <div className="mt-3">
                <Link to="/app/habits">
                  <Button size="sm">Go to Habits</Button>
                </Link>
              </div>
            </div>
          )}

          {!busy && habits.length > 0 && plants.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You have habits, but no plants yet. Create a plant first so XP has
              somewhere to go.
              <div className="mt-3">
                <Link to="/app/plants">
                  <Button size="sm">Go to Plants</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Complete Habit modal */}
      <CompleteHabitModal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        habit={selectedHabit}
        plants={plants}
        todayISO={today}
        alreadyCompleted={alreadyCompleted}
        onCompleted={() => void loadDashboard()}
      />
    </div>
  );
}
