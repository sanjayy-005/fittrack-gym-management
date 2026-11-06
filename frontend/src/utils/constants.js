export const ROLES = { ADMIN: "ADMIN", STAFF: "STAFF", TRAINER: "TRAINER" };

export const ALL_ROLES = [ROLES.ADMIN, ROLES.STAFF, ROLES.TRAINER];
export const ADMIN_STAFF = [ROLES.ADMIN, ROLES.STAFF];
export const ADMIN_ONLY = [ROLES.ADMIN];

export const ROLE_LABELS = {
  ADMIN: "Admin",
  STAFF: "Front Desk",
  TRAINER: "Trainer",
};

export const GENDERS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];

export const PLAN_TYPES = [
  { value: "MONTHLY", label: "Monthly (30 days)" },
  { value: "QUARTERLY", label: "Quarterly (90 days)" },
  { value: "YEARLY", label: "Yearly (365 days)" },
];

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
];

export const PAYMENT_STATUSES = [
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "REFUNDED", label: "Refunded" },
];

// Same orange-first palette for every chart.
export const CHART_COLORS = ["#ff6a0d", "#ffa766", "#c73f00", "#8a8a96", "#ffc9a0", "#5c5c68"];
