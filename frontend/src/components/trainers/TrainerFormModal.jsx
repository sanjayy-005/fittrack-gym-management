import { useState } from "react";
import { trainersApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { todayISO } from "../../utils/format";
import { EMAIL_RE, PHONE_MESSAGE, PHONE_RE, isValid } from "../../utils/validators";
import Button from "../ui/Button";
import Field, { Checkbox, FormError, inputClass } from "../ui/Field";
import Modal from "../ui/Modal";

function toForm(trainer) {
  return {
    full_name: trainer?.full_name ?? "",
    email: trainer?.email ?? "",
    phone: trainer?.phone ?? "",
    specialization: trainer?.specialization ?? "",
    experience_years: trainer?.experience_years ?? 0,
    joined_date: trainer?.joined_date ?? todayISO(),
    bio: trainer?.bio ?? "",
    is_active: trainer?.is_active ?? true,
    username: "",
    password: "",
  };
}

function validate(form, hasLogin) {
  const errors = {};
  if (form.full_name.trim().length < 2) errors.full_name = "Enter the trainer's full name.";
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!PHONE_RE.test(form.phone.trim())) errors.phone = PHONE_MESSAGE;
  if (!form.specialization.trim()) errors.specialization = "Enter a specialization, e.g. Yoga.";
  const years = Number(form.experience_years);
  if (form.experience_years === "" || Number.isNaN(years) || years < 0 || years > 60) errors.experience_years = "Enter 0 to 60 years.";
  if (!hasLogin) {
    if (form.username.trim() && form.username.trim().length < 3) errors.username = "Username needs at least 3 characters.";
    if ((form.username.trim() || form.password) && !form.password) errors.password = "Enter a password for the login.";
    if (form.password && !form.username.trim()) errors.username = "Enter a username for the login.";
  }
  if (form.password && form.password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

export default function TrainerFormModal({ trainer = null, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(trainer);
  const hasLogin = Boolean(trainer?.login_username);

  const [form, setForm] = useState(() => toForm(trainer));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form, hasLogin);
    setErrors(found);
    if (!isValid(found)) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setFormError("");
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      specialization: form.specialization.trim(),
      experience_years: Number(form.experience_years),
      joined_date: form.joined_date,
      bio: form.bio.trim(),
      is_active: form.is_active,
    };
    if (form.username.trim()) payload.username = form.username.trim();
    if (form.password) payload.password = form.password;

    try {
      if (isEdit) await trainersApi.update(trainer.id, payload);
      else await trainersApi.create(payload);
      toast.success(isEdit ? "Trainer updated." : "Trainer added.");
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
      size="lg"
      title={isEdit ? "Edit trainer" : "Add trainer"}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Add trainer"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormError message={formError} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.full_name} className="sm:col-span-2">
            <input className={inputClass(errors.full_name)} value={form.full_name} onChange={set("full_name")} maxLength={100} autoFocus />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input className={inputClass(errors.email)} type="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input className={inputClass(errors.phone)} type="tel" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Specialization" required error={errors.specialization}>
            <input className={inputClass(errors.specialization)} value={form.specialization} onChange={set("specialization")} placeholder="Strength, Yoga, CrossFit..." maxLength={100} />
          </Field>
          <Field label="Experience (years)" required error={errors.experience_years}>
            <input className={inputClass(errors.experience_years)} type="number" min="0" max="60" value={form.experience_years} onChange={set("experience_years")} />
          </Field>
          <Field label="Joined on" error={errors.joined_date}>
            <input className={inputClass(errors.joined_date)} type="date" value={form.joined_date} onChange={set("joined_date")} />
          </Field>
          <div className="flex items-end pb-2">
            <Checkbox checked={form.is_active} onChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))} label="Active trainer" />
          </div>
          <Field label="Bio" error={errors.bio} className="sm:col-span-2">
            <textarea className={inputClass(errors.bio)} rows={2} value={form.bio} onChange={set("bio")} />
          </Field>

          <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4 sm:col-span-2">
            <p className="font-display text-lg font-bold uppercase tracking-wide">Login account</p>
            {hasLogin ? (
              <p className="mb-3 text-sm text-ink-300">
                This trainer logs in as <span className="font-semibold text-brand-400">{trainer.login_username}</span>. Enter a new password below only if you want to change it.
              </p>
            ) : (
              <p className="mb-3 text-sm text-ink-300">Optional. Give the trainer a login so they can see their own members.</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {!hasLogin && (
                <Field label="Username" error={errors.username}>
                  <input className={inputClass(errors.username)} value={form.username} onChange={set("username")} autoComplete="off" />
                </Field>
              )}
              <Field label={hasLogin ? "New password" : "Password"} error={errors.password} hint="At least 8 characters.">
                <input className={inputClass(errors.password)} type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
              </Field>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
