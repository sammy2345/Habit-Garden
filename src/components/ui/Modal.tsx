import { useEffect, type JSX } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps): JSX.Element | null {
  // Escape closes
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        aria-label="Close modal"
        className="absolute inset-0 h-full w-full bg-black/40"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cx(
            "w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-slate-200",
            "animate-in fade-in zoom-in-95"
          )}
        >
          {(title || description) && (
            <div className="border-b border-slate-200 p-5">
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {description && (
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              )}
            </div>
          )}

          <div className="p-5">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
