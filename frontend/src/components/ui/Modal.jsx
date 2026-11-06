import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

// Open modals, top-most last. Only the top-most one reacts to the Escape key.
const modalStack = [];
let savedOverflow = "";

export default function Modal({ open = true, title, subtitle, onClose, children, footer, size = "md" }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const id = Symbol("modal");
    if (modalStack.length === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    modalStack.push(id);

    const onKey = (event) => {
      if (event.key === "Escape" && modalStack[modalStack.length - 1] === id) closeRef.current?.();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      modalStack.splice(modalStack.indexOf(id), 1);
      if (modalStack.length === 0) document.body.style.overflow = savedOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex max-h-[92vh] w-full ${SIZES[size]} flex-col rounded-t-2xl border border-ink-600 bg-ink-800 shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink-100">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-300">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-ink-700 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
