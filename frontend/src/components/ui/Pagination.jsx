import { ChevronLeft, ChevronRight } from "lucide-react";

/** Page controls for a paginated list. Renders nothing when there are no rows. */
export default function Pagination({ page, pageSize, count, onChange }) {
  if (!count) return null;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  // Show up to 5 page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = [];
  for (let p = start; p <= Math.min(totalPages, start + 4); p += 1) pages.push(p);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-700 px-4 py-3 text-sm text-ink-300 sm:flex-row">
      <p>
        Showing <span className="font-semibold text-ink-100">{from}</span>-<span className="font-semibold text-ink-100">{to}</span> of{" "}
        <span className="font-semibold text-ink-100">{count}</span>
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
              p === page ? "bg-brand-500 text-ink-950" : "text-ink-200 hover:bg-ink-600"
            }`}
          >
            {p}
          </button>
        ))}
        <button type="button" className="icon-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
