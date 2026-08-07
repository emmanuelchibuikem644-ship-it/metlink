"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import Banner from "../../components/Banner";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    date_of_birth: "",
    gender: "unspecified",
    orientation: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { password2, ...payload } = form;
      await signup(payload);
      router.push("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-20">
      <p className="eyebrow mb-2 text-center">Get started</p>
      <h1 className="text-center font-display text-4xl text-ink-50 dark:text-ink-950">Create your account</h1>
      <p className="mt-3 text-center text-sm text-ink-400 dark:text-ink-600">You must be 18 or older to join Kindred.</p>

      <form onSubmit={handleSubmit} className="card mt-10 space-y-5">
        <Banner tone="error">{error}</Banner>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Display name</label>
          <input
            className="input-field"
            placeholder="First name"
            required
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Date of birth</label>
          <input
            type="date"
            className="input-field"
            required
            value={form.date_of_birth}
            onChange={(e) => update("date_of_birth", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Gender</label>
          <select
            className="input-field"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="woman">Woman</option>
            <option value="man">Man</option>
            <option value="nonbinary">Non-binary</option>
            <option value="other">Prefer to self-describe</option>
            <option value="unspecified">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">I'm interested in</label>
          <select
            className="input-field"
            required
            value={form.orientation}
            onChange={(e) => update("orientation", e.target.value)}
          >
            <option value="" disabled>Select your preference</option>
            <option value="straight">Straight</option>
            <option value="gay">Gay</option>
            <option value="bisexual">Bisexual</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Create a password"
            required
            minLength={10}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-400 dark:text-ink-600">Confirm password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Confirm your password"
            required
            value={form.password2}
            onChange={(e) => update("password2", e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400 dark:text-ink-600">
        Already have an account?{" "}
        <Link href="/login" className="text-gold-400 hover:text-gold-300 transition">Log in</Link>
      </p>
    </section>
  );
}
