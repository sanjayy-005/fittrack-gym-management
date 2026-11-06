import { useState } from "react";
import { plansApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { PLAN_TYPES } from "../../utils/constants";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { isValid } from "../../utils/validators";
import Button from "../ui/Button";
import Field, { Checkbox, FormError, inputClass } from "../ui/Field";
import Modal from "../ui/Modal";

export default function PlanFormModal({ plan = null, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(plan);
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    plan_type: plan?.plan_type ?? "MONTHLY",
    price: plan?.price ?? "",
    description: plan?.description ?? "",
    features: plan?.features ?? "",
    is_active: plan?.is_active ?? true,
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
    if (form.name.trim().length < 3) found.name = "Enter a plan name (at least 3 characters).";
    if (form.price === "" || !(Number(form.price) >= 1)) found.price = "Price must be at least 1.";
    setErrors(found);
    if (!isValid(found)) return;

    setSaving(true);
    setFormError("");
    const payload = {
      ...form,
      name: form.name.trim(),
      price: Number(form.price).toFixed(2),
      description: form.description.trim(),
      features: form.features.trim(),
    };
    try {
      if (isEdit) await plansApi.update(plan.id, payload);
      else await plansApi.create(payload);
      toast.success(isEdit ? "Plan updated." : "Plan created.");
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
      title={isEdit ? "Edit plan" : "New plan"}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Create plan"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormError message={formError} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Plan name" required error={errors.name} className="sm:col-span-2">
            <input className={inputClass(errors.name)} value={form.name} onChange={set("name")} maxLength={100} autoFocus />
          </Field>
          <Field label="Billing period" required error={errors.plan_type}>
            <select className={inputClass(errors.plan_type)} value={form.plan_type} onChange={set("plan_type")}>
              {PLAN_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (INR)" required error={errors.price}>
            <input className={inputClass(errors.price)} type="number" min="1" step="0.01" value={form.price} onChange={set("price")} />
          </Field>
          <Field label="Short description" error={errors.description} className="sm:col-span-2">
            <input className={inputClass(errors.description)} value={form.description} onChange={set("description")} />
          </Field>
          <Field label="Features" error={errors.features} hint="One feature per line." className="sm:col-span-2">
            <textarea className={inputClass(errors.features)} rows={4} value={form.features} onChange={set("features")} />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox checked={form.is_active} onChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))} label="Available for sale" />
          </div>
        </div>
      </form>
    </Modal>
  );
}
