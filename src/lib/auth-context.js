"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, getTokens, setTokens } from "./api";
import { registerUser, recordUserLogin } from "../data/admin";

const AuthContext = createContext(null);
const PROFILE_PIC_KEY = "Metlink_profile_pic";
const BACKGROUND_PIC_KEY = "Metlink_background_pic";
const ORIENTATION_KEY = "Metlink_orientation";

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = getTokens();
    if (!tokens?.access) {
      setLoading(false);
      return;
    }
    // Timeout after 10 seconds to avoid hanging if backend is slow/sleeping
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );
    Promise.race([
      api.me().then((me) => {
        const userData = attachProfilePic(me);
        if (!userData.orientation) {
          const saved = typeof window !== "undefined" ? window.localStorage.getItem(ORIENTATION_KEY) : null;
          if (saved) userData.orientation = saved;
        }
        setUser(userData);
      }),
      timeoutPromise
    ]).catch(() => setTokens(null))
      .finally(() => setLoading(false));
  }, []);

  async function signup(payload) {
    const data = await api.signup(payload);
    setTokens({ access: data.access, refresh: data.refresh });
    const userData = attachProfilePic(data.user);
    // Save orientation to localStorage as fallback if backend doesn't return it
    if (payload.orientation) saveOrientation(payload.orientation);
    if (userData.orientation) saveOrientation(userData.orientation);
    // Register user in local admin system
    registerUser({ ...payload, ...userData });
    setUser(userData);
    return data;
  }

  async function login(payload) {
    const data = await api.login(payload);
    setTokens({ access: data.access, refresh: data.refresh });
    const userData = attachProfilePic(data.user);
    // Preserve orientation from localStorage if backend didn't return it
    if (!userData.orientation) {
      const savedOrientation = typeof window !== "undefined" ? window.localStorage.getItem(ORIENTATION_KEY) : null;
      if (savedOrientation) userData.orientation = savedOrientation;
    }
    // Record login in admin system
    recordUserLogin(payload.email);
    setUser(userData);
    return data;
  }

  async function logout() {
    const tokens = getTokens();
    try {
      await api.logout(tokens?.refresh);
    } catch {
      // ignore — we clear local state regardless
    }
    setTokens(null);
    saveProfilePic(null);
    setUser(null);
  }

  async function refreshMe() {
    const me = await api.me();
    const userData = attachProfilePic(me);
    if (!userData.orientation) {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(ORIENTATION_KEY) : null;
      if (saved) userData.orientation = saved;
    }
    setUser(userData);
    return me;
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
