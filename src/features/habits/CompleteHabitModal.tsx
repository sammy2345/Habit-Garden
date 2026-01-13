import { useMemo, useState, type JSX } from "react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../components/ui/toast";

type PlantRow = {
  id: string;
  name: string;
  stage: number;
  xp: number;
};

type HabitRow = {
  id: string;
  title: string;
  xp_reward: number;
  frequency: "daily" | "weekly";
  is_active: boolean;
};

type CompleteHabitModalProps = {
  open: boolean;
  onClose: () => void;

  habit: HabitRow | null;
  plants: PlantRow[];
  todayISO: string; // yyyy-mm-dd

  alreadyCompleted: boolean;
  onCompleted: () => void; // refresh caller state
};

export function CompleteHabitModal({
  open,
  onClose,
  habit,
  plants,
  todayISO,
  alreadyCompleted,
  onCompleted,
}: CompleteHabitModalProps): JSX.Element {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<boolean>(false);
  const [plantId, setPlantId] = useState<string>("");

  const defaultPlantId = useMemo(() => plants[0]?.id ?? "", [plants]);

  // When modal opens and we don't have a selection yet, pick the first plant.
  // (No useEffect needed; we can compute a "selected" id deterministically.)
  const selectedPlantId = plantId || defaultPlantId;
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) ?? null;

  const xpPreview = useMemo(() => {
    if (!habit || !selectedPlant) return null;
    return {
      fromXP: selectedPlant.xp,
      toXP: selectedPlant.xp + habit.xp_reward,
      // Your DB trigger sets stage = floor(xp / 25)
      fromStage: Math.floor(selectedPlant.xp / 25),
      toStage: Math.floor((selectedPlant.xp + habit.xp_reward) / 25),
    };
  }, [habit, selectedPlant]);

  async function submit(): Promise<void> {
    if (!habit) return;
    if (alreadyCompleted) return;

    if (!selectedPlantId) {
      pushToast({
        tone: "error",
        title: "No plant available",
        message: "Create a plant first.",
      });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.rpc("complete_habit", {
        p_habit_id: habit.id,
        p_plant_id: selectedPlantId,
        p_completed_on: todayISO,
      });

      if (error) throw error;

      pushToast({
        tone: "success",
        title: "Habit completed",
        message: selectedPlant
          ? `+${habit.xp_reward} XP to ${selectedPlant.name}`
          : `+${habit.xp_reward} XP`,
      });

      // reset local selection for next time (optional)
      setPlantId("");

      onClose();
      onCompleted();
    } catch (e: unknown) {
      pushToast({
        tone: "error",
        title: "Complete failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  const disableAction =
    !habit || !habit.is_active || plants.length === 0 || alreadyCompleted || busy;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={habit ? `Complete: ${habit.title}` : "Complete habit"}
      description="Choose which plant gets the XP."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={disableAction} loading={busy}>
            {alreadyCompleted ? "Already done" : "Complete"}
          </Button>
        </>
      }
    >
      {!habit ? (
        <div className="text-sm text-slate-600">No habit selected.</div>
      ) : plants.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          You don’t have any plants yet. Go to <span className="font-semibold">Plants</span> and create one first.
        </div>
      ) : (
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Award XP to</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={selectedPlantId}
              onChange={(e) => setPlantId(e.target.value)}
              disabled={busy}
            >
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stage {p.stage})
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Reward
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              +{habit.xp_reward} XP
              <span className="ml-2 text-xs font-medium text-slate-500">
                • {habit.frequency}
              </span>
            </div>

            {alreadyCompleted && (
              <div className="mt-2 text-sm font-semibold text-emerald-700">
                Completed today ✅
              </div>
            )}
          </div>

          {xpPreview && selectedPlant && (
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
              <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Preview
              </div>
              <div className="mt-1 text-sm text-emerald-900">
                <span className="font-semibold">{selectedPlant.name}</span>
                <div className="mt-1 text-sm">
                  XP: <span className="font-semibold">{xpPreview.fromXP}</span> →{" "}
                  <span className="font-semibold">{xpPreview.toXP}</span>
                </div>
                <div className="text-sm">
                  Stage:{" "}
                  <span className="font-semibold">{xpPreview.fromStage}</span> →{" "}
                  <span className="font-semibold">{xpPreview.toStage}</span>
                  {xpPreview.toStage > xpPreview.fromStage && (
                    <span className="ml-2 font-semibold">🎉 Level up!</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
