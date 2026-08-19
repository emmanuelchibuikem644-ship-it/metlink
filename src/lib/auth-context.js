"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, getTokens, setTokens } from "./api";
import { getRegisteredUsers, registerUser, recordUserLogin } from "../data/admin";

const AuthContext = createContext(null);
const PROFILE_PIC_KEY = "Meetlink_profile_pic";
const BACKGROUND_PIC_KEY = "Meetlink_background_pic";
const ORIENTATION_KEY = "Meetlink_orientation";

// How long to wait for the backend before falling back to local auth.
const BACKEND_TIMEOUT_MS = 12000;

function attachProfilePic(userData) {
  if (typeof window === "undefined") return userData;
  const profilePic = window.localStorage.getItem(PROFILE_PIC_KEY);
  const backgroundPic = window.localStorage.getItem(BACKGROUND_PIC_KEY);
  return {
    ...userData,
    ...(profilePic ? { profile_pic: profilePic } : {}),
    ...(backgroundPic ? { background_pic: backgroundPic } : {}),
  };
}

function saveProfilePic(pic) {
  if (typeof window === "undefined") return;
  if (pic) {
    window.localStorage.setItem(PROFILE_PIC_KEY, pic);
  } else {
    window.localStorage.removeItem(PROFILE_PIC_KEY);
  }
}

function saveBackgroundPic(pic) {
  if (typeof window === "undefined") return;
  if (pic) {
    window.localStorage.setItem(BACKGROUND_PIC_KEY, pic);
  } else {
    window.localStorage.removeItem(BACKGROUND_PIC_KEY);
  }
}

function saveOrientation(value) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(ORIENTATION_KEY, value);
  } else {
    window.localStorage.removeItem(ORIENTATION_KEY);
  }
}

// Race a promise against a timeout so we never hang on a slow backend.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = getTokens();
    if (!tokens?.access) {
      setLoading(false);
      return;
    }
    // Try to refresh the user from the backend, but never hang.
    withTimeout(
      api.me().then((me) => {
        const userData = attachProfilePic(me);
        if (!userData.orientation) {
          const saved = typeof window !== "undefined" ? window.localStorage.getItem(ORIENTATION_KEY) : null;
          if (saved) userData.orientation = saved;
        }
        setUser(userData);
      }),
      BACKEND_TIMEOUT_MS
    )
      .catch(() => {
        // Backend unreachable — fall back to the locally registered user.
        const local = getRegisteredUsers();
        if (local.length > 0) {
          const last = local[local.length - 1];
          setUser(attachProfilePic(last));
        } else {
          setTokens(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Signup: register locally immediately, then sync to backend ──
  async function signup(payload) {
    // 1) Register locally right away so the user is logged in instantly.
    const localUser = registerUser({
      ...payload,
      id: Date.now(),
      display_name: payload.display_name || payload.email,
    });
    const localData = attachProfilePic(localUser);
    if (payload.orientation) saveOrientation(payload.orientation);
    if (localData.orientation) saveOrientation(localData.orientation);
    setUser(localData);

    // 2) Try to create the account on the backend (best-effort, with timeout).
    try {
      const data = await withTimeout(api.signup(payload), BACKEND_TIMEOUT_MS);
      if (data?.access) {
        setTokens({ access: data.access, refresh: data.refresh });
        const userData = attachProfilePic(data.user || localData);
        if (userData.orientation) saveOrientation(userData.orientation);
        setUser(userData);
      }
      return data;
    } catch {
      // Backend unavailable — keep the local session.
      return { user: localData, local: true };
    }
  }

  // ── Login: check local users first, then backend ──
  async function login(payload) {
    const email = (payload.email || "").toLowerCase().trim();

    // 1) Check locally registered users first — instant login.
    const localUsers = getRegisteredUsers();
    const localMatch = localUsers.find(
      (u) => (u.email || "").toLowerCase() === email
    );
    if (localMatch) {
      recordUserLogin(email);
      const userData = attachProfilePic(localMatch);
      if (!userData.orientation) {
        const saved = typeof window !== "undefined" ? window.localStorage.getItem(ORIENTATION_KEY) : null;
        if (saved) userData.orientation = saved;
      }
      setUser(userData);
      return { user: userData, local: true };
    }

    // 2) Otherwise try the backend (with timeout).
    try {
      const data = await withTimeout(api.login(payload), BACKEND_TIMEOUT_MS);
      if (data?.access) {
        setTokens({ access: data.access, refresh: data.refresh });
      }
      const userData = attachProfilePic(data.user);
      if (!userData.orientation) {
        const saved = typeof window !== "undefined" ? window.localStorage.getItem(ORIENTATION_KEY) : null;
        if (saved) userData.orientation = saved;
      }
      // Register in local admin system so future logins are instant.
      registerUser({ ...payload, ...userData, id: userData.id || Date.now() });
      recordUserLogin(email);
      setUser(userData);
      return data;
    } catch (err) {
      // Backend unreachable and no local match — surface a clear error.
      throw new Error(
        "Could not log in. Please check your connection and try again, or create an account."
      );
    }
  }

  async function logout() {
    const tokens = getTokens();
    try {
      await withTimeout(api.logout(tokens?.refresh), 5000);
    } catch {
      // ignore — we clear local state regardless
    }
    setTokens(null);
    saveProfilePic(null);
    setUser(null);
  }

  async function refreshMe() {
    try {
      const me = await withTimeout(api.me(), BACKEND_TIMEOUT_MS);
      const userData = attachProfilePic(me);
      if (!userData.orientation) {
        const saved = typeof window !== "undefined" ? window.localStorage.getItem(ORIENTATION_KEY) : null;
        if (saved) userData.orientation = saved;
      }
      setUser(userData);
      return me;
    } catch {
      return user;
    }
  }

  function updateProfilePic(image) {
    saveProfilePic(image);
    setUser((current) => (current ? { ...current, profile_pic: image } : current));
    return image;
  }

  function updateBackgroundPic(image) {
    saveBackgroundPic(image);
    setUser((current) => (current ? { ...current, background_pic: image } : current));
    return image;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, refreshMe, updateProfilePic, updateBackgroundPic }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}