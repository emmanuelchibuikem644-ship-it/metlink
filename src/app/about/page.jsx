"use client";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function AboutPage() {
  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow mb-2">About</p>
        <h1 className="font-display text-4xl text-ink-50">About METLINK</h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-ink-400">
          METLINK is your trusted place for managing bookings, exploring services, and keeping your profile safe and up to date. This area is available after you log in so you can access the full client experience.
        </p>
      </section>
    </ProtectedRoute>
  );
}
