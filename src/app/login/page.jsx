"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import Banner from "../../components/Banner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-20">
      <p className="eyebrow mb-2 text-center">Welcome back</p>
      <h1 className="text-center font-display text-4xl text-ink-50 dark:text-ink-950">Log in</h1>

      <form onSubmit={handleSubmit} className="card mt-10 space-y-5">
        <Banner tone="error">{error}</Banner>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Email</label>
          <input
            type="email"
            autoFocus
            className="input-field"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link href="/reset-password" className="text-ink-400 hover:text-gold-300 transition dark:text-ink-600">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400 dark:text-ink-600">
        New to Kindred?{" "}
        <Link href="/signup" className="text-gold-400 hover:text-gold-300 transition">Create an account</Link>
      </p>
    </section>
  );
}
