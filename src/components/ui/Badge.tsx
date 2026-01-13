import type { JSX } from "react";

type Tone = "success" | "neutral" | "warning";

export type BadgeProps = {
  tone?: Tone;
  children: string;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const tones: Record<Tone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  neutral: "bg-slate-100 text-slate-700",
  warning: "bg-amber-100 text-amber-800",
};

export function Badge({ tone = "neutral", children }: BadgeProps): JSX.Element {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
