"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CreditCard, Lock, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Bitcoin, Wallet, Landmark, Copy, ExternalLink } from "lucide-react";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";

// ── Subscription plans ──────────────────────────────────────
const PLANS = [
  { id: "14days", label: "14 Days", priceCents: 2000, priceDisplay: "$20", duration: "14 days" },
  { id: "1month", label: "1 Month", priceCents: 3500, priceDisplay: "$35", duration: "1 month", popular: true },
];

// ── Crypto coins ────────────────────────────────────────────
const COINS = [
  { id: "bitcoin", label: "Bitcoin", symbol: "BTC", color: "#F7931A", network: "Bitcoin (BTC)" },
  { id: "ethereum", label: "Ethereum", symbol: "ETH", color: "#627EEA", network: "Ethereum (ERC20)" },
  { id: "tether", label: "Tether", symbol: "USDT", color: "#26A17B", network: "TRON (TRC20)" },
];

// Wallet addresses
const WALLET_ADDRESSES = {
  bitcoin: "13mrBR4n1BtPJwMGoNVRKn8RvFMcGGk9Xa",
  ethereum: "0xf67ba3b4d1b0ad9cb07c18446cdeba130cbfbd22",
  tether: "TDBXXkAbmU453Bn9t4Hj9n5yDCcAEN9WxB",
};

