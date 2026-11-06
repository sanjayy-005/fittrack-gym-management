import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { usersApi } from "../api";
import Avatar from "../components/ui/Avatar";
import Badge, { ActiveBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import SearchInput from "../components/ui/SearchInput";
import { TableCard } from "../components/ui/States";
import UserFormModal from "../components/users/UserFormModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePagedList } from "../hooks/usePagedList";
import { ROLE_LABELS } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/format";

const ROLE_TONES = { ADMIN: "orange", STAFF: "blue", TRAINER: "gray" };

/** Admin-only screen for managing who can log in. */
export default function Users() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState({ search: "", role: "", is_active: "" });
  const [formState, setFormState] = useState({ open: false, user: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (field) => (value) => setFilters((previous) => ({ ...previous, [field]: value }));
  const list = usePagedList(usersApi.list, filters, 10);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await usersApi.remove(toDelete.id);
      toast.success(`${toDelete.username} was deleted.`);
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
        title="User accounts"
        subtitle="Control who can log in and what they can do."
        actions={
          <Button onClick={() => setFormState({ open: true, user: null })}>
            <Plus className="h-4 w-4" /> Add user
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SearchInput value={filters.search} onChange={setFilter("search")} placeholder="Search username, name, email" />
        <select className="input" value={filters.role} onChange={(event) => setFilter("role")(event.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Front desk staff</option>
          <option value="TRAINER">Trainer</option>
        </select>
        <select className="input" value={filters.is_active} onChange={(event) => setFilter("is_active")(event.target.value)} aria-label="Filter by status">
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
        emptyTitle="No users found"
        emptyText="Try different filters."
        footer={<Pagination page={list.page} pageSize={list.pageSize} count={list.count} onChange={list.setPage} />}
      >
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((account) => {
              const isSelf = account.id === currentUser.id;
              return (
                <tr key={account.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={account.full_name} size="sm" />
                      <div>
                        <p className="font-semibold text-ink-100">
                          {account.full_name} {isSelf && <span className="text-xs font-normal text-brand-400">(you)</span>}
                        </p>
                        <p className="text-xs text-ink-300">@{account.username}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p>{account.email || "-"}</p>
                    <p className="text-xs text-ink-300">{account.phone || "-"}</p>
                  </td>
                  <td>
                    <Badge tone={ROLE_TONES[account.role] || "gray"}>{ROLE_LABELS[account.role] || account.role}</Badge>
                  </td>
                  <td>
                    <ActiveBadge active={account.is_active} />
                  </td>
                  <td className="whitespace-nowrap text-ink-200">{account.last_login ? formatDate(account.last_login) : "Never"}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button type="button" className="icon-btn" aria-label={`Edit ${account.username}`} onClick={() => setFormState({ open: true, user: account })}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn hover:!text-red-400"
                        aria-label={`Delete ${account.username}`}
                        title={isSelf ? "You cannot delete your own account" : "Delete user"}
                        disabled={isSelf}
                        onClick={() => setToDelete(account)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      {formState.open && (
        <UserFormModal
          user={formState.user}
          currentUserId={currentUser.id}
          onClose={() => setFormState({ open: false, user: null })}
          onSaved={list.reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete user?"
        message={toDelete ? `${toDelete.username} will no longer be able to log in. This cannot be undone. To keep the account but block access, edit it and untick "Active" instead.` : ""}
        confirmLabel="Delete user"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
