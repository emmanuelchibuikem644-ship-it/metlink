"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import Banner from "../../components/Banner";

const INTERVAL_LABEL = { none: "", monthly: "/monthly", yearly: "/yearly" };

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(null);

  useEffect(() => {
    api.plans().then(setPlans).catch((err) => setError(err.message));
    if (user) {
      api
        .mySubscription()
        .then((sub) => setCurrentPlanId(sub?.plan?.id ?? null))
        .catch(() => {});
    }
  }, [user]);

  async function handleChoose(plan) {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setError("");
    setCheckingOut(plan.code);
    try {
      const res = await api.startCheckout(plan.code);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        setCurrentPlanId(plan.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="text-center">
        <p className="eyebrow mb-2">Membership</p>
        <h1 className="font-display text-4xl text-ink-50 md:text-5xl">Choose how you want to connect.</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-400">
          Start free. Upgrade whenever you want unlimited likes, advanced filters, and more visibility.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-xl">
        <Banner tone="error">{error}</Banner>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.code}
            className={`card flex flex-col ${plan.code === "premium-yearly" ? "border-gold-400/50 shadow-glow" : ""}`}
          >
            {plan.code === "premium-yearly" && <span className="eyebrow mb-3">Best value</span>}
            {plan.code === "premium-year" && <span className="eyebrow mb-3">Save 20%</span>}
            <h2 className="font-display text-2xl italic text-ink-50">{plan.name}</h2>
            <p className="mt-4">
              <span className="font-display text-4xl text-gold-300">{plan.price_display}</span>
              <span className="text-sm text-ink-400">{INTERVAL_LABEL[plan.interval]}</span>
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-ink-400">
              <li>{plan.unlimited_likes ? "✓" : "—"} Unlimited likes</li>
              <li>{plan.unlimited_messaging ? "✓" : "—"} Unlimited messaging</li>
              <li>{plan.advanced_filters ? "✓" : "—"} Advanced search filters</li>
              <li>{plan.profile_boost ? "✓" : "—"} Profile boost</li>
              <li>{plan.see_who_liked_you ? "✓" : "—"} See who liked you</li>
              <li>{plan.see_profile_viewers ? "✓" : "—"} See profile viewers</li>
            </ul>

            <div className="mt-8">
              {currentPlanId === plan.id ? (
                <span className="btn-secondary w-full !cursor-default opacity-70">Your current plan</span>
              ) : (
                <button
                  onClick={() => handleChoose(plan)}
                  disabled={checkingOut === plan.code}
                  className="btn-primary w-full"
                >
                  {checkingOut === plan.code
                    ? "Redirecting…"
                    : plan.price_cents === 0
                    ? "Get started"
                    : "Upgrade"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-ink-500">Payments processed securely via Stripe. Cancel anytime.</p>
    </section>
  );
}
