import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, Eye, EyeOff, LogIn } from "lucide-react";
import Button from "../components/ui/Button";
import Field, { FormError, inputClass } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";

// These accounts exist after running "python manage.py seed_data".
const DEMO_ACCOUNTS = [
  { label: "Admin", username: "admin", password: "Admin@123" },
  { label: "Front desk", username: "staff", password: "Staff@123" },
  { label: "Trainer", username: "arjun", password: "Trainer@123" },
];

export default function Login() {
  const { user, login, initializing } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  if (!initializing && user) return <Navigate to={redirectTo} replace />;

  const update = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!form.username.trim()) found.username = "Enter your username.";
    if (!form.password) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setFormError("");
    try {
      const loggedIn = await login(form.username.trim(), form.password);
      toast.success(`Welcome back, ${loggedIn.first_name || loggedIn.username}!`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(
        error?.response?.status === 401
          ? "Incorrect username or password."
          : getErrorMessage(error, "Could not log in. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-brand-700/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-ink-950 shadow-glow">
            <Dumbbell className="h-7 w-7" />
          </span>
          <h1 className="font-display text-5xl font-bold uppercase tracking-wider">
            Fit<span className="text-brand-500">Track</span>
          </h1>
          <p className="mt-1 text-sm text-ink-300">Gym management, simplified.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Sign in</h2>
          <FormError message={formError} />

          <Field label="Username" error={errors.username}>
            <input
              className={inputClass(errors.username)}
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
              autoFocus
              placeholder="e.g. admin"
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                className={`${inputClass(errors.password)} pr-11`}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                autoComplete="current-password"
                placeholder="Your password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Button type="submit" className="w-full" loading={submitting}>
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-ink-700 bg-ink-900/70 p-4">
          <p className="mb-3 text-center text-xs text-ink-300">
            Demo accounts (available after running <code className="text-brand-400">seed_data</code>) - click to fill in:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setForm({ username: account.username, password: account.password });
                  setErrors({});
                  setFormError("");
                }}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
