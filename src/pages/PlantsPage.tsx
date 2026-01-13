import { useCallback, useEffect, useState, type JSX } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/ui/toast";
import { CreatePlantModal } from "../features/plants/CreatePlantModal";
import { PlantVisual } from "../components/ui/PlantVisual";

type GardenRow = { id: string; name: string };
type PlantRow = {
  id: string;
  name: string;
  xp: number;
  stage: number;
  species: string;
};

export default function PlantsPage(): JSX.Element {
  const { pushToast } = useToast();

  const [open, setOpen] = useState(false);
  const [garden, setGarden] = useState<GardenRow | null>(null);
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [busy, setBusy] = useState<boolean>(false);

  const loadGardenAndPlants = useCallback(async () => {
    setBusy(true);

    const { data: g, error: gErr } = await supabase
      .from("gardens")
      .select("id,name")
      .single<GardenRow>();

    if (gErr) {
      setBusy(false);
      pushToast({
        tone: "error",
        title: "Load garden failed",
        message: gErr.message,
      });
      return;
    }

    setGarden(g);

    const { data: p, error: pErr } = await supabase
      .from("plants")
      .select("id,name,xp,stage,species")
      .order("created_at", { ascending: false });

    setBusy(false);

    if (pErr) {
      pushToast({
        tone: "error",
        title: "Load plants failed",
        message: pErr.message,
      });
      return;
    }

    setPlants((p ?? []) as PlantRow[]);
  }, [pushToast]);

  useEffect(() => {
    void loadGardenAndPlants();
  }, [loadGardenAndPlants]);

  return (
    <div className="grid gap-6">
      <Card
        title="Plants"
        subtitle="Plants level up automatically based on XP."
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {busy ? "Loading..." : `${plants.length} plant(s)`}
          </div>
          <Button size="sm" onClick={() => setOpen(true)} disabled={!garden}>
            New Plant
          </Button>
        </div>

        <div className="mt-4 grid gap-2">
          {plants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200"
            >
              <PlantVisual stage={p.stage} size={72} />
              <div>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-emerald-800/80">
                  {p.species} • Stage {p.stage} • {p.xp} XP
                </div>
              </div>
            </div>
          ))}

          {!busy && plants.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No plants yet. Plant one!
            </div>
          )}
        </div>
      </Card>

      {garden && (
        <CreatePlantModal
          open={open}
          onClose={() => setOpen(false)}
          gardenId={garden.id}
          onCreated={() => void loadGardenAndPlants()}
        />
      )}
    </div>
  );
}
