import { useEffect, useMemo, useState, type JSX} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/toast";
import { useNavigate } from "react-router-dom";

type AuthMode = "signed_out" | "signed_in";

export default function AuthPage(): JSX.Element {
  const nav = useNavigate();
  const { pushToast } = useToast();

  const [email, setEmail] = useState<string>("");
  const [pw, setPw] = useState<string>("");

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const mode: AuthMode = useMemo(() => (user ? "signed_in" : "signed_out"), [user]);
  const signedIn = mode === "signed_in";
  const canAuth = email.trim().length > 0 && pw.length >= 6;

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        pushToast({ tone: "error", title: "Session error", message: error.message });
        return;
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);

      // If already signed in, go to app
      if (data.session?.user) nav("/app", { replace: true });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) nav("/app", { replace: true });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [nav, pushToast]);

  async function signUp(): Promise<void> {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: pw });
      if (error) throw error;

      if (!data.user) {
        pushToast({
          tone: "info",
          title: "Check your email",
          message: "You may need to confirm your email before signing in.",
        });
        return;
      }

      pushToast({ tone: "success", title: "Signed up", message: "Welcome!" });
      nav("/app", { replace: true });
    } catch (e: unknown) {
      pushToast({
        tone: "error",
        title: "Sign up failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function signIn(): Promise<void> {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;

      setSession(data.session);
      setUser(data.user);

      pushToast({ tone: "success", title: "Signed in", message: "Loading your garden..." });
      nav("/app", { replace: true });
    } catch (e: unknown) {
      pushToast({
        tone: "error",
        title: "Sign in failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                <span className="text-xl">🌱</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Habit Garden</h1>
            </div>
            <p className="mt-2 text-sm text-slate-600">Sign in to grow your garden.</p>
          </div>

          <Badge tone={signedIn ? "success" : "neutral"}>
            {signedIn ? "Signed in" : "Signed out"}
          </Badge>
        </header>

        <main className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="Account" subtitle="Use email + password to sign in.">
            <div className="grid gap-3">
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
              />
              <Input
                label="Password"
                placeholder="••••••"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="current-password"
              />

              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void signUp()} disabled={!canAuth} loading={busy}>
                  Sign up
                </Button>
                <Button onClick={() => void signIn()} disabled={!canAuth} loading={busy}>
                  Sign in
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Session: {session ? "yes" : "no"}
              </p>
            </div>
          </Card>

          <Card
            title="Welcome to Habiy Garden"
            subtitle="A garden that grows when you complete habits."
          >
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
              <li>Create habits (daily/weekly) with XP rewards</li>
              <li>Complete habits to gain XP</li>
              <li>Plant stages level up automatically from XP</li>
              <li>Streaks + decay (future implementation)</li>
              <li>Sign in using supabase</li>
            </ul>
          </Card>
        </main>
      </div>
    </div>
  );
}
