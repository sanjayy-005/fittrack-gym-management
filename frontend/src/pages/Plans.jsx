import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { plansApi } from "../api";
import PlanFormModal from "../components/memberships/PlanFormModal";
import Badge, { ActiveBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, PageLoader } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useFetch } from "../hooks/useFetch";
import { ADMIN_ONLY, PLAN_TYPES } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { formatCurrency } from "../utils/format";

export default function Plans() {
  const { can } = useAuth();
  const toast = useToast();
  const isAdmin = can(...ADMIN_ONLY);

  const [planType, setPlanType] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formState, setFormState] = useState({ open: false, plan: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => plansApi.list({ plan_type: planType, is_active: showInactive ? "" : true, page_size: 100 }),
    [planType, showInactive]
  );
  const plans = data?.results ?? [];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await plansApi.remove(toDelete.id);
      toast.success(`${toDelete.name} was deleted.`);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Membership plans"
        subtitle="What your gym sells. Prices are saved on each membership when it is bought."
        actions={
          isAdmin && (
            <Button onClick={() => setFormState({ open: true, plan: null })}>
              <Plus className="h-4 w-4" /> New plan
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input max-w-52" value={planType} onChange={(e) => setPlanType(e.target.value)} aria-label="Filter by billing period">
          <option value="">All periods</option>
          {PLAN_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {isAdmin && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-200">
            <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive plans
          </label>
        )}
      </div>

      {error && plans.length === 0 ? (
        <div className="card">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : loading && !data ? (
        <PageLoader />
      ) : plans.length === 0 ? (
        <div className="card">
          <EmptyState title="No plans yet" text={isAdmin ? "Create your first plan to start selling memberships." : "An admin needs to create plans first."} />
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          {plans.map((plan) => (
            <article key={plan.id} className={`card flex flex-col p-6 ${plan.is_active ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between gap-2">
                <Badge tone="orange">{plan.plan_type_display}</Badge>
                {!plan.is_active && <ActiveBadge active={false} />}
              </div>
              <h2 className="mt-3 text-lg font-bold">{plan.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-ink-300">{plan.description}</p>
              <p className="mt-3 font-display text-5xl font-bold text-brand-400">
                {formatCurrency(plan.price)}
                <span className="ml-1 text-base font-medium text-ink-300">/ {plan.duration_days} days</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features_list.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-200">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-ink-700 pt-4">
                <p className="text-xs text-ink-300">
                  <span className="font-semibold text-ink-100">{plan.active_members}</span> active member{plan.active_members === 1 ? "" : "s"}
                </p>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button type="button" className="icon-btn" onClick={() => setFormState({ open: true, plan })} aria-label={`Edit ${plan.name}`} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" className="icon-btn hover:!text-red-400" onClick={() => setToDelete(plan)} aria-label={`Delete ${plan.name}`} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {formState.open && <PlanFormModal plan={formState.plan} onClose={() => setFormState({ open: false, plan: null })} onSaved={reload} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete plan?"
        message={`Plans that were already sold cannot be deleted. In that case, edit "${toDelete?.name ?? ""}" and untick "Available for sale" instead.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
