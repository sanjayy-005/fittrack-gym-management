/** Small form validation helpers. They mirror the rules enforced by the Django serializers. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9]{10,13}$/;

export const PHONE_MESSAGE = "Enter 10 to 13 digits (an optional leading + is allowed).";

export function isFutureDate(value, today) {
  return Boolean(value) && value > today; // "YYYY-MM-DD" strings compare correctly
}

/** True when the errors object has no messages. */
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}

/** "" -> null, otherwise a number. Used when building API payloads. */
export function numberOrNull(value) {
  return value === "" || value == null ? null : Number(value);
}
