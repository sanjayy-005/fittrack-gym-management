import { Link, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Members from "./pages/Members";
import Memberships from "./pages/Memberships";
import Payments from "./pages/Payments";
import Plans from "./pages/Plans";
import Trainers from "./pages/Trainers";
import Users from "./pages/Users";
import { ADMIN_ONLY, ADMIN_STAFF } from "./utils/constants";

function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="font-display text-8xl font-bold text-brand-500">404</p>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Page not found</h1>
      <Link to="/" className="btn btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Everything below needs a logged in user. Some pages are limited to certain roles. */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route
          path="trainers"
          element={
            <ProtectedRoute roles={ADMIN_STAFF}>
              <Trainers />
            </ProtectedRoute>
          }
        />
        <Route path="plans" element={<Plans />} />
        <Route path="memberships" element={<Memberships />} />
        <Route
          path="payments"
          element={
            <ProtectedRoute roles={ADMIN_STAFF}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route path="attendance" element={<Attendance />} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={ADMIN_ONLY}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
