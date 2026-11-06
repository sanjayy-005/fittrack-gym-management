import { useState } from "react";
import { membersApi, trainersApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { FormError } from "../ui/Field";
import Modal from "../ui/Modal";
import SearchInput from "../ui/SearchInput";
import { PageLoader } from "../ui/States";

/** Pick members and assign them to a trainer. Members who already have another trainer are moved. */
export default function AssignMembersModal({ trainer, onClose, onSaved }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({}); // {memberId: true}
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { data, loading, error, reload } = useFetch(
    () => membersApi.list({ search, is_active: true, page_size: 30 }),
    [search]
  );
  const members = data?.results ?? [];
  const selectedIds = Object.keys(selected).filter((id) => selected[id]).map(Number);

  const toggle = (id) => setSelected((previous) => ({ ...previous, [id]: !previous[id] }));

  const handleAssign = async () => {
    setSaving(true);
    setFormError("");
    try {
      const result = await trainersApi.assign(trainer.id, selectedIds);
      toast.success(result.detail || "Members assigned.");
      onSaved();
      onClose();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      size="md"
      title="Assign members"
      subtitle={`Choose members to train with ${trainer.full_name}`}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleAssign} loading={saving} disabled={selectedIds.length === 0}>
            Assign {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </Button>
        </>
      }
    >
      <FormError message={formError} />
      <SearchInput value={search} onChange={setSearch} placeholder="Search members" className="mb-3" />
      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <div className="py-6 text-center text-sm text-red-300">
          {error}{" "}
          <button type="button" className="underline" onClick={reload}>
            Retry
          </button>
        </div>
      ) : members.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-300">No active members found.</p>
      ) : (
        <ul className="divide-y divide-ink-700 rounded-xl border border-ink-700">
          {members.map((member) => {
            const already = member.trainer === trainer.id;
            return (
              <li key={member.id}>
                <label className={`flex items-center gap-3 px-3 py-2.5 ${already ? "opacity-60" : "cursor-pointer hover:bg-ink-700/40"}`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-500"
                    checked={already || Boolean(selected[member.id])}
                    disabled={already}
                    onChange={() => toggle(member.id)}
                  />
                  <Avatar name={member.full_name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{member.full_name}</span>
                    <span className="block truncate text-xs text-ink-300">
                      {member.member_code}
                      {already ? " · already assigned" : member.trainer_name ? ` · currently with ${member.trainer_name}` : " · no trainer"}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
