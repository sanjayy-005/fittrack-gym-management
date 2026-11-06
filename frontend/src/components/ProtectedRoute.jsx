import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "./ui/States";

/**
 * Wrap a page to protect it.
 *   <ProtectedRoute>                      -> any logged in user
 *   <ProtectedRoute roles={["ADMIN"]}>    -> only those roles (others see "Access denied")
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader fullScreen label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-brand-500" />
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide">Access denied</h1>
        <p className="max-w-sm text-sm text-ink-300">Your account does not have permission to open this page.</p>
      </div>
    );
  }
  return children;
}
