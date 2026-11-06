import { useState } from "react";
import { UserMinus } from "lucide-react";
import { trainersApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";
import { ActiveBadge } from "../ui/Badge";
import Modal from "../ui/Modal";
import { ErrorState, PageLoader } from "../ui/States";

/** Members assigned to one trainer, with a button to remove each one. */
export default function TrainerMembersModal({ trainer, canEdit, onClose, onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => trainersApi.members(trainer.id), [trainer.id]);
  const [busyId, setBusyId] = useState(null);

  const unassign = async (member) => {
    setBusyId(member.id);
    try {
      await trainersApi.unassign(trainer.id, [member.id]);
      toast.success(`${member.full_name} was unassigned.`);
      reload();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal title={`${trainer.full_name}'s members`} subtitle={trainer.specialization} onClose={onClose}>
      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-300">No members are assigned to this trainer yet.</p>
      ) : (
        <ul className="divide-y divide-ink-700 rounded-xl border border-ink-700">
          {data.map((member) => (
            <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar name={member.full_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.full_name}</p>
                <p className="text-xs text-ink-300">
                  {member.member_code} · {member.phone}
                </p>
              </div>
              {!member.is_active && <ActiveBadge active={false} />}
              {canEdit && (
                <button
                  type="button"
                  className="icon-btn hover:!text-red-400"
                  disabled={busyId === member.id}
                  onClick={() => unassign(member)}
                  aria-label={`Unassign ${member.full_name}`}
                  title="Unassign"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
