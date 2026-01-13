import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, type JSX } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/toast";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export default function AppLayout(): JSX.Element {
  const nav = useNavigate();
  const { pushToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const u = data.session?.user ?? null;
      setUser(u);

      if (!u) nav("/auth", { replace: true });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) nav("/auth", { replace: true });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  async function signOut(): Promise<void> {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      nav("/auth", { replace: true });
    } catch (e: unknown) {
      pushToast({
        tone: "error",
        title: "Sign out failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <Link to="/app" className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                <span className="text-xl">🌱</span>
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">Habit Garden</div>
                <div className="text-xs text-slate-500 leading-tight">Grow by doing</div>
              </div>
            </Link>

            <nav className="mt-6 grid gap-1">
              <NavItem to="/app" end label="Dashboard" icon="🏡" />
              <NavItem to="/app/habits" label="Habits" icon="✅" />
              <NavItem to="/app/plants" label="Plants" icon="🪴" />
            </nav>

            <div className="mt-6 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Signed in as
              </div>
              <div className="mt-1 truncate text-sm font-semibold">
                {user?.email ?? "(loading...)"}
              </div>
            </div>

            <Button
              variant="ghost"
              className="mt-4 w-full justify-center"
              onClick={() => void signOut()}
              loading={busy}
            >
              Sign out
            </Button>
          </aside>

          {/* Main */}
          <div className="grid gap-6">
            {/* Topbar */}
            <header className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Habit Garden
                  </div>
                  <div className="text-lg font-semibold">Welcome back</div>
                </div>

                <Link to="/app/habits">
                  <Button size="sm">Complete a habit</Button>
                </Link>
              </div>
            </header>

            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}): JSX.Element {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200"
            : "text-slate-700 hover:bg-slate-100"
        )
      }
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
