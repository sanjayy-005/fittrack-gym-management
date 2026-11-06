import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, box: "border-emerald-500/40", color: "text-emerald-400" },
  error: { icon: AlertTriangle, box: "border-red-500/40", color: "text-red-400" },
  info: { icon: Info, box: "border-brand-500/40", color: "text-brand-400" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((toast) => {
          const style = STYLES[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-ink-800 p-3 shadow-2xl ${style.box}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.color}`} />
              <p className="flex-1 text-sm text-ink-100">{toast.message}</p>
              <button type="button" className="text-ink-300 hover:text-ink-100" onClick={() => remove(toast.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
