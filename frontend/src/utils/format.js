/** Formatting helpers for money, dates and names. */

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

/** Compact money for chart axes: 12500 -> "₹12.5k". */
export function formatCompactCurrency(value) {
  const number = Number(value || 0);
  if (number >= 100000) return `₹${(number / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (number >= 1000) return `₹${(number / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${number}`;
}

// The API sends dates as "YYYY-MM-DD". Building the Date from its parts avoids timezone shifts.
function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** "07:45:12" -> "07:45 AM" */
export function formatTime(value) {
  if (!value) return "-";
  const [hours, minutes] = String(value).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "-";
  const suffix = hours >= 12 ? "PM" : "AM";
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(twelve).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes) {
  if (minutes == null) return "-";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Today's date in the user's own timezone as "YYYY-MM-DD" (what the API expects). */
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function formatDaysLeft(days) {
  if (days == null) return "-";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Ends today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
