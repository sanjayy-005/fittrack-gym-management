import { useState } from "react";
import { Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { trainersApi } from "../api";
import AssignMembersModal from "../components/trainers/AssignMembersModal";
import TrainerFormModal from "../components/trainers/TrainerFormModal";
import TrainerMembersModal from "../components/trainers/TrainerMembersModal";
import Avatar from "../components/ui/Avatar";
import { ActiveBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import SearchInput from "../components/ui/SearchInput";
import { EmptyState, ErrorState, PageLoader } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePagedList } from "../hooks/usePagedList";
import { ADMIN_ONLY } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";

export default function Trainers() {
  const { can } = useAuth();
  const toast = useToast();
  const isAdmin = can(...ADMIN_ONLY);

  const [filters, setFilters] = useState({ search: "", is_active: "" });
  const [formState, setFormState] = useState({ open: false, trainer: null });
  const [assigning, setAssigning] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = usePagedList(trainersApi.list, filters, 9);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await trainersApi.remove(toDelete.id);
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
        title="Trainers"
        subtitle="Your coaching team and the members assigned to each."
        actions={
          isAdmin && (
            <Button onClick={() => setFormState({ open: true, trainer: null })}>
              <Plus className="h-4 w-4" /> Add trainer
            </Button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SearchInput value={filters.search} onChange={(value) => setFilters((p) => ({ ...p, search: value }))} placeholder="Search name, phone, specialty" className="sm:col-span-2" />
        <select className="input" value={filters.is_active} onChange={(e) => setFilters((p) => ({ ...p, is_active: e.target.value }))} aria-label="Filter by status">
          <option value="">Active and inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      {list.error && list.items.length === 0 ? (
        <div className="card">
          <ErrorState message={list.error} onRetry={list.reload} />
        </div>
      ) : list.loading && list.items.length === 0 ? (
        <PageLoader />
      ) : list.items.length === 0 ? (
        <div className="card">
          <EmptyState title="No trainers found" text="Try different filters or add a trainer." />
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${list.loading ? "opacity-60" : ""}`}>
            {list.items.map((trainer) => (
              <article key={trainer.id} className="card flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={trainer.full_name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold">{trainer.full_name}</h2>
                    <p className="truncate text-sm text-brand-400">{trainer.specialization}</p>
                    <p className="text-xs text-ink-300">{trainer.experience_years} yrs experience</p>
                  </div>
                  <ActiveBadge active={trainer.is_active} />
                </div>
                <dl className="mt-4 space-y-1 text-sm text-ink-200">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-300">Phone</dt>
                    <dd>{trainer.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-300">Email</dt>
                    <dd className="truncate">{trainer.email}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-300">Login</dt>
                    <dd>{trainer.login_username || "None"}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-900 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">Active members</span>
                  <span className="font-display text-3xl font-bold text-brand-400">{trainer.member_count}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setViewing(trainer)}>
                    <Users className="h-3.5 w-3.5" /> Members
                  </Button>
                  {trainer.is_active && (
                    <Button size="sm" variant="secondary" onClick={() => setAssigning(trainer)}>
                      <UserPlus className="h-3.5 w-3.5" /> Assign
                    </Button>
                  )}
                  {isAdmin && (
                    <div className="ml-auto flex gap-1">
                      <button type="button" className="icon-btn" onClick={() => setFormState({ open: true, trainer })} aria-label={`Edit ${trainer.full_name}`} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="icon-btn hover:!text-red-400" onClick={() => setToDelete(trainer)} aria-label={`Delete ${trainer.full_name}`} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="card mt-4 overflow-hidden">
            <Pagination page={list.page} pageSize={list.pageSize} count={list.count} onChange={list.setPage} />
          </div>
        </>
      )}

      {formState.open && (
        <TrainerFormModal trainer={formState.trainer} onClose={() => setFormState({ open: false, trainer: null })} onSaved={list.reload} />
      )}
      {assigning && <AssignMembersModal trainer={assigning} onClose={() => setAssigning(null)} onSaved={list.reload} />}
      {viewing && <TrainerMembersModal trainer={viewing} canEdit onClose={() => setViewing(null)} onChanged={list.reload} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete trainer?"
        message={`${toDelete?.full_name ?? "This trainer"} and their login will be removed. Their members stay in the gym but become unassigned.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
