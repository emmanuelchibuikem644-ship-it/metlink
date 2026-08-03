"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import Banner from "../../components/Banner";

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.requestPasswordReset({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card mt-10 text-center">
        <p className="text-sm text-ink-400">
          If that email is registered, we&apos;ve sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-10 space-y-5">
      <Banner tone="error">{error}</Banner>
      <div>
        <label className="mb-1.5 block text-sm text-ink-400">Email</label>
        <input
          type="email"
          className="input-field"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

function SetNewPasswordForm({ uid, token }) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.confirmPasswordReset({ uid, token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card mt-10 text-center">
        <p className="text-sm text-gold-300">Your password has been updated.</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">Log in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-10 space-y-5">
      <Banner tone="error">{error}</Banner>
      <div>
        <label className="mb-1.5 block text-sm text-ink-400">New password</label>
        <input
          type="password"
          className="input-field"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-ink-400">Confirm new password</label>
        <input
          type="password"
          className="input-field"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-20">
      <p className="eyebrow mb-2 text-center">Account recovery</p>
      <h1 className="text-center font-display text-4xl text-ink-50">
        {uid && token ? "Set a new password" : "Reset your password"}
      </h1>
      {!uid && !token && (
        <p className="mt-3 text-center text-sm text-ink-400">Enter your email and we&apos;ll send you a link to reset it.</p>
      )}
      {uid && token ? <SetNewPasswordForm uid={uid} token={token} /> : <RequestResetForm />}
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-ink-400">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
