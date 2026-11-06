import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IndianRupee, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { paymentsApi } from "../api";
import PaymentFormModal from "../components/payments/PaymentFormModal";
import ReceiptModal from "../components/payments/ReceiptModal";
import { StatusBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import SearchInput from "../components/ui/SearchInput";
import StatCard from "../components/ui/StatCard";
import { TableCard } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useFetch } from "../hooks/useFetch";
import { usePagedList } from "../hooks/usePagedList";
import { ADMIN_ONLY, PAYMENT_METHODS, PAYMENT_STATUSES } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { formatCurrency, formatDate } from "../utils/format";

export default function Payments() {
  const { can } = useAuth();
  const toast = useToast();
  const isAdmin = can(...ADMIN_ONLY);
  const [searchParams] = useSearchParams();

  const initialStatus = PAYMENT_STATUSES.some((s) => s.value === searchParams.get("status")) ? searchParams.get("status") : "";
  const [filters, setFilters] = useState({ search: "", status: initialStatus, method: "", date_from: "", date_to: "" });
  const [formState, setFormState] = useState({ open: false, payment: null });
  const [receipt, setReceipt] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (field) => (value) => setFilters((previous) => ({ ...previous, [field]: value }));

  const list = usePagedList(paymentsApi.list, filters, 10);
  const filtersKey = JSON.stringify(filters);
  const summary = useFetch(() => paymentsApi.summary(filters), [filtersKey]);

  const refresh = () => {
    list.reload();
    summary.reload();
  };

  const dateRangeInvalid = filters.date_from && filters.date_to && filters.date_from > filters.date_to;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await paymentsApi.remove(toDelete.id);
      toast.success(`${toDelete.receipt_no} was deleted.`);
      setToDelete(null);
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const totals = summary.data;

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Every rupee collected, with printable receipts."
        actions={
          <Button onClick={() => setFormState({ open: true, payment: null })}>
            <Plus className="h-4 w-4" /> Record payment
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard accent icon={IndianRupee} label="Collected" value={totals ? formatCurrency(totals.total_collected) : "..."} hint="For the filters below" />
        <StatCard label="Pending" value={totals ? formatCurrency(totals.total_pending) : "..."} />
        <StatCard label="Refunded" value={totals ? formatCurrency(totals.total_refunded) : "..."} />
        <StatCard label="Transactions" value={totals ? totals.count : "..."} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SearchInput value={filters.search} onChange={setFilter("search")} placeholder="Receipt, member name, phone" className="lg:col-span-1" />
        <select className="input" value={filters.status} onChange={(e) => setFilter("status")(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="input" value={filters.method} onChange={(e) => setFilter("method")(e.target.value)} aria-label="Filter by method">
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input className="input" type="date" value={filters.date_from} max={filters.date_to || undefined} onChange={(e) => setFilter("date_from")(e.target.value)} aria-label="From date" title="From date" />
        <input className="input" type="date" value={filters.date_to} min={filters.date_from || undefined} onChange={(e) => setFilter("date_to")(e.target.value)} aria-label="To date" title="To date" />
      </div>
      {dateRangeInvalid && <p className="mb-3 text-sm text-red-400">"From" date must be before the "To" date.</p>}

      <TableCard
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        itemCount={list.items.length}
        emptyTitle="No payments found"
        emptyText="Try different filters, or record a payment."
        footer={<Pagination page={list.page} pageSize={list.pageSize} count={list.count} onChange={list.setPage} />}
      >
        <table className="table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Member</th>
              <th>For</th>
              <th>Date</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((payment) => (
              <tr key={payment.id}>
                <td className="whitespace-nowrap font-semibold">{payment.receipt_no}</td>
                <td>
                  <p className="font-medium">{payment.member_name}</p>
                  <p className="text-xs text-ink-300">{payment.member_code}</p>
                </td>
                <td className="max-w-48 truncate text-ink-200">{payment.plan_name || payment.note || "-"}</td>
                <td className="whitespace-nowrap text-ink-200">{formatDate(payment.paid_on)}</td>
                <td className="text-ink-200">{payment.method_display}</td>
                <td className="whitespace-nowrap font-semibold">{formatCurrency(payment.amount)}</td>
                <td>
                  <StatusBadge status={payment.status} />
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button type="button" className="icon-btn" onClick={() => setReceipt(payment)} aria-label={`Receipt ${payment.receipt_no}`} title="View receipt">
                      <Receipt className="h-4 w-4" />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => setFormState({ open: true, payment })} aria-label={`Edit ${payment.receipt_no}`} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button type="button" className="icon-btn hover:!text-red-400" onClick={() => setToDelete(payment)} aria-label={`Delete ${payment.receipt_no}`} title="Delete (admin)">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {formState.open && <PaymentFormModal payment={formState.payment} onClose={() => setFormState({ open: false, payment: null })} onSaved={refresh} />}
      {receipt && <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete payment?"
        message={`This removes ${toDelete?.receipt_no ?? "the payment"} from your records and revenue totals. To keep a record of a returned payment, change its status to Refunded instead.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
