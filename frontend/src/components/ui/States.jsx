import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import Button from "./Button";

export function Spinner({ className = "h-5 w-5" }) {
  return <Loader2 className={`animate-spin text-brand-500 ${className}`} />;
}

export function PageLoader({ fullScreen = false, label = "Loading..." }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-ink-300 ${fullScreen ? "min-h-screen" : "py-16"}`}>
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <div className="rounded-full bg-red-500/10 p-3">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <p className="max-w-md text-sm text-ink-200">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", text, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <div className="rounded-full bg-ink-700 p-3">
        <Inbox className="h-6 w-6 text-ink-300" />
      </div>
      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-ink-100">{title}</h3>
      {text && <p className="max-w-sm text-sm text-ink-300">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * Card that wraps a table and takes care of the loading / error / empty states.
 * `itemCount` is the number of rows currently loaded.
 */
export function TableCard({ loading, error, onRetry, itemCount, emptyTitle, emptyText, emptyAction, footer, children }) {
  let body;
  if (error && itemCount === 0) body = <ErrorState message={error} onRetry={onRetry} />;
  else if (loading && itemCount === 0) body = <PageLoader />;
  else if (itemCount === 0) body = <EmptyState title={emptyTitle} text={emptyText} action={emptyAction} />;
  else {
    body = (
      <>
        {error && (
          <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}{" "}
            <button type="button" className="underline" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}
        <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>{children}</div>
      </>
    );
  }
  return (
    <div className="card overflow-hidden">
      {body}
      {footer}
    </div>
  );
}
