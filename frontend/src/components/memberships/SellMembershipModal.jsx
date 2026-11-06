import { useState } from "react";
import { membershipsApi, plansApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { formatCurrency, todayISO } from "../../utils/format";
import Button from "../ui/Button";
import Field, { FormError, inputClass } from "../ui/Field";
import MemberSelect from "../ui/MemberSelect";
import Modal from "../ui/Modal";
import { Spinner } from "../ui/States";
import PaymentOptionsFields, { DEFAULT_PAYMENT_OPTIONS, paymentPayload, validatePaymentOptions } from "./PaymentOptionsFields";

/**
 * Sell a plan to a member (new membership, or an extension of the current one).
 * Pass `member` to lock the member (e.g. when opened from the member's profile).
 */
export default function SellMembershipModal({ member: presetMember = null, onClose, onDone }) {
  const toast = useToast();
  const { data: plansData, loading: plansLoading, error: plansError } = useFetch(
    () => plansApi.list({ is_active: true, page_size: 100 }),
    []
  );
  const plans = plansData?.results ?? [];

  const [member, setMember] = useState(presetMember);
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [payment, setPayment] = useState(DEFAULT_PAYMENT_OPTIONS);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPlan = plans.find((plan) => String(plan.id) === String(planId));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = { ...validatePaymentOptions(payment) };
    if (!member) found.member = "Choose a member.";
    if (!planId) found.plan = "Choose a plan.";
    if (startDate && startDate > todayISO()) found.start_date = "Start date cannot be in the future.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = { member: member.id, plan: Number(planId), ...paymentPayload(payment) };
      if (startDate) payload.start_date = startDate;
      await membershipsApi.create(payload);
      toast.success(`Membership added for ${member.full_name}.`);
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
      title="Sell membership"
      subtitle="If the member already has an active plan, the new one starts right after it ends."
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={plansLoading || plans.length === 0}>
            Add membership
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormError message={formError || plansError} />

        <Field as="div" label="Member" required error={errors.member}>
          <MemberSelect selected={member} onSelect={setMember} error={errors.member} disabled={Boolean(presetMember)} />
        </Field>

        <Field label="Plan" required error={errors.plan}>
          {plansLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-ink-300">
              <Spinner className="h-4 w-4" /> Loading plans...
            </div>
          ) : (
            <select className={inputClass(errors.plan)} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatCurrency(plan.price)} ({plan.duration_days} days)
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Start date"
          error={errors.start_date}
          hint="Optional. Leave empty to start today (or after the current plan ends)."
        >
          <input className={inputClass(errors.start_date)} type="date" max={todayISO()} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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
