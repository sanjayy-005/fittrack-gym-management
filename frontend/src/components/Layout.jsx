import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BadgeCheck, CalendarCheck, CreditCard, Dumbbell, Layers, LayoutDashboard, LogOut, Menu, UserCog, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ADMIN_ONLY, ADMIN_STAFF, ALL_ROLES, ROLE_LABELS } from "../utils/constants";
import Avatar from "./ui/Avatar";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES, end: true },
  { to: "/members", label: "Members", icon: Users, roles: ALL_ROLES },
  { to: "/trainers", label: "Trainers", icon: Dumbbell, roles: ADMIN_STAFF },
  { to: "/plans", label: "Plans", icon: Layers, roles: ALL_ROLES },
  { to: "/memberships", label: "Memberships", icon: BadgeCheck, roles: ALL_ROLES },
  { to: "/payments", label: "Payments", icon: CreditCard, roles: ADMIN_STAFF },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ALL_ROLES },
  { to: "/users", label: "User accounts", icon: UserCog, roles: ADMIN_ONLY },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-ink-950 shadow-glow">
        <Dumbbell className="h-5 w-5" />
      </span>
      <span className="font-display text-3xl font-bold uppercase tracking-wider text-ink-100">
        Fit<span className="text-brand-500">Track</span>
      </span>
    </div>
  );
}

function SidebarContent({ items, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              isActive ? "bg-brand-500 text-ink-950 shadow-glow" : "text-ink-200 hover:bg-ink-700 hover:text-ink-100"
            }`
          }
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const items = NAV.filter((item) => item.roles.includes(user.role));

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    toast.info("You have been logged out.");
  };

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-700 bg-ink-900 px-4 py-6 lg:flex">
        <div className="mb-8 px-2">
          <Brand />
        </div>
        <SidebarContent items={items} />
        <p className="mt-auto px-2 text-xs text-ink-400">FitTrack Gym Management</p>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-ink-700 bg-ink-900 px-4 py-6">
            <div className="mb-8 flex items-center justify-between px-2">
              <Brand />
              <button type="button" className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent items={items} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-700 bg-ink-950/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <button type="button" className="icon-btn lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-ink-100">{user.full_name}</p>
            <p className="text-xs text-brand-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <Avatar name={user.full_name} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout} disabled={loggingOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
