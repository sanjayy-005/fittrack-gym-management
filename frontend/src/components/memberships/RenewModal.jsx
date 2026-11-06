import { useState } from "react";
import { membershipsApi, plansApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { formatCurrency, formatDate } from "../../utils/format";
import Button from "../ui/Button";
import Field, { FormError, inputClass } from "../ui/Field";
import Modal from "../ui/Modal";
import { Spinner } from "../ui/States";
import PaymentOptionsFields, { DEFAULT_PAYMENT_OPTIONS, paymentPayload, validatePaymentOptions } from "./PaymentOptionsFields";

/** Renew an existing membership with the same plan or a different one. */
export default function RenewModal({ membership, onClose, onDone }) {
  const toast = useToast();
  const { data, loading, error: plansError } = useFetch(() => plansApi.list({ is_active: true, page_size: 100 }), []);
  const plans = data?.results ?? [];

  // Pre-select the same plan, but only if it is still on sale (the server rejects inactive plans).
  const [planId, setPlanId] = useState(String(membership.plan));
  const [payment, setPayment] = useState(DEFAULT_PAYMENT_OPTIONS);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const planStillOffered = plans.some((plan) => String(plan.id) === planId);
  const selectedPlan = plans.find((plan) => String(plan.id) === planId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = { ...validatePaymentOptions(payment) };
    if (!planStillOffered) found.plan = "Choose a plan that is currently offered.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setFormError("");
    try {
      await membershipsApi.renew(membership.id, { plan: Number(planId), ...paymentPayload(payment) });
      toast.success(`Membership renewed for ${membership.member_name}.`);
      onDone?.();
      onClose();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length ? "Please fix the highlighted fields." : getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Renew membership"
      subtitle={`${membership.member_name} · current plan ${membership.plan_name} ends ${formatDate(membership.end_date)}`}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={loading || plans.length === 0}>
            Renew
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormError message={formError || plansError} />
        <Field label="Plan" required error={errors.plan} hint="The new period starts the day after the current one ends (or today if it already ended).">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-ink-300">
              <Spinner className="h-4 w-4" /> Loading plans...
            </div>
          ) : (
            <select className={inputClass(errors.plan)} value={planStillOffered ? planId : ""} onChange={(e) => setPlanId(e.target.value)}>
              {!planStillOffered && <option value="">Select a plan</option>}
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatCurrency(plan.price)} ({plan.duration_days} days)
                </option>
              ))}
            </select>
          )}
        </Field>
        <PaymentOptionsFields
          value={payment}
          onChange={setPayment}
          errors={errors}
          defaultAmount={selectedPlan ? formatCurrency(selectedPlan.price) : undefined}
        />
      </form>
    </Modal>
  );
}
