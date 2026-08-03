"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import Banner from "../../components/Banner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.adminLogin(email, password);
      // Store admin token in sessionStorage (cleared when browser tab closes)
      window.sessionStorage.setItem("admin_token", res.token);
      window.sessionStorage.setItem("admin_user", JSON.stringify(res.user));
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
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
            placeholder="admin@metlink.com"
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