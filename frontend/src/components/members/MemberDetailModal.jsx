import { useState } from "react";
import { Plus } from "lucide-react";
import { attendanceApi, membershipsApi, paymentsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { ADMIN_STAFF } from "../../utils/constants";
import { formatCurrency, formatDate, formatDaysLeft, formatTime } from "../../utils/format";
import SellMembershipModal from "../memberships/SellMembershipModal";
import Avatar from "../ui/Avatar";
import Badge, { ActiveBadge, StatusBadge } from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Spinner } from "../ui/States";

function Info({ label, children }) {
  return (
    <div>
      <p className="label !mb-0.5">{label}</p>
      <p className="text-sm text-ink-100">{children || "-"}</p>
    </div>
  );
}

function Section({ title, loading, error, empty, children, action }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {loading ? (
        <div className="py-4">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : empty ? (
        <p className="rounded-xl border border-dashed border-ink-600 py-4 text-center text-sm text-ink-300">{empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-700">{children}</div>
      )}
    </section>
  );
}

/** Full profile of one member: details, plan history, payments and recent visits. */
export default function MemberDetailModal({ member, onClose, onChanged }) {
  const { can } = useAuth();
  const canWrite = can(...ADMIN_STAFF);
  const [selling, setSelling] = useState(false);

  const memberships = useFetch(() => membershipsApi.list({ member: member.id, page_size: 50 }), [member.id]);
  const payments = useFetch(() => (canWrite ? paymentsApi.list({ member: member.id, page_size: 10 }) : Promise.resolve({ results: [] })), [member.id, canWrite]);
  const visits = useFetch(() => attendanceApi.list({ member: member.id, page_size: 8 }), [member.id]);

  const refresh = () => {
    memberships.reload();
    payments.reload();
    onChanged?.();
  };

  const membershipRows = memberships.data?.results ?? [];
  const paymentRows = payments.data?.results ?? [];
  const visitRows = visits.data?.results ?? [];

  return (
    <>
      <Modal size="lg" title="Member profile" onClose={onClose}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={member.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold">{member.full_name}</h3>
            <p className="text-sm text-ink-300">{member.member_code}</p>
          </div>
          <div className="flex items-center gap-2">
            <ActiveBadge active={member.is_active} />
            <StatusBadge status={member.membership_status} daysLeft={member.days_left} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Phone">{member.phone}</Info>
          <Info label="Email">{member.email}</Info>
          <Info label="Gender">{member.gender_display}</Info>
          <Info label="Date of birth">{member.date_of_birth ? formatDate(member.date_of_birth) : ""}</Info>
          <Info label="Joined">{formatDate(member.joined_date)}</Info>
          <Info label="Trainer">{member.trainer_name}</Info>
          <Info label="Height">{member.height_cm ? `${member.height_cm} cm` : ""}</Info>
          <Info label="Weight">{member.weight_kg ? `${member.weight_kg} kg` : ""}</Info>
          <Info label="Emergency contact">
            {member.emergency_contact_name ? `${member.emergency_contact_name} (${member.emergency_contact_phone || "no phone"})` : ""}
          </Info>
          <div className="col-span-2 sm:col-span-3">
            <Info label="Address">{member.address}</Info>
          </div>
          {member.notes && (
            <div className="col-span-2 sm:col-span-3">
              <Info label="Notes">{member.notes}</Info>
            </div>
          )}
        </div>

        <Section
          title="Memberships"
          loading={memberships.loading && !memberships.data}
          error={memberships.error}
          empty={membershipRows.length === 0 && "No memberships yet."}
          action={
            canWrite && member.is_active ? (
              <Button size="sm" onClick={() => setSelling(true)}>
                <Plus className="h-3.5 w-3.5" /> Add / renew
              </Button>
            ) : null
          }
        >
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Period</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {membershipRows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.plan_name}</td>
                  <td className="whitespace-nowrap text-ink-200">
                    {formatDate(row.start_date)} - {formatDate(row.end_date)}
                  </td>
                  <td>{formatCurrency(row.price)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={row.status} daysLeft={row.days_left} />
                      {row.status === "ACTIVE" && <span className="text-xs text-ink-300">{formatDaysLeft(row.days_left)}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {canWrite && (
          <Section
            title="Recent payments"
            loading={payments.loading && !payments.data}
            error={payments.error}
            empty={paymentRows.length === 0 && "No payments recorded."}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">{row.receipt_no}</td>
                    <td>{formatDate(row.paid_on)}</td>
                    <td>{row.method_display}</td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        <Section
          title="Recent visits"
          loading={visits.loading && !visits.data}
          error={visits.error}
          empty={visitRows.length === 0 && "No gym visits recorded."}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>In</th>
                <th>Out</th>
              </tr>
            </thead>
            <tbody>
              {visitRows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.date)}</td>
                  <td>{formatTime(row.check_in)}</td>
                  <td>{row.check_out ? formatTime(row.check_out) : <Badge tone="orange">Inside</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </Modal>

      {selling && <SellMembershipModal member={member} onClose={() => setSelling(false)} onDone={refresh} />}
    </>
  );
}
