import { Printer } from "lucide-react";
import { paymentsApi } from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { formatCurrency, formatDate } from "../../utils/format";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { ErrorState, PageLoader } from "../ui/States";

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{children || "-"}</span>
    </div>
  );
}

/** Receipt for one payment. "Print" shows only the white receipt (see print styles in index.css). */
export default function ReceiptModal({ payment, onClose }) {
  const { data: receipt, loading, error, reload } = useFetch(() => paymentsApi.receipt(payment.id), [payment.id]);

  return (
    <Modal
      title="Receipt"
      subtitle={payment.receipt_no}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()} disabled={!receipt}>
            <Printer className="h-4 w-4" /> Print receipt
          </Button>
        </>
      }
    >
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div id="receipt-print" className="mx-auto max-w-md rounded-xl bg-white p-6 text-gray-900 shadow-xl">
          <div className="border-b border-dashed border-gray-300 pb-4 text-center">
            <h3 className="text-2xl font-bold uppercase tracking-wider">{receipt.gym.name}</h3>
            <p className="mt-1 text-xs text-gray-500">{receipt.gym.address}</p>
            <p className="text-xs text-gray-500">
              {receipt.gym.phone} · {receipt.gym.email}
            </p>
          </div>

          <div className="py-3">
            <Row label="Receipt no.">{receipt.receipt_no}</Row>
            <Row label="Date">{formatDate(receipt.date)}</Row>
            <Row label="Status">{receipt.status}</Row>
          </div>

          <div className="border-t border-dashed border-gray-300 py-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Received from</p>
            <Row label="Member">{receipt.member.name}</Row>
            <Row label="Member ID">{receipt.member.code}</Row>
            <Row label="Phone">{receipt.member.phone}</Row>
          </div>

          {receipt.membership && (
            <div className="border-t border-dashed border-gray-300 py-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Membership</p>
              <Row label="Plan">{`${receipt.membership.plan} (${receipt.membership.plan_type})`}</Row>
              <Row label="Valid">{`${formatDate(receipt.membership.start_date)} - ${formatDate(receipt.membership.end_date)}`}</Row>
            </div>
          )}

          <div className="border-t border-dashed border-gray-300 py-3">
            <Row label="Payment method">{receipt.method}</Row>
            {receipt.note && <Row label="Note">{receipt.note}</Row>}
            <Row label="Received by">{receipt.received_by}</Row>
          </div>

          <div className="flex items-center justify-between border-t-2 border-gray-900 pt-3">
            <span className="text-sm font-bold uppercase tracking-wider">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(receipt.amount)}</span>
          </div>
          <p className="mt-5 text-center text-xs text-gray-500">Thank you for training with us!</p>
        </div>
      )}
    </Modal>
  );
}
