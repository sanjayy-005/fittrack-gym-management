import { useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { membersApi, trainersApi } from "../api";
import MemberDetailModal from "../components/members/MemberDetailModal";
import MemberFormModal from "../components/members/MemberFormModal";
import Avatar from "../components/ui/Avatar";
import { ActiveBadge, StatusBadge } from "../components/ui/Badge";
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
import { ADMIN_STAFF } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { formatDate, formatDaysLeft } from "../utils/format";

const STATUS_OPTIONS = [
  { value: "", label: "All memberships" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRING", label: "Expiring (7 days)" },
  { value: "EXPIRED", label: "Expired" },
  { value: "NONE", label: "No plan" },
];

export default function Members() {
  const { user, can } = useAuth();
  const toast = useToast();
  const canWrite = can(...ADMIN_STAFF);
  const isTrainer = user.role === "TRAINER";

  const [filters, setFilters] = useState({ search: "", membership_status: "", trainer: "", is_active: "" });
  const [formState, setFormState] = useState({ open: false, member: null });
  const [viewing, setViewing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (field) => (value) => setFilters((previous) => ({ ...previous, [field]: value }));

  const params = {
    search: filters.search,
    membership_status: filters.membership_status,
    is_active: filters.is_active,
    trainer: filters.trainer && filters.trainer !== "none" ? filters.trainer : "",
    trainer_isnull: filters.trainer === "none" ? true : "",
  };
  const list = usePagedList(membersApi.list, params, 10);

  const trainers = useFetch(() => (isTrainer ? Promise.resolve({ results: [] }) : trainersApi.list({ page_size: 100 })), [isTrainer]);
  const trainerOptions = trainers.data?.results ?? [];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await membersApi.remove(toDelete.id);
      toast.success(`${toDelete.full_name} was deleted.`);
      setToDelete(null);
      list.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isTrainer ? "My members" : "Members"}
        subtitle={isTrainer ? "Members assigned to you." : "Everyone who trains at your gym."}
        actions={
          canWrite && (
            <Button onClick={() => setFormState({ open: true, member: null })}>
              <Plus className="h-4 w-4" /> Add member
            </Button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput value={filters.search} onChange={setFilter("search")} placeholder="Search name, email, phone, ID" className="lg:col-span-1" />
        <select className="input" value={filters.membership_status} onChange={(e) => setFilter("membership_status")(e.target.value)} aria-label="Filter by membership">
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {!isTrainer && (
          <select className="input" value={filters.trainer} onChange={(e) => setFilter("trainer")(e.target.value)} aria-label="Filter by trainer">
            <option value="">All trainers</option>
            <option value="none">Unassigned</option>
            {trainerOptions.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.full_name}
              </option>
            ))}
          </select>
        )}
        <select className="input" value={filters.is_active} onChange={(e) => setFilter("is_active")(e.target.value)} aria-label="Filter by account status">
          <option value="">Active and inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      <TableCard
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        itemCount={list.items.length}
        emptyTitle="No members found"
        emptyText="Try different filters, or add your first member."
        emptyAction={
          canWrite && (
            <Button size="sm" onClick={() => setFormState({ open: true, member: null })}>
              <Plus className="h-3.5 w-3.5" /> Add member
            </Button>
          )
        }
        footer={<Pagination page={list.page} pageSize={list.pageSize} count={list.count} onChange={list.setPage} />}
      >
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Contact</th>
              <th>Trainer</th>
              <th>Plan</th>
              <th>Membership</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.full_name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{member.full_name}</p>
                      <p className="text-xs text-ink-300">{member.member_code}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p>{member.phone}</p>
                  <p className="text-xs text-ink-300">{member.email}</p>
                </td>
                <td className="text-ink-200">{member.trainer_name || "-"}</td>
                <td className="text-ink-200">{member.membership_plan || "-"}</td>
                <td>
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={member.membership_status} daysLeft={member.days_left} />
                    {member.membership_status === "ACTIVE" && <span className="text-xs text-ink-300">{formatDaysLeft(member.days_left)}</span>}
                    {!member.is_active && <ActiveBadge active={false} />}
                  </div>
                </td>
                <td className="whitespace-nowrap text-ink-200">{formatDate(member.joined_date)}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button type="button" className="icon-btn" onClick={() => setViewing(member)} aria-label={`View ${member.full_name}`} title="View profile">
                      <Eye className="h-4 w-4" />
                    </button>
                    {canWrite && (
                      <>
                        <button type="button" className="icon-btn" onClick={() => setFormState({ open: true, member })} aria-label={`Edit ${member.full_name}`} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="icon-btn hover:!text-red-400" onClick={() => setToDelete(member)} aria-label={`Delete ${member.full_name}`} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {formState.open && (
        <MemberFormModal member={formState.member} onClose={() => setFormState({ open: false, member: null })} onSaved={list.reload} />
      )}
      {viewing && <MemberDetailModal member={viewing} onClose={() => setViewing(null)} onChanged={list.reload} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete member?"
        message={`This permanently removes ${toDelete?.full_name ?? "this member"}, their memberships and attendance. Members with payment history cannot be deleted - mark them inactive instead.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
