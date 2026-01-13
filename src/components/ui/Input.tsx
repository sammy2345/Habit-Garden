import type { InputHTMLAttributes, JSX } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputProps): JSX.Element {
  const inputId = id ?? props.name ?? undefined;

  return (
    <label className="grid gap-1">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}

      <input
        id={inputId}
        className={cx(
          "rounded-xl border bg-white px-3 py-2 text-sm outline-none",
          "border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className
        )}
        {...props}
      />

      {error && <span className="text-xs text-rose-700">{error}</span>}
    </label>
  );
}
