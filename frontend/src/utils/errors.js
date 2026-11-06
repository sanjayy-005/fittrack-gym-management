/** Turn API errors into short messages a user can understand. */

const LABELS = {
  full_name: "Name",
  member: "Member",
  plan: "Plan",
  payment_method: "Payment method",
  paid_on: "Payment date",
  start_date: "Start date",
  date_of_birth: "Date of birth",
};

function labelize(key) {
  if (LABELS[key]) return LABELS[key];
  const text = key.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function firstMessage(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length ? firstMessage(value[0]) : "";
  if (typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      const message = firstMessage(inner);
      if (message) return key === "non_field_errors" || key === "detail" ? message : `${labelize(key)}: ${message}`;
    }
  }
  return "";
}

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
  if (!error.response) {
    return error.request
      ? "Cannot reach the server. Check your internet connection and that the backend is running."
      : error.message || fallback;
  }

  const { status, data } = error.response;
  if (status === 401) return data?.detail || "Your session has expired. Please log in again.";
  if (status === 403) return data?.detail || "You do not have permission to do this.";
  if (status === 404) return data?.detail || "The requested item was not found.";
  if (status >= 500) return "The server ran into a problem. Please try again in a moment.";
  if (data && typeof data === "object") return firstMessage(data) || fallback;
  return fallback;
}

/** For a 400 response, returns {fieldName: "message"} so forms can show errors under each input. */
export function getFieldErrors(error) {
  const data = error?.response?.data;
  if (error?.response?.status !== 400 || !data || typeof data !== "object" || Array.isArray(data)) return {};
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "detail" || key === "non_field_errors") continue;
    const message = firstMessage(value);
    if (message) result[key] = message;
  }
  return result;
}
