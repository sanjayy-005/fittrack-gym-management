import { Link } from "react-router-dom";
import { Activity, AlertTriangle, CalendarCheck, IndianRupee, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Avatar from "../components/ui/Avatar";
import Badge, { StatusBadge } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { ErrorState, PageLoader } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { dashboardApi } from "../api";
import { ADMIN_STAFF, CHART_COLORS } from "../utils/constants";
import { formatCompactCurrency, formatCurrency, formatDate, formatDaysLeft, greeting } from "../utils/format";

const tooltipProps = {
  contentStyle: { background: "#16161a", border: "1px solid #2a2a32", borderRadius: 12, color: "#e4e4ea" },
  labelStyle: { color: "#b4b4be" },
  itemStyle: { color: "#e4e4ea" },
  cursor: { fill: "rgba(255,106,13,0.08)" },
};
const axisProps = { stroke: "#5c5c68", tick: { fontSize: 12, fill: "#8a8a96" }, tickLine: false, axisLine: false };

function ChartCard({ title, subtitle, empty, children, className = "" }) {
  return (
    <section className={`card p-5 ${className}`}>
      <h2 className="font-display text-xl font-bold uppercase tracking-wide">{title}</h2>
      {subtitle && <p className="mb-4 text-xs text-ink-300">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>
        {empty ? <p className="py-16 text-center text-sm text-ink-300">No data to show yet.</p> : children}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user, can } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardApi.get(), []);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const { stats, finance, can_view_finance: showFinance } = data;
  const isTrainer = user.role === "TRAINER";
  const canRenew = can(...ADMIN_STAFF);

  let revenueChange = null;
  if (finance && finance.revenue_last_month > 0) {
    revenueChange = ((finance.revenue_this_month - finance.revenue_last_month) / finance.revenue_last_month) * 100;
  }

  const hasRevenue = showFinance && data.monthly_revenue.some((row) => row.revenue > 0);
  const hasVisits = data.attendance_trend.some((row) => row.count > 0);

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user.first_name || user.username}`}
        subtitle={
          isTrainer
            ? "Here is how your assigned members are doing."
            : new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        }
      />

      {/* ---- Key numbers ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label={isTrainer ? "My members" : "Total members"}
          value={stats.total_members}
          hint={`${stats.new_this_month} joined this month`}
          to="/members"
        />
        <StatCard
          icon={Activity}
          label="Active memberships"
          value={stats.active_members}
          hint={`${stats.expired_members} expired · ${stats.no_membership_members} without a plan`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Expiring in 7 days"
          value={stats.expiring_soon}
          hint="Renew them before they lapse"
          to={canRenew ? "/memberships?view=EXPIRING" : undefined}
        />
        <StatCard
          icon={CalendarCheck}
          label="Check-ins today"
          value={stats.today_checkins}
          hint={`${stats.currently_inside} inside right now`}
          to="/attendance"
        />
        {showFinance && (
          <>
            <StatCard
              accent
              icon={IndianRupee}
              label="Revenue this month"
              value={formatCurrency(finance.revenue_this_month)}
              hint={
                revenueChange == null
                  ? "No revenue last month to compare"
                  : `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(0)}% vs last month`
              }
              to="/payments"
            />
            <StatCard icon={Wallet} label="Revenue today" value={formatCurrency(finance.revenue_today)} hint={`${formatCurrency(finance.total_revenue)} all time`} />
            <StatCard icon={TrendingUp} label="Pending payments" value={formatCurrency(finance.pending_amount)} hint="Not yet collected" to="/payments?status=PENDING" />
            <StatCard icon={UserPlus} label="Active trainers" value={stats.total_trainers} to="/trainers" />
          </>
        )}
      </div>

      {/* ---- Charts ---- */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {showFinance && (
          <ChartCard title="Revenue" subtitle="Collected payments, last 6 months" empty={!hasRevenue} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={data.monthly_revenue} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="#2a2a32" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={formatCompactCurrency} />
                <Tooltip {...tooltipProps} formatter={(value) => [formatCurrency(value), "Revenue"]} />
                <Bar dataKey="revenue" fill="#ff6a0d" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <ChartCard
          title="Plan mix"
          subtitle="Active memberships by plan"
          empty={data.plan_distribution.length === 0}
          className={showFinance ? "" : "lg:col-span-1"}
        >
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={data.plan_distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                {data.plan_distribution.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#b4b4be" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Member growth" subtitle="Total members, last 6 months" empty={data.member_growth.every((row) => row.total === 0)} className={showFinance ? "lg:col-span-1" : "lg:col-span-1"}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.member_growth} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6a0d" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#ff6a0d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a32" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip {...tooltipProps} />
              <Area type="monotone" dataKey="total" name="Total members" stroke="#ff6a0d" strokeWidth={2} fill="url(#growthFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance" subtitle="Check-ins, last 14 days" empty={!hasVisits} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.attendance_trend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#2a2a32" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval={1} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip {...tooltipProps} formatter={(value) => [value, "Check-ins"]} />
              <Bar dataKey="count" fill="#ffa766" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ---- Lists ---- */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Expiring soon</h2>
            {canRenew && (
              <Link to="/memberships?view=EXPIRING" className="text-xs font-semibold text-brand-400 hover:underline">
                View all
              </Link>
            )}
          </div>
          {data.expiring_soon.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-300">No memberships are ending in the next 7 days.</p>
          ) : (
            <ul className="divide-y divide-ink-700">
              {data.expiring_soon.map((row) => (
                <li key={row.id} className="flex items-center gap-3 py-3">
                  <Avatar name={row.member_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.member_name}</p>
                    <p className="truncate text-xs text-ink-300">
                      {row.plan_name} · ends {formatDate(row.end_date)}
                    </p>
                  </div>
                  <Badge tone={row.days_left <= 2 ? "red" : "amber"}>{formatDaysLeft(row.days_left)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {showFinance ? (
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">Recent payments</h2>
              <Link to="/payments" className="text-xs font-semibold text-brand-400 hover:underline">
                View all
              </Link>
            </div>
            {data.recent_payments.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-300">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-ink-700">
                {data.recent_payments.map((payment) => (
                  <li key={payment.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{payment.member_name}</p>
                      <p className="truncate text-xs text-ink-300">
                        {payment.receipt_no} · {payment.method} · {formatDate(payment.paid_on)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                      <StatusBadge status={payment.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="card p-5">
            <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-wide">Newest members</h2>
            {data.recent_members.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-300">No members assigned to you yet.</p>
            ) : (
              <ul className="divide-y divide-ink-700">
                {data.recent_members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 py-3">
                    <Avatar name={member.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{member.full_name}</p>
                      <p className="text-xs text-ink-300">
                        {member.member_code} · joined {formatDate(member.joined_date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {showFinance && data.revenue_by_method.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-wide">This month by payment method</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.revenue_by_method.map((row) => (
              <div key={row.name} className="rounded-xl border border-ink-700 bg-ink-900 p-4">
                <p className="label !mb-1">{row.name}</p>
                <p className="font-display text-2xl font-bold">{formatCurrency(row.value)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
