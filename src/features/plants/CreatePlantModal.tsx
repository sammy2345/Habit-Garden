import { useState, type JSX } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/toast";

type CreatePlantModalProps = {
  open: boolean;
  onClose: () => void;
  gardenId: string;        // required for insert
  onCreated?: () => void;  // refresh list
};

export function CreatePlantModal({
  open,
  onClose,
  gardenId,
  onCreated,
}: CreatePlantModalProps): JSX.Element {
  const { pushToast } = useToast();

  const [name, setName] = useState<string>("");
  const [species, setSpecies] = useState<string>("sprout");
  const [busy, setBusy] = useState<boolean>(false);

  function reset(): void {
    setName("");
    setSpecies("sprout");
  }

  async function createPlant(): Promise<void> {
    if (!name.trim()) {
      pushToast({ tone: "error", title: "Missing name", message: "Name your plant." });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("plants").insert({
        garden_id: gardenId,
        name: name.trim(),
        species: species.trim() || "sprout",
        xp: 0,
        stage: 0, // your trigger will normalize this anyway
        is_dead: false,
      });

      if (error) throw error;

      pushToast({ tone: "success", title: "Plant created", message: `"${name.trim()}" planted.` });
      reset();
      onClose();
      onCreated?.();
    } catch (e: unknown) {
      pushToast({
        tone: "error",
        title: "Create plant failed",
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
      title="Create a plant"
      description="Plants level up when you complete habits."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void createPlant()} loading={busy}>
            Plant
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Input
          label="Plant name"
          placeholder="Cactus Jack"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Species (optional)"
          placeholder="cactus"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        />
      </div>
    </Modal>
  );
}
