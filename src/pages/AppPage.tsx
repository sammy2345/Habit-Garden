import { useEffect, useState, type JSX } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/toast";

type GardenRow = { id: string; name: string };

export default function AppPage(): JSX.Element {
  const nav = useNavigate();
  const { pushToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [garden, setGarden] = useState<GardenRow | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const u = data.session?.user ?? null;
      setUser(u);

      if (!u) {
        nav("/auth", { replace: true });
        return;
      }

      // Load garden
      setBusy(true);
      const { data: g, error } = await supabase.from("gardens").select("id,name").single<GardenRow>();
      setBusy(false);

      if (error) {
        pushToast({ tone: "error", title: "Failed to load garden", message: error.message });
        return;
      }
      setGarden(g);
    })();

    return () => {
      mounted = false;
    };
  }, [nav, pushToast]);

  async function signOut(): Promise<void> {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);

    if (error) {
      pushToast({ tone: "error", title: "Sign out failed", message: error.message });
      return;
    }
    nav("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-2xl font-bold tracking-tight">Your Garden</h1>
          </div>

          <Button variant="ghost" onClick={() => void signOut()} loading={busy}>
            Sign out
          </Button>
        </header>

        <main className="mt-8 grid gap-6">
          <Card title="Garden" subtitle="If this loads, your auth + RLS are working.">
            <div className="text-sm text-slate-700">
              <div><span className="font-semibold">User:</span> {user?.email ?? "(unknown)"}</div>
              <div className="mt-2">
                <span className="font-semibold">Garden:</span>{" "}
                {garden ? `${garden.name} (${garden.id})` : busy ? "Loading..." : "(not loaded)"}
              </div>
            </div>
          </Card>

          <Card title="Next" subtitle="We’ll add these right after routing.">
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
              <li>Create Plant modal</li>
              <li>Create Habit modal</li>
              <li>Habit list + Complete button (calls your RPC)</li>
            </ul>
          </Card>
        </main>
      </div>
    </div>
  );
}
