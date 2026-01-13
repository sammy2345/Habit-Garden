import React, { createContext, useCallback, useContext, useMemo, useState, type JSX } from "react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
};

type ToastContextValue = {
  pushToast: (t: Omit<Toast, "id">, ms?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function toneClasses(tone: ToastTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (t: Omit<Toast, "id">, ms: number = 2500) => {
      const id = crypto.randomUUID();
      const toast: Toast = { id, ...t };
      setToasts((prev) => [toast, ...prev]);

      window.setTimeout(() => remove(id), ms);
    },
    [remove]
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div className="fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "rounded-2xl border p-4 shadow-sm ring-1 ring-black/0",
              toneClasses(t.tone)
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{t.title}</div>
                {t.message && <div className="mt-1 text-sm opacity-80">{t.message}</div>}
              </div>
              <button
                className="rounded-lg px-2 py-1 text-xs font-medium hover:bg-black/5"
                onClick={() => remove(t.id)}
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
