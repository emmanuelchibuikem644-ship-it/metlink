"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { Crown, Lock, ArrowRight } from "lucide-react";

export default function SubscriptionRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;

    async function checkSubscription() {
      try {
        const subs = await api.mySubscriptions();
        if (!cancelled) {
          const active = Array.isArray(subs) && subs.some((s) => s.is_active);
          setHasSubscription(active);
        }
      } catch {
        if (!cancelled) setHasSubscription(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkSubscription();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">
        Loading…
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">
        Checking subscription…
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 dark:bg-white">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-400/10">
            <Lock className="h-10 w-10 text-gold-400" />
          </div>
          <h1 className="mt-6 font-display text-3xl text-ink-50 dark:text-ink-950">
            Subscription required
          </h1>
          <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">
            You need an active subscription to access this page. Choose a profile and subscribe to unlock chat, services, and booking.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
          >
            <Crown className="h-5 w-5" />
            Browse profiles to subscribe
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return children;
}