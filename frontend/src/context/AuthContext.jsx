import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api";
import { tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token is saved, we must check it with the server before deciding where to send the user.
  const [initializing, setInitializing] = useState(Boolean(tokenStore.access));

  useEffect(() => {
    let active = true;
    if (!tokenStore.access) {
      setInitializing(false);
      return undefined;
    }
    authApi
      .me()
      .then((profile) => active && setUser(profile))
      .catch(() => tokenStore.clear())
      .finally(() => active && setInitializing(false));
    return () => {
      active = false;
    };
  }, []);

  // The API client fires this event when the session can no longer be refreshed.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    tokenStore.set(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh;
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      /* already expired - the user is logged out either way */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      logout,
      /** can("ADMIN", "STAFF") -> true when the current user has one of those roles */
      can: (...roles) => Boolean(user) && roles.includes(user.role),
    }),
    [user, initializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
