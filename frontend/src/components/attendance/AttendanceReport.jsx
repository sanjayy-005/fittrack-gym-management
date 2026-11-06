import { Activity, CalendarCheck, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { attendanceApi } from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/format";
import Avatar from "../ui/Avatar";
import StatCard from "../ui/StatCard";
import { ErrorState, PageLoader } from "../ui/States";

const tooltipProps = {
  contentStyle: { background: "#16161a", border: "1px solid #2a2a32", borderRadius: 12, color: "#e4e4ea" },
  labelStyle: { color: "#b4b4be" },
  itemStyle: { color: "#e4e4ea" },
  cursor: { fill: "rgba(255,106,13,0.08)" },
};
const axisProps = { stroke: "#5c5c68", tick: { fontSize: 12, fill: "#8a8a96" }, tickLine: false, axisLine: false };

const RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

const shortDate = (value) => formatDate(value).slice(0, 6); // "04 Nov"
const hourLabel = (hour) => `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? "PM" : "AM"}`;

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="card p-5">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide">{title}</h2>
      <p className="mb-4 text-xs text-ink-300">{subtitle}</p>
      {children}
    </section>
  );
}

/** Attendance report: visits per day, busiest hours and most regular members. */
export default function AttendanceReport({ days, onDaysChange }) {
  const { data, loading, error, reload } = useFetch(() => attendanceApi.report(days), [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-300">
          {data ? `${formatDate(data.start_date)} to ${formatDate(data.end_date)}` : "Loading report..."}
        </p>
        <select className="input !w-auto" value={days} onChange={(event) => onDaysChange(Number(event.target.value))} aria-label="Report period">
          {RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {loading && !data && <PageLoader />}
      {error && !data && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarCheck} label="Total visits" value={data.total_visits} accent />
            <StatCard icon={Users} label="Unique members" value={data.unique_members} />
            <StatCard icon={Activity} label="Average per day" value={data.average_per_day} />
          </div>

          <ChartCard title="Visits per day" subtitle="How many members checked in each day.">
            {data.total_visits === 0 ? (
              <p className="py-16 text-center text-sm text-ink-300">No check-ins in this period yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.daily} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6a0d" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#ff6a0d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2a2a32" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} interval="preserveStartEnd" minTickGap={28} {...axisProps} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip {...tooltipProps} labelFormatter={(value) => formatDate(value)} formatter={(value) => [value, "Visits"]} />
                  <Area type="monotone" dataKey="count" stroke="#ff6a0d" strokeWidth={2} fill="url(#visitsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCard title="Peak hours" subtitle="Check-ins by hour of the day.">
                {data.total_visits === 0 ? (
                  <p className="py-16 text-center text-sm text-ink-300">No data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.peak_hours} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#2a2a32" vertical={false} />
                      <XAxis dataKey="hour" tickFormatter={hourLabel} interval={1} {...axisProps} />
                      <YAxis allowDecimals={false} {...axisProps} />
                      <Tooltip {...tooltipProps} labelFormatter={hourLabel} formatter={(value) => [value, "Check-ins"]} />
                      <Bar dataKey="count" fill="#ff6a0d" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <ChartCard title="Most regular" subtitle="Members with the most visits.">
              {data.top_members.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-300">No visits yet.</p>
              ) : (
                <ol className="space-y-3">
                  {data.top_members.map((member, index) => (
                    <li key={member.member} className="flex items-center gap-3">
                      <span className="w-5 text-center font-display text-lg font-bold text-brand-400">{index + 1}</span>
                      <Avatar name={member.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-100">{member.name}</p>
                        <p className="text-xs text-ink-300">{member.code}</p>
                      </div>
                      <span className="text-sm font-semibold text-ink-100">{member.visits}</span>
                    </li>
                  ))}
                </ol>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
