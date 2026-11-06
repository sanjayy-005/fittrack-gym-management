import { useState } from "react";
import { usersApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { EMAIL_RE, PHONE_MESSAGE, PHONE_RE, isValid } from "../../utils/validators";
import Button from "../ui/Button";
import Field, { Checkbox, FormError, inputClass } from "../ui/Field";
import Modal from "../ui/Modal";

function toForm(user) {
  return {
    username: user?.username ?? "",
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "STAFF",
    is_active: user?.is_active ?? true,
    password: "",
  };
}

function validate(form, isEdit) {
  const errors = {};
  if (form.username.trim().length < 3) errors.username = "Username needs at least 3 characters.";
  if (/\s/.test(form.username.trim())) errors.username = "Username cannot contain spaces.";
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) errors.phone = PHONE_MESSAGE;
  if (!isEdit && !form.password) errors.password = "Enter a password.";
  if (form.password && form.password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

/**
 * Create or edit a login account (admin only).
 * Trainer logins are created from the Trainers page, so the role of a trainer account is locked here.
 */
export default function UserFormModal({ user = null, currentUserId, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(user);
  const isTrainerAccount = user?.role === "TRAINER";
  const isSelf = Boolean(user) && user.id === currentUserId;

  const [form, setForm] = useState(() => toForm(user));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form, isEdit);
    setErrors(found);
    if (!isValid(found)) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setFormError("");
    const payload = {
      username: form.username.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      is_active: form.is_active,
    };
    // Trainer accounts and your own account keep their role.
    if (!isTrainerAccount && !isSelf) payload.role = form.role;
    if (form.password) payload.password = form.password;

    try {
      if (isEdit) await usersApi.update(user.id, payload);
      else await usersApi.create(payload);
      toast.success(isEdit ? "User updated." : "User created.");
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
      title={isEdit ? "Edit user" : "Add user"}
      subtitle={isEdit ? undefined : "Create a login for admin or front desk staff."}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Create user"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormError message={formError} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Username" required error={errors.username} className="sm:col-span-2">
            <input className={inputClass(errors.username)} value={form.username} onChange={set("username")} maxLength={150} autoComplete="off" autoFocus />
          </Field>
          <Field label="First name" error={errors.first_name}>
            <input className={inputClass(errors.first_name)} value={form.first_name} onChange={set("first_name")} maxLength={150} />
          </Field>
          <Field label="Last name" error={errors.last_name}>
            <input className={inputClass(errors.last_name)} value={form.last_name} onChange={set("last_name")} maxLength={150} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className={inputClass(errors.email)} type="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input className={inputClass(errors.phone)} type="tel" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field
            label="Role"
            error={errors.role}
            hint={
              isTrainerAccount
                ? "Trainer accounts are managed from the Trainers page."
                : isSelf
                  ? "You cannot change your own role."
                  : "Admins can do everything. Front desk staff cannot manage users or delete payments."
            }
          >
            <select
              className={inputClass(errors.role)}
              value={form.role}
              onChange={set("role")}
              disabled={isTrainerAccount || isSelf}
            >
              {isTrainerAccount ? (
                <option value="TRAINER">Trainer</option>
              ) : (
                <>
                  <option value="STAFF">Front desk staff</option>
                  <option value="ADMIN">Admin</option>
                </>
              )}
            </select>
          </Field>
          <Field
            label={isEdit ? "New password" : "Password"}
            required={!isEdit}
            error={errors.password}
            hint={isEdit ? "Leave empty to keep the current password." : "At least 8 characters, not too common."}
          >
            <input className={inputClass(errors.password)} type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox
              checked={form.is_active}
              disabled={isSelf}
              onChange={(checked) => setForm((previous) => ({ ...previous, is_active: checked }))}
              label={isSelf ? "Active (you cannot deactivate yourself)" : "Active - this person can log in"}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
