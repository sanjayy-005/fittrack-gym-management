/**
 * A form row: label + input + error/hint text.
 *
 *   <Field label="Email" required error={errors.email}>
 *     <input className={inputClass(errors.email)} ... />
 *   </Field>
 */
export function inputClass(error) {
  return `input ${error ? "input-error" : ""}`;
}

export default function Field({ label, error, hint, required = false, as: Tag = "label", className = "", children }) {
  return (
    <Tag className={`block ${className}`}>
      <span className="label">
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-300">{hint}</span>
      ) : null}
    </Tag>
  );
}

export function Checkbox({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`flex items-center gap-2.5 text-sm text-ink-100 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-ink-500 bg-ink-900 accent-brand-500"
      />
      {label}
    </label>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}
