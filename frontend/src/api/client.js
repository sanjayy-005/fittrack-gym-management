import axios from "axios";

/**
 * One configured axios instance used for every API call.
 *  - adds the JWT access token to each request
 *  - if the token has expired, silently gets a new one with the refresh token and retries
 *  - if that fails too, logs the user out
 */
export const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

const ACCESS_KEY = "fittrack_access";
const REFRESH_KEY = "fittrack_refresh";

// localStorage can throw (private mode, blocked cookies), so every access is wrapped.
function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable - the user will simply have to log in again next time */
  }
}

export const tokenStore = {
  get access() {
    return read(ACCESS_KEY);
  },
  get refresh() {
    return read(REFRESH_KEY);
  },
  set(access, refresh) {
    write(ACCESS_KEY, access);
    if (refresh) write(REFRESH_KEY, refresh);
  },
  clear() {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Only one refresh request at a time, even if several API calls fail together.
let refreshPromise = null;
function refreshAccessToken() {
  if (!refreshPromise) {
    const refresh = tokenStore.refresh;
    if (!refresh) return Promise.reject(new Error("No refresh token"));
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh/`, { refresh }, { timeout: 20000 })
      .then((res) => {
        tokenStore.set(res.data.access, res.data.refresh);
        return res.data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function forceLogout() {
  tokenStore.clear();
  window.dispatchEvent(new Event("auth:logout"));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";
    const isAuthCall = url.includes("/auth/login/") || url.includes("/auth/refresh/");

    if (status === 401 && original && !original._retry && !isAuthCall && tokenStore.refresh) {
      original._retry = true;
      try {
        const access = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        forceLogout();
        return Promise.reject(error);
      }
    }
    if (status === 401 && !isAuthCall) forceLogout();
    return Promise.reject(error);
  }
);

export default api;
