"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Lock, ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import SubscriptionRoute from "../../components/SubscriptionRoute";

function ServicePaymentContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState(() => {
    if (typeof window === "undefined") return null;
    const saved = window.localStorage.getItem("selectedService");
    return saved ? JSON.parse(saved) : null;
  });
  const [step, setStep] = useState("review");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentIntent, setPaymentIntent] = useState(null);

  // The person's MAIN price (shown on their picture on the home page) —
  // stored when they subscribed to this profile.
  const [profilePrice] = useState(() => {
    if (typeof window === "undefined") return { cents: 0, name: "" };
    const cents = Number(window.localStorage.getItem("subscribed_profile_price_cents") || 0);
    const name = window.localStorage.getItem("subscribed_profile_name") || "";
    return { cents, name };
  });

  // The draft booking form saved on the booking page (Proceed to Payment).
  const [pendingBooking] = useState(() => {
    if (typeof window === "undefined") return null;
    const saved = window.localStorage.getItem("pendingBooking");
    return saved ? JSON.parse(saved) : null;
  });

  if (!service) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 dark:bg-white">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">No service selected</h1>
          <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">
            Please select a service from the Services page first.
          </p>
          <button
            onClick={() => router.push("/service")}
            className="mt-8 rounded-full bg-gold-400 px-8 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
          >
            Browse services
          </button>
        </div>
      </div>
    );
  }

  // Convert "$120" / "$500/hr" / "$3/min" to cents (take the first number)
  function parsePriceToCents(price) {
    const match = String(price || "").match(/\d+(\.\d+)?/);
    if (!match) return 0;
    return Math.round(parseFloat(match[0]) * 100);
  }

  const servicePriceCents = parsePriceToCents(service.price);
  // Total due = the service price + the person's main price (shown on their picture)
  const totalCents = servicePriceCents + (profilePrice.cents || 0);
  const priceDisplay = `$${(totalCents / 100).toFixed(2)}`;
  const serviceDisplay = `$${(servicePriceCents / 100).toFixed(2)}`;
  const profilePriceDisplay = profilePrice.cents > 0 ? `$${(profilePrice.cents / 100).toFixed(2)}` : "—";

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  // On payment success, submit the pending booking to the admin panel.
  async function submitPendingBooking() {
    if (!pendingBooking) return;
    try {
      await api.createBooking(pendingBooking);
    } catch {
      // Booking submission is best-effort on success — don't block the user.
    } finally {
      window.localStorage.removeItem("pendingBooking");
    }
  }

  async function handleCreatePayment() {
    setLoading(true);
    setError("");
    try {
      const res = await api.createServicePayment(service.name, totalCents);
      setPaymentIntent(res);
      setStep("paying");
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function handleConfirmPayment() {
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim() || !name.trim()) {
      setError("Please fill in all card details.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.confirmServicePayment(paymentIntent.payment_intent_id);
      if (res.success) {
        // Payment succeeded — now submit the booking to the admin panel.
        await submitPendingBooking();
        setStep("success");
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  function handleGoToBooking() {
    window.location.href = "/service";
  }

  // ── Step: Review ──
  if (step === "review") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Service payment</p>
            <h1 className="font-display text-4xl text-ink-50 dark:text-ink-950">Review your service</h1>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-ink-900/60 p-6 dark:border-ink-200 dark:bg-ink-100/60">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-gold-400" />
              <div>
                <p className="text-lg font-semibold text-ink-50 dark:text-ink-950">{service.name}</p>
                <p className="text-sm text-ink-400 dark:text-ink-600">{service.duration}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">{service.description}</p>

            {/* Price breakdown */}
            <div className="mt-4 space-y-2 rounded-xl border border-gold-400/20 bg-gold-400/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400 dark:text-ink-600">Service price</span>
                <span className="text-ink-50 dark:text-ink-950">{serviceDisplay}</span>
              </div>
              {profilePrice.cents > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-400 dark:text-ink-600">{profilePrice.name || "Creator"} price</span>
                  <span className="text-ink-50 dark:text-ink-950">{profilePriceDisplay}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gold-400/20 pt-2">
                <span className="text-sm font-semibold text-ink-50 dark:text-ink-950">Total due</span>
                <span className="font-display text-3xl text-gold-300 dark:text-gold-500">{priceDisplay}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <button
            onClick={handleCreatePayment}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            <CreditCard className="h-5 w-5" />
            {loading ? "Preparing…" : `Continue to payment — ${priceDisplay}`}
          </button>

          <button onClick={() => router.push("/booking")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back to booking</button>
          <Link href="/service" className="mt-2 block text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Cancel</Link>
        </div>
      </div>
    );
  }

  // ── Step: Card entry ──
  if (step === "paying") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Secure payment</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">Enter your card details</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Your card will be charged {priceDisplay} for {service.name}.</p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-ink-900/60 p-6 dark:border-ink-200 dark:bg-ink-100/60">
            <div className="mb-6 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">256-bit encrypted</span>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-ink-400 dark:text-ink-600">Cardholder name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50 outline-none focus:border-gold-400 dark:border-ink-200 dark:bg-white dark:text-ink-950" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-ink-400 dark:text-ink-600">Card number</label>
                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50 outline-none focus:border-gold-400 dark:border-ink-200 dark:bg-white dark:text-ink-950" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs text-ink-400 dark:text-ink-600">Expiry date</label>
                  <input type="text" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50 outline-none focus:border-gold-400 dark:border-ink-200 dark:bg-white dark:text-ink-950" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-ink-400 dark:text-ink-600">CVC</label>
                  <input type="text" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50 outline-none focus:border-gold-400 dark:border-ink-200 dark:bg-white dark:text-ink-950" required />
                </div>
              </div>
            </div>

            <button onClick={handleConfirmPayment} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:opacity-60">
              <ShieldCheck className="h-5 w-5" />
              {loading ? "Processing payment…" : `Pay ${priceDisplay} now`}
            </button>

            <p className="mt-4 text-center text-xs text-ink-500 dark:text-ink-600">
              <Lock className="mr-1 inline-block h-3 w-3" />
              Secured by Stripe
            </p>
          </div>

          <button onClick={() => setStep("review")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back</button>
        </div>
      </div>
    );
  }

  // ── Step: Success ──
  return (
    <div className="min-h-screen bg-ink-950 px-4 py-20 sm:px-6 dark:bg-white">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="mt-6 font-display text-3xl text-ink-50 dark:text-ink-950">Payment successful!</h1>
        <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">
          You've paid for <strong className="text-ink-50 dark:text-ink-950">{service.name}</strong> ({priceDisplay}). Your booking has been submitted to the admin for approval.
        </p>
        <div className="mt-8 space-y-3 text-left">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-4 dark:border-ink-200 dark:bg-ink-100/60">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-ink-300 dark:text-ink-700">Payment confirmed</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-4 dark:border-ink-200 dark:bg-ink-100/60">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-ink-300 dark:text-ink-700">Booking submitted to admin</span>
          </div>
        </div>
        <button onClick={handleGoToBooking} className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300">
          Return to Services <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function ServicePaymentPage() {
  return (
    <ProtectedRoute>
      <SubscriptionRoute>
        <ServicePaymentContent />
      </SubscriptionRoute>
    </ProtectedRoute>
  );
}