function PaymentContent() {
  const router = useRouter();

  const [profileInfo, setProfileInfo] = useState(() => {
    if (typeof window === "undefined") return { id: null, name: "", avatar: "" };
    const id = window.sessionStorage.getItem("subscribe_to_profile_id");
    const name = window.sessionStorage.getItem("subscribe_to_profile_name");
    const avatar = window.sessionStorage.getItem("subscribe_to_profile_avatar");
    return id
      ? { id: Number(id), name: name || "Profile", avatar: avatar || "" }
      : { id: null, name: "", avatar: "" };
  });

  const [step, setStep] = useState("plan"); // plan → method → card | crypto | paystack → success
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [cryptoPaymentId, setCryptoPaymentId] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const priceDisplay = `$${(selectedPlan.priceCents / 100).toFixed(0)}`;

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  async function handleCreatePayment() {
    if (!profileInfo.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.createStripePayment(profileInfo.id);
      setPaymentIntent(res);
      setStep("card");
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
      const res = await api.confirmStripePayment(paymentIntent.payment_intent_id, profileInfo.id);
      if (res.success) {
        setStep("success");
        ["subscribe_to_profile_id", "subscribe_to_profile_name", "subscribe_to_profile_avatar"].forEach(k => window.sessionStorage.removeItem(k));
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function handleCreateCryptoPayment() {
    if (!profileInfo.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.createCryptoPayment({
        coin: selectedCoin.id,
        amount_cents: selectedPlan.priceCents,
        purpose: `subscription-${selectedPlan.id}-${profileInfo.name}`,
        wallet_address: WALLET_ADDRESSES[selectedCoin.id],
      });
      setCryptoPaymentId(res.id);
      setStep("crypto");
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function handleVerifyCryptoPayment() {
    if (!cryptoPaymentId || !txHash.trim()) return;
    setVerifying(true);
    setError("");
    try {
      const res = await api.verifyCryptoPayment(cryptoPaymentId, txHash.trim());
      if (res.success) {
        setStep("success");
        ["subscribe_to_profile_id", "subscribe_to_profile_name", "subscribe_to_profile_avatar"].forEach(k => window.sessionStorage.removeItem(k));
      } else {
        setError(res.detail || "Payment could not be verified.");
      }
    } catch (err) {
      setError(err.message);
    }
    setVerifying(false);
  }

  function handleCopyAddress() {
    navigator.clipboard?.writeText(WALLET_ADDRESSES[selectedCoin.id]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGoToServices() { router.push("/service"); }

  // ── Step: Choose plan ──
  if (step === "plan") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Subscription</p>
            <h1 className="font-display text-4xl text-ink-50 dark:text-ink-950">Choose your plan</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Unlock full access to {profileInfo.name || "this profile"}</p>
          </div>

          {profileInfo.name && (
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/60 p-5 dark:border-ink-200 dark:bg-ink-100/60">
              {profileInfo.avatar && (
                <div className="h-16 w-16 overflow-hidden rounded-full">
                  <Image src={profileInfo.avatar} alt={profileInfo.name} width={64} height={64} className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-ink-50 dark:text-ink-950">{profileInfo.name}</p>
                <p className="text-sm text-ink-400 dark:text-ink-600">Profile subscription</p>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative w-full rounded-2xl border p-6 text-left transition ${
                  selectedPlan.id === plan.id
                    ? "border-gold-400 bg-gold-400/10"
                    : "border-white/10 bg-ink-900/60 hover:border-gold-400/30 dark:border-ink-200 dark:bg-ink-100/60"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink-950">
                    Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-ink-50 dark:text-ink-950">{plan.label}</p>
                    <p className="mt-1 text-xs text-ink-400 dark:text-ink-600">Full access for {plan.duration}</p>
                  </div>
                  <p className="font-display text-3xl text-gold-300 dark:text-gold-500">{plan.priceDisplay}</p>
                </div>
                {selectedPlan.id === plan.id && (
                  <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-gold-400" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("method")}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
          >
            Continue <ArrowRight className="h-5 w-5" />
          </button>

          <Link href="/home" className="mt-4 block text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Cancel</Link>
        </div>
      </div>
    );
  }

  // ── Step: Choose payment method ──
  if (step === "method") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Payment method</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">How would you like to pay?</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">{selectedPlan.label} — {priceDisplay}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div className="mt-8 space-y-4">
            {/* Card */}
            <button
              onClick={handleCreatePayment}
              disabled={loading}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/60 p-5 text-left transition hover:border-gold-400/30 dark:border-ink-200 dark:bg-ink-100/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/10">
                <CreditCard className="h-6 w-6 text-gold-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-50 dark:text-ink-950">Card Payment</p>
                <p className="text-xs text-ink-400 dark:text-ink-600">Pay securely with Visa, Mastercard, etc.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-ink-500" />
            </button>

            {/* Crypto */}
            <button
              onClick={() => setStep("crypto-select")}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/60 p-5 text-left transition hover:border-gold-400/30 dark:border-ink-200 dark:bg-ink-100/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Bitcoin className="h-6 w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-50 dark:text-ink-950">Crypto Payment</p>
                <p className="text-xs text-ink-400 dark:text-ink-600">Bitcoin, Ethereum, Tether (USDT)</p>
              </div>
              <ArrowRight className="h-5 w-5 text-ink-500" />
            </button>

            {/* Paystack */}
            <button
              onClick={() => setStep("paystack")}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/60 p-5 text-left transition hover:border-gold-400/30 dark:border-ink-200 dark:bg-ink-100/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Landmark className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-50 dark:text-ink-950">Paystack</p>
                <p className="text-xs text-ink-400 dark:text-ink-600">Pay with your local bank card</p>
              </div>
              <ArrowRight className="h-5 w-5 text-ink-500" />
            </button>
          </div>

          <button onClick={() => setStep("plan")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back</button>
        </div>
      </div>
    );
  }

  // ── Step: Crypto coin selection ──
  if (step === "crypto-select") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Crypto payment</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">Select your coin</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Pay {priceDisplay} for {selectedPlan.label} using crypto</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div className="mt-8 space-y-4">
            {COINS.map((coin) => (
              <button
                key={coin.id}
                onClick={() => setSelectedCoin(coin)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${
                  selectedCoin.id === coin.id
                    ? "border-gold-400 bg-gold-400/10"
                    : "border-white/10 bg-ink-900/60 hover:border-gold-400/30 dark:border-ink-200 dark:bg-ink-100/60"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${coin.color}20` }}>
                  <Bitcoin className="h-6 w-6" style={{ color: coin.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink-50 dark:text-ink-950">{coin.label}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-600">{coin.symbol}</p>
                </div>
                {selectedCoin.id === coin.id && <CheckCircle2 className="h-5 w-5 text-gold-400" />}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateCryptoPayment}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            <Bitcoin className="h-5 w-5" />
            {loading ? "Preparing…" : `Pay ${priceDisplay} with ${selectedCoin.symbol}`}
          </button>

          <button onClick={() => setStep("method")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back</button>
        </div>
      </div>
    );
  }

  // ── Step: Crypto payment instructions ──
  if (step === "crypto") {
    const wallet = WALLET_ADDRESSES[selectedCoin.id];
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Crypto payment</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">Pay with {selectedCoin.label}</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Send {priceDisplay} worth of {selectedCoin.symbol} to the address below</p>
          </div>

          {/* Changelly instructions */}
          <div className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Wallet className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-ink-50 dark:text-ink-950">Pay with Changelly</p>
                <p className="text-xs text-ink-400 dark:text-ink-600">Download the Changelly Exchange app to buy crypto and complete your payment</p>
              </div>
            </div>

            <ol className="mt-4 space-y-3 text-sm text-ink-300 dark:text-ink-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">1</span>
                <span>Download the <strong className="text-ink-50 dark:text-ink-950">Changelly Exchange. Buy crypto</strong> app from the App Store or Google Play.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">2</span>
                <span>Create an account and complete verification.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">3</span>
                <span>Buy or deposit <strong className="text-ink-50 dark:text-ink-950">{selectedCoin.symbol}</strong> in your Changelly wallet.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">4</span>
                <span>Send <strong className="text-ink-50 dark:text-ink-950">{priceDisplay}</strong> worth of {selectedCoin.symbol} to the wallet address below.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">5</span>
                <span>Paste your transaction hash below and submit. Your subscription will be activated once confirmed.</span>
              </li>
            </ol>

            <a
              href={`https://changelly.com/buy-crypto?from=USD&to=${selectedCoin.symbol}&address=${wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Buy {selectedCoin.symbol} with card on Changelly <ExternalLink className="h-4 w-4" />
            </a>

            <a
              href="https://changelly.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-full border border-orange-500/30 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/10"
            >
              Download Changelly app <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Wallet address */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-ink-900/60 p-6 dark:border-ink-200 dark:bg-ink-100/60">
            <p className="text-xs text-ink-400 dark:text-ink-600">Network</p>
            <p className="mt-1 text-sm font-semibold text-ink-50 dark:text-ink-950">{selectedCoin.network}</p>
            <p className="mt-4 text-xs text-ink-400 dark:text-ink-600">Send {selectedCoin.symbol} to this address</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-ink-950 p-3 dark:border-ink-200 dark:bg-white">
              <code className="flex-1 break-all text-xs text-ink-300 dark:text-ink-700">{wallet}</code>
              <button
                onClick={handleCopyAddress}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-gold-400/10 px-3 py-2 text-xs font-semibold text-gold-400 transition hover:bg-gold-400/20"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-500 dark:text-ink-600">
              ⚠️ Only send {selectedCoin.symbol} on the <strong className="text-ink-400 dark:text-ink-500">{selectedCoin.network}</strong> network to this address. Sending on the wrong network or other coins may result in loss of funds.
            </p>
          </div>

          {/* Transaction hash */}
          <div className="mt-6">
            <label className="mb-1.5 block text-xs text-ink-400 dark:text-ink-600">Transaction hash (TXID)</label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste your transaction hash here"
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50 outline-none focus:border-gold-400 dark:border-ink-200 dark:bg-white dark:text-ink-950"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <button
            onClick={handleVerifyCryptoPayment}
            disabled={!txHash.trim() || verifying}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            <CheckCircle2 className="h-5 w-5" />
            {verifying ? "Verifying on blockchain…" : "Verify payment"}
          </button>

          <button onClick={() => setStep("crypto-select")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back</button>
        </div>
      </div>
    );
  }

  // ── Step: Paystack ──
  if (step === "paystack") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Paystack</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">Pay with Paystack</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Pay {priceDisplay} for {selectedPlan.label}</p>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <Landmark className="mx-auto h-12 w-12 text-emerald-400" />
            <p className="mt-4 font-semibold text-ink-50 dark:text-ink-950">Bank transfer details coming soon</p>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">
              {`We're setting up Paystack bank transfer payments. Please check back shortly or use card or crypto payment.`}
            </p>
          </div>

          <button onClick={() => setStep("method")} className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300">
            Choose another method
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Card entry ──
  if (step === "card") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Secure payment</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">Enter your card details</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Your card will be charged {priceDisplay} for {selectedPlan.label}.</p>
          </div>

          {profileInfo.name && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-4 dark:border-ink-200 dark:bg-ink-100/60">
              <Sparkles className="h-5 w-5 text-gold-400" />
              <span className="text-sm text-ink-300 dark:text-ink-700">Subscribing to <strong className="text-ink-50 dark:text-ink-950">{profileInfo.name}</strong></span>
            </div>
          )}

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

          <button onClick={() => setStep("method")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back</button>
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
          You now have full access to <strong className="text-ink-50 dark:text-ink-950">{profileInfo.name || "your subscription"}</strong>. Your services are unlocked.
        </p>
        <div className="mt-8 space-y-3 text-left">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-4 dark:border-ink-200 dark:bg-ink-100/60">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-ink-300 dark:text-ink-700">Subscription active for {selectedPlan.duration}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-4 dark:border-ink-200 dark:bg-ink-100/60">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-ink-300 dark:text-ink-700">Services page is now unlocked</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-4 dark:border-ink-200 dark:bg-ink-100/60">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-ink-300 dark:text-ink-700">Direct messaging with creator</span>
          </div>
        </div>
        <button onClick={handleGoToServices} className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300">
          Browse Services <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <PaymentContent />
    </ProtectedRoute>
  );
}