import { useState, type JSX } from "react";
import { supabase } from "../../lib/supabaseClient";
import { requireUser } from "../../lib/auth";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/toast";


type Frequency = "daily" | "weekly";

type CreateHabitModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; // refresh list
};

export function CreateHabitModal({
  open,
  onClose,
  onCreated,
}: CreateHabitModalProps): JSX.Element {
  const { pushToast } = useToast();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [xpReward, setXpReward] = useState<number>(5);
  const [busy, setBusy] = useState<boolean>(false);

  function reset(): void {
    setTitle("");
    setDescription("");
    setFrequency("daily");
    setXpReward(5);
  }

  async function createHabit(): Promise<void> {
    if (!title.trim()) {
      pushToast({ tone: "error", title: "Missing title", message: "Enter a habit name." });
      return;
    }
    if (!Number.isFinite(xpReward) || xpReward < 0 || xpReward > 1000) {
      pushToast({ tone: "error", title: "Bad XP value", message: "Use a number between 0 and 1000." });
      return;
    }

    setBusy(true);
    try {
      const user = await requireUser();

      const { error } = await supabase.from("habits").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        frequency,
        xp_reward: Math.floor(xpReward),
        is_active: true,
      });

      if (error) throw error;

      pushToast({ tone: "success", title: "Habit created", message: `"${title.trim()}" added.` });
      reset();
      onClose();
      onCreated?.();
    } catch (e: unknown) {
      pushToast({
        tone: "error",
        title: "Create habit failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Create a habit"
      description="Habits give XP when completed."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void createHabit()} loading={busy}>
            Create
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Input
          label="Title"
          placeholder="Drink water"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Description (optional)"
          placeholder="8 cups today"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Frequency</span>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">XP Reward</span>
          <input
            type="number"
            min={0}
            max={1000}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
          />
        </label>
      </div>
    </Modal>
  );
}
