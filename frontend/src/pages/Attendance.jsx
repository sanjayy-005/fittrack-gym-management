import { useState } from "react";
import { LogIn, LogOut, Trash2 } from "lucide-react";
import { attendanceApi } from "../api";
import AttendanceReport from "../components/attendance/AttendanceReport";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import MemberSelect from "../components/ui/MemberSelect";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import SearchInput from "../components/ui/SearchInput";
import { TableCard } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePagedList } from "../hooks/usePagedList";
import { ADMIN_STAFF } from "../utils/constants";
import { getErrorMessage, getFieldErrors } from "../utils/errors";
import { formatDate, formatDuration, formatTime, todayISO } from "../utils/format";

const TABS = [
  { id: "log", label: "Daily log" },
  { id: "report", label: "Reports" },
];

export default function Attendance() {
  const { user, can } = useAuth();
  const toast = useToast();
  const canDelete = can(...ADMIN_STAFF);
  const isTrainer = user.role === "TRAINER";

  const [tab, setTab] = useState("log");
  const [reportDays, setReportDays] = useState(30);
  const [filters, setFilters] = useState({ date: todayISO(), search: "", presence: "" });
  const [member, setMember] = useState(null);
  const [checkInError, setCheckInError] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (field) => (value) => setFilters((previous) => ({ ...previous, [field]: value }));
  const today = todayISO();

  const params = {
    date: filters.date,
    search: filters.search,
    still_inside: filters.presence === "inside" ? true : filters.presence === "left" ? false : "",
  };
  const list = usePagedList(attendanceApi.list, params, 10);

  const handleCheckIn = async () => {
    if (!member) {
      setCheckInError("Choose a member first.");
      return;
    }
    setCheckingIn(true);
    setCheckInError("");
    try {
      await attendanceApi.checkIn(member.id);
      toast.success(`${member.full_name} checked in.`);
      setMember(null);
      // Make sure the new visit is visible in the table below.
      setFilters((previous) => ({ ...previous, date: today, search: "", presence: "" }));
      list.reload();
    } catch (error) {
      setCheckInError(getFieldErrors(error).member || getErrorMessage(error));
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (record) => {
    setBusyId(record.id);
    try {
      await attendanceApi.checkOut(record.id);
      toast.success(`${record.member_name} checked out.`);
      list.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await attendanceApi.remove(toDelete.id);
      toast.success("Attendance record deleted.");
      setToDelete(null);
      list.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const dateLabel = filters.date ? (filters.date === today ? "today" : formatDate(filters.date)) : "all dates";

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={isTrainer ? "Check in and track your own members." : "Check members in, track visits and see how busy the gym is."}
      />

      <div className="mb-6 inline-flex rounded-xl border border-ink-700 bg-ink-900 p-1" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              tab === item.id ? "bg-brand-500 text-ink-950" : "text-ink-200 hover:text-ink-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "report" ? (
        <AttendanceReport days={reportDays} onDaysChange={setReportDays} />
      ) : (
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Check in a member</h2>
            <p className="mb-4 text-xs text-ink-300">Only members with an active membership can check in, once per day.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1">
                <MemberSelect
                  selected={member}
                  onSelect={(next) => {
                    setMember(next);
                    setCheckInError("");
                  }}
                  error={checkInError}
                  disabled={checkingIn}
                />
                {checkInError && <p className="mt-1 text-xs text-red-400">{checkInError}</p>}
              </div>
              <Button onClick={handleCheckIn} loading={checkingIn} disabled={!member}>
                <LogIn className="h-4 w-4" /> Check in
              </Button>
            </div>
          </section>

          <div>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="date"
                className="input"
                value={filters.date}
                max={today}
                onChange={(event) => setFilter("date")(event.target.value)}
                aria-label="Filter by date"
              />
              <SearchInput value={filters.search} onChange={setFilter("search")} placeholder="Search member" />
              <select className="input" value={filters.presence} onChange={(event) => setFilter("presence")(event.target.value)} aria-label="Filter by presence">
                <option value="">Inside and left</option>
                <option value="inside">Still inside</option>
                <option value="left">Checked out</option>
              </select>
              <Button variant="secondary" onClick={() => setFilter("date")(today)} disabled={filters.date === today}>
                Show today
              </Button>
            </div>

            <TableCard
              loading={list.loading}
              error={list.error}
              onRetry={list.reload}
              itemCount={list.items.length}
              emptyTitle="No visits found"
              emptyText={`There are no check-ins for ${dateLabel} with these filters.`}
              footer={<Pagination page={list.page} pageSize={list.pageSize} count={list.count} onChange={list.setPage} />}
            >
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Duration</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((record) => {
                    const isToday = record.date === today;
                    return (
                      <tr key={record.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={record.member_name} size="sm" />
                            <div>
                              <p className="font-semibold text-ink-100">{record.member_name}</p>
                              <p className="text-xs text-ink-300">{record.member_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap">{formatDate(record.date)}</td>
                        <td className="whitespace-nowrap">{formatTime(record.check_in)}</td>
                        <td className="whitespace-nowrap">
                          {record.check_out ? formatTime(record.check_out) : isToday ? <Badge tone="green">Inside</Badge> : <Badge>Not recorded</Badge>}
                        </td>
                        <td className="whitespace-nowrap">{formatDuration(record.duration_minutes)}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            {!record.check_out && isToday && (
                              <Button size="sm" variant="secondary" loading={busyId === record.id} onClick={() => handleCheckOut(record)}>
                                <LogOut className="h-3.5 w-3.5" /> Check out
                              </Button>
                            )}
                            {canDelete && (
                              <button type="button" className="icon-btn hover:!text-red-400" aria-label="Delete record" onClick={() => setToDelete(record)}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableCard>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete attendance record?"
        message={toDelete ? `This removes ${toDelete.member_name}'s visit on ${formatDate(toDelete.date)}. The member will be able to check in again for that day.` : ""}
        confirmLabel="Delete record"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
