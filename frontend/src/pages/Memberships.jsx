import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ban, Plus, RefreshCw, Trash2 } from "lucide-react";
import { membershipsApi, plansApi } from "../api";
import RenewModal from "../components/memberships/RenewModal";
import SellMembershipModal from "../components/memberships/SellMembershipModal";
import Badge, { StatusBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import SearchInput from "../components/ui/SearchInput";
import { TableCard } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useFetch } from "../hooks/useFetch";
import { usePagedList } from "../hooks/usePagedList";
import { ADMIN_ONLY, ADMIN_STAFF } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { formatCurrency, formatDate, formatDaysLeft } from "../utils/format";

// Each tab becomes a set of API filters.
const VIEWS = [
  { key: "ALL", label: "All", params: {} },
  { key: "ACTIVE", label: "Active", params: { status: "ACTIVE" } },
  { key: "EXPIRING", label: "Expiring in 7 days", params: { expiring_in: 7 } },
  { key: "EXPIRED", label: "Expired", params: { status: "EXPIRED" } },
  { key: "CANCELLED", label: "Cancelled", params: { status: "CANCELLED" } },
];

function daysTone(days) {
  if (days < 0) return "red";
  if (days <= 2) return "red";
  if (days <= 7) return "amber";
  return "green";
}

export default function Memberships() {
  const { can } = useAuth();
  const toast = useToast();
  const canWrite = can(...ADMIN_STAFF);
  const isAdmin = can(...ADMIN_ONLY);

  const [searchParams] = useSearchParams();
  const initialView = VIEWS.some((v) => v.key === searchParams.get("view")) ? searchParams.get("view") : "ALL";

  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [selling, setSelling] = useState(false);
  const [renewing, setRenewing] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const viewParams = VIEWS.find((v) => v.key === view).params;
  const list = usePagedList(membershipsApi.list, { ...viewParams, search, plan }, 10);
  const plans = useFetch(() => plansApi.list({ page_size: 100 }), []);
  const planOptions = plans.data?.results ?? [];

  const runAction = async (action, successMessage, close) => {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      list.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
      close(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Memberships"
        subtitle="Track who is covered, who is about to expire and renew them in one click."
        actions={
          canWrite && (
            <Button onClick={() => setSelling(true)}>
              <Plus className="h-4 w-4" /> Sell membership
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              view === item.key ? "bg-brand-500 text-ink-950" : "border border-ink-600 text-ink-200 hover:bg-ink-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search member name, phone, ID or plan" className="sm:col-span-2" />
        <select className="input" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filter by plan">
          <option value="">All plans</option>
          {planOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <TableCard
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        itemCount={list.items.length}
        emptyTitle="No memberships found"
        emptyText={view === "EXPIRING" ? "Nobody is expiring in the next 7 days. Nice!" : "Try a different filter."}
        footer={<Pagination page={list.page} pageSize={list.pageSize} count={list.count} onChange={list.setPage} />}
      >
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Plan</th>
              <th>Period</th>
              <th>Time left</th>
              <th>Price</th>
              <th>Status</th>
              {(canWrite || isAdmin) && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.items.map((row) => (
              <tr key={row.id}>
                <td>
                  <p className="font-semibold">{row.member_name}</p>
                  <p className="text-xs text-ink-300">
                    {row.member_code} · {row.member_phone}
                  </p>
                </td>
                <td>{row.plan_name}</td>
                <td className="whitespace-nowrap text-ink-200">
                  {formatDate(row.start_date)} - {formatDate(row.end_date)}
                </td>
                <td>{row.status === "ACTIVE" ? <Badge tone={daysTone(row.days_left)}>{formatDaysLeft(row.days_left)}</Badge> : <span className="text-ink-400">-</span>}</td>
                <td>{formatCurrency(row.price)}</td>
                <td>
                  <StatusBadge status={row.status} daysLeft={row.days_left} />
                </td>
                {(canWrite || isAdmin) && (
                  <td>
                    <div className="flex justify-end gap-1">
                      {canWrite && row.status !== "CANCELLED" && (
                        <Button size="sm" variant="secondary" onClick={() => setRenewing(row)}>
                          <RefreshCw className="h-3.5 w-3.5" /> Renew
                        </Button>
                      )}
                      {canWrite && row.status === "ACTIVE" && (
                        <button type="button" className="icon-btn hover:!text-amber-400" onClick={() => setToCancel(row)} aria-label="Cancel membership" title="Cancel membership">
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button type="button" className="icon-btn hover:!text-red-400" onClick={() => setToDelete(row)} aria-label="Delete membership" title="Delete (admin)">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {selling && <SellMembershipModal onClose={() => setSelling(false)} onDone={list.reload} />}
      {renewing && <RenewModal membership={renewing} onClose={() => setRenewing(null)} onDone={list.reload} />}

      <ConfirmDialog
        open={Boolean(toCancel)}
        danger
        title="Cancel membership?"
        message={`${toCancel?.member_name ?? "The member"} will lose access immediately. Any payment already recorded stays in the payment history.`}
        confirmLabel="Cancel membership"
        loading={busy}
        onConfirm={() => runAction(() => membershipsApi.cancel(toCancel.id), "Membership cancelled.", setToCancel)}
        onCancel={() => setToCancel(null)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete membership record?"
        message="Use this only to remove a mistaken entry. Linked payments are kept but no longer point to this membership."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={() => runAction(() => membershipsApi.remove(toDelete.id), "Membership deleted.", setToDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
