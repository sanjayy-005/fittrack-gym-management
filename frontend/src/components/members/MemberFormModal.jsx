import { useState } from "react";
import { membersApi, trainersApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { useFetch } from "../../hooks/useFetch";
import { GENDERS } from "../../utils/constants";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { todayISO } from "../../utils/format";
import { EMAIL_RE, PHONE_MESSAGE, PHONE_RE, isFutureDate, isValid, numberOrNull } from "../../utils/validators";
import Button from "../ui/Button";
import Field, { Checkbox, FormError, inputClass } from "../ui/Field";
import Modal from "../ui/Modal";

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  gender: "M",
  date_of_birth: "",
  joined_date: "",
  height_cm: "",
  weight_kg: "",
  trainer: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
  is_active: true,
};

function toForm(member) {
  if (!member) return { ...EMPTY, joined_date: todayISO() };
  const form = { ...EMPTY };
  Object.keys(EMPTY).forEach((key) => {
    if (member[key] !== null && member[key] !== undefined) form[key] = member[key];
  });
  return form;
}

function validate(form) {
  const errors = {};
  const today = todayISO();
  if (form.full_name.trim().length < 2) errors.full_name = "Enter the member's full name.";
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!PHONE_RE.test(form.phone.trim())) errors.phone = PHONE_MESSAGE;
  if (isFutureDate(form.date_of_birth, today)) errors.date_of_birth = "Date of birth cannot be in the future.";
  if (!form.joined_date) errors.joined_date = "Choose the joining date.";
  if (form.height_cm !== "" && (Number(form.height_cm) < 50 || Number(form.height_cm) > 260)) errors.height_cm = "Height must be between 50 and 260 cm.";
  if (form.weight_kg !== "" && (Number(form.weight_kg) < 20 || Number(form.weight_kg) > 400)) errors.weight_kg = "Weight must be between 20 and 400 kg.";
  if (form.emergency_contact_phone.trim() && !PHONE_RE.test(form.emergency_contact_phone.trim())) {
    errors.emergency_contact_phone = PHONE_MESSAGE;
  }
  return errors;
}

/** Add a new member (member = null) or edit an existing one. */
export default function MemberFormModal({ member = null, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(member);
  const { data: trainerData } = useFetch(() => trainersApi.list({ is_active: true, page_size: 100 }), []);
  const trainers = trainerData?.results ?? [];

  const [form, setForm] = useState(() => toForm(member));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  // Keep an already assigned trainer in the list even if they were deactivated later.
  const trainerOptions =
    member?.trainer && !trainers.some((t) => t.id === member.trainer)
      ? [...trainers, { id: member.trainer, full_name: `${member.trainer_name} (inactive)` }]
      : trainers;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (!isValid(found)) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setFormError("");
    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      emergency_contact_name: form.emergency_contact_name.trim(),
      emergency_contact_phone: form.emergency_contact_phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      date_of_birth: form.date_of_birth || null,
      height_cm: numberOrNull(form.height_cm),
      weight_kg: numberOrNull(form.weight_kg),
      trainer: numberOrNull(form.trainer),
    };

    try {
      if (isEdit) await membersApi.update(member.id, payload);
      else await membersApi.create(payload);
      toast.success(isEdit ? "Member updated." : "Member added.");
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
      title={isEdit ? "Edit member" : "Add member"}
      subtitle={isEdit ? member.member_code : "A member ID is created automatically."}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Add member"}
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
            <input className={inputClass(errors.phone)} type="tel" value={form.phone} onChange={set("phone")} placeholder="9876543210" />
          </Field>
          <Field label="Gender" error={errors.gender}>
            <select className={inputClass(errors.gender)} value={form.gender} onChange={set("gender")}>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date of birth" error={errors.date_of_birth}>
            <input className={inputClass(errors.date_of_birth)} type="date" max={todayISO()} value={form.date_of_birth} onChange={set("date_of_birth")} />
          </Field>
          <Field label="Joined on" required error={errors.joined_date}>
            <input className={inputClass(errors.joined_date)} type="date" value={form.joined_date} onChange={set("joined_date")} />
          </Field>
          <Field label="Trainer" error={errors.trainer}>
            <select className={inputClass(errors.trainer)} value={form.trainer} onChange={set("trainer")}>
              <option value="">No trainer</option>
              {trainerOptions.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Height (cm)" error={errors.height_cm}>
            <input className={inputClass(errors.height_cm)} type="number" min="50" max="260" value={form.height_cm} onChange={set("height_cm")} />
          </Field>
          <Field label="Weight (kg)" error={errors.weight_kg}>
            <input className={inputClass(errors.weight_kg)} type="number" min="20" max="400" step="0.1" value={form.weight_kg} onChange={set("weight_kg")} />
          </Field>
          <Field label="Emergency contact name" error={errors.emergency_contact_name}>
            <input className={inputClass(errors.emergency_contact_name)} value={form.emergency_contact_name} onChange={set("emergency_contact_name")} maxLength={100} />
          </Field>
          <Field label="Emergency contact phone" error={errors.emergency_contact_phone}>
            <input className={inputClass(errors.emergency_contact_phone)} type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
          </Field>
          <Field label="Address" error={errors.address} className="sm:col-span-2">
            <textarea className={inputClass(errors.address)} rows={2} value={form.address} onChange={set("address")} />
          </Field>
          <Field label="Notes" error={errors.notes} className="sm:col-span-2" hint="Injuries, goals or anything the team should know.">
            <textarea className={inputClass(errors.notes)} rows={2} value={form.notes} onChange={set("notes")} />
          </Field>
          {isEdit && (
            <div className="sm:col-span-2">
              <Checkbox
                checked={form.is_active}
                onChange={(checked) => setForm((previous) => ({ ...previous, is_active: checked }))}
                label="Active member (inactive members cannot check in or buy plans)"
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
