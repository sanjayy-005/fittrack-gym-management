import Field, { Checkbox, inputClass } from "../ui/Field";
import { PAYMENT_METHODS } from "../../utils/constants";

export const DEFAULT_PAYMENT_OPTIONS = { record_payment: true, payment_method: "CASH", amount: "" };

/** Validation for the payment part of the sell / renew forms. */
export function validatePaymentOptions(options) {
  const errors = {};
  if (options.record_payment) {
    if (!options.payment_method) errors.payment_method = "Select how the member paid.";
    if (options.amount !== "" && !(Number(options.amount) > 0)) errors.amount = "Amount must be greater than 0.";
  }
  return errors;
}

/** The fields the API expects for these options. */
export function paymentPayload(options) {
  const payload = { record_payment: options.record_payment };
  if (options.record_payment) {
    payload.payment_method = options.payment_method;
    if (options.amount !== "") payload.amount = options.amount;
  }
  return payload;
}

export default function PaymentOptionsFields({ value, onChange, errors = {}, defaultAmount }) {
  const set = (field, fieldValue) => onChange({ ...value, [field]: fieldValue });

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4">
      <Checkbox
        checked={value.record_payment}
        onChange={(checked) => set("record_payment", checked)}
        label="Record the payment now (creates a receipt)"
      />
      {value.record_payment && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Payment method" error={errors.payment_method} required>
            <select className={inputClass(errors.payment_method)} value={value.payment_method} onChange={(e) => set("payment_method", e.target.value)}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (INR)" error={errors.amount} hint={defaultAmount ? `Leave empty to charge the plan price (${defaultAmount}).` : "Leave empty to charge the plan price."}>
            <input
              className={inputClass(errors.amount)}
              type="number"
              min="0"
              step="0.01"
              value={value.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="Plan price"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
