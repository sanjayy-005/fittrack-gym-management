import { Link } from "react-router-dom";

/** Number tile used on the dashboard and report screens. `to` makes the whole tile a link. */
export default function StatCard({ icon: Icon, label, value, hint, to, accent = false }) {
  const content = (
    <div
      className={`card h-full p-5 transition ${to ? "hover:border-brand-500/60 hover:shadow-glow" : ""} ${
        accent ? "border-brand-500/40 bg-gradient-to-br from-brand-500/15 to-ink-800" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="label !mb-0">{label}</p>
        {Icon && (
          <span className="rounded-xl bg-brand-500/15 p-2 text-brand-400">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-4xl font-bold tracking-wide text-ink-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-300">{hint}</p>}
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}
