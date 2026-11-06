import { useState } from "react";
import { paymentsApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "../../utils/constants";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { todayISO } from "../../utils/format";
import { isFutureDate, isValid } from "../../utils/validators";
import Button from "../ui/Button";
import Field, { FormError, inputClass } from "../ui/Field";
import MemberSelect from "../ui/MemberSelect";
import Modal from "../ui/Modal";

/**
 * Record a one-off payment (personal training, locker fee, balance...) or edit an existing one.
 * Membership purchases create their own payments automatically from the Memberships page.
 */
export default function PaymentFormModal({ payment = null, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(payment);

  const [member, setMember] = useState(
    payment ? { id: payment.member, full_name: payment.member_name, member_code: payment.member_code, phone: "" } : null
  );
  const [form, setForm] = useState({
    amount: payment?.amount ?? "",
    method: payment?.method ?? "CASH",
    status: payment?.status ?? "PAID",
    paid_on: payment?.paid_on ?? todayISO(),
    note: payment?.note ?? "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!member) found.member = "Choose a member.";
    if (form.amount === "" || !(Number(form.amount) > 0)) found.amount = "Amount must be greater than 0.";
    if (!form.paid_on) found.paid_on = "Choose the payment date.";
    else if (isFutureDate(form.paid_on, todayISO())) found.paid_on = "Payment date cannot be in the future.";
    setErrors(found);
    if (!isValid(found)) return;

    setSaving(true);
    setFormError("");
    const payload = { ...form, amount: Number(form.amount).toFixed(2), note: form.note.trim() };
    try {
      if (isEdit) await paymentsApi.update(payment.id, payload);
      else await paymentsApi.create({ ...payload, member: member.id });
      toast.success(isEdit ? "Payment updated." : "Payment recorded.");
      onSaved();
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
      title={isEdit ? `Edit ${payment.receipt_no}` : "Record payment"}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Record payment"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormError message={formError} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field as="div" label="Member" required error={errors.member} className="sm:col-span-2">
            <MemberSelect selected={member} onSelect={setMember} error={errors.member} disabled={isEdit} />
          </Field>
          <Field label="Amount (INR)" required error={errors.amount}>
            <input className={inputClass(errors.amount)} type="number" min="0.01" step="0.01" value={form.amount} onChange={set("amount")} autoFocus />
          </Field>
          <Field label="Payment date" required error={errors.paid_on}>
            <input className={inputClass(errors.paid_on)} type="date" max={todayISO()} value={form.paid_on} onChange={set("paid_on")} />
          </Field>
          <Field label="Method" error={errors.method}>
            <select className={inputClass(errors.method)} value={form.method} onChange={set("method")}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" error={errors.status}>
            <select className={inputClass(errors.status)} value={form.status} onChange={set("status")}>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Note" error={errors.note} className="sm:col-span-2">
            <input className={inputClass(errors.note)} value={form.note} onChange={set("note")} maxLength={255} placeholder="e.g. Personal training - 4 sessions" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
