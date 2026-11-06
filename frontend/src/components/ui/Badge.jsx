const TONES = {
  green: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  red: "bg-red-500/15 text-red-300 ring-red-500/30",
  orange: "bg-brand-500/15 text-brand-300 ring-brand-500/30",
  blue: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  gray: "bg-ink-600/60 text-ink-200 ring-ink-500/60",
};

export default function Badge({ tone = "gray", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS = {
  ACTIVE: ["green", "Active"],
  EXPIRING: ["amber", "Expiring"],
  EXPIRED: ["red", "Expired"],
  CANCELLED: ["gray", "Cancelled"],
  NONE: ["gray", "No plan"],
  PAID: ["green", "Paid"],
  PENDING: ["amber", "Pending"],
  REFUNDED: ["blue", "Refunded"],
};

/** Colored pill for membership / payment statuses. Pass daysLeft to flag memberships ending within a week. */
export function StatusBadge({ status, daysLeft }) {
  const key = status === "ACTIVE" && daysLeft != null && daysLeft <= 7 ? "EXPIRING" : status;
  const [tone, label] = STATUS[key] || ["gray", status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ActiveBadge({ active }) {
  return active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>;
}
