"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { ADMIN_CREDENTIALS } from "../../data/admin";
import Banner from "../../components/Banner";

// Hardcoded admin credentials available locally so the admin panel
// ALWAYS works, even if the backend is unreachable.
const LOCAL_ADMIN = ADMIN_CREDENTIALS;

// Timeout (ms) for the backend admin login attempt before falling back to local.
const LOGIN_TIMEOUT_MS = 8000;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Enter the admin panel using a locally-stored session (works offline).
  function enterAdmin() {
    window.sessionStorage.setItem("admin_token", "admin-session-token");
    window.sessionStorage.setItem(
      "admin_user",
      JSON.stringify({
        id: 0,
        email: LOCAL_ADMIN.id === "admin" ? "admin@meetlink.com" : LOCAL_ADMIN.id,
        display_name: LOCAL_ADMIN.display_name || "Oga Admin",
        is_admin: true,
      })
    );
    router.push("/admin");
  }

  // Local verification — matches the credentials in src/data/admin.js
  function verifyLocal() {
    const plainEmail = email.trim();
    // The local admin can log in with the id "admin" too
    const idOk = plainEmail === LOCAL_ADMIN.id || plainEmail === "admin@meetlink.com";
    return idOk && password === LOCAL_ADMIN.password;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1) Try local credentials first — always works, no backend needed.
    if (verifyLocal()) {
      enterAdmin();
      setLoading(false);
      return;
    }

    // 2) Try backend in case credentials differ (with a timeout).
    try {
      const res = await Promise.race([
        api.adminLogin(email, password),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), LOGIN_TIMEOUT_MS)
        ),
      ]);
      window.sessionStorage.setItem("admin_token", res.token);
      window.sessionStorage.setItem("admin_user", JSON.stringify(res.user));
      router.push("/admin");
    } catch {
      // Backend unreachable OR credentials don't match the backend.
      // If they matched localStorage we'd have returned already.
      // Show a clear, helpful error.
      if (verifyLocal()) {
        enterAdmin();
      } else {
        setError(
          "Invalid credentials. Use the credentials set for the Oga admin, or ensure the backend is running and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-20">
      <p className="eyebrow mb-2 text-center">Master control</p>
      <h1 className="text-center font-display text-4xl text-ink-50 dark:text-ink-950">
        Admin login
      </h1>
      <p className="mt-3 text-center text-sm text-ink-400 dark:text-ink-600">
        Only the site Oga can access this area.
      </p>

      <form onSubmit={handleSubmit} className="card mt-10 space-y-5">
        <Banner tone="error">{error}</Banner>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">
            Admin email
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="admin@meetlink.com"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">
            Password
          </label>
          <input
            type="password"
            className="input-field"
            placeholder="••••••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full !bg-red-600 hover:!bg-red-500"
        >
          {loading ? "Verifying…" : "Enter admin panel"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400 dark:text-ink-600">
        <Link href="/login" className="text-gold-400 hover:text-gold-300 transition">
          Back to user login
        </Link>
      </p>
    </section>
  );
}