"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CreditCard, Sparkles, CheckCircle2, ArrowRight, Wallet, Copy, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getCountryCurrency, formatPriceCents } from "../../data/currency";

// ── Crypto coins ────────────────────────────────────────────
// Each coin has a clear deposit title + exact network label.
// IMPORTANT: These network labels are shown prominently so users never
// send funds on the wrong blockchain (which would lose their deposit).
const COINS = [
  {
    id: "bitcoin",
    label: "BTC",
    fullName: "Bitcoin",
    depositTitle: "BTC Deposit",
    symbol: "BTC",
    color: "#F7931A",
    logo: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/btc.svg",
    network: "BTC",
    networkFull: "Bitcoin (BTC)",
    networkNote: "Send BTC only on the Bitcoin network.",
  },
  {
    id: "ethereum",
    label: "Ethereum",
    fullName: "Ethereum",
    depositTitle: "ETH Deposit",
    symbol: "ETH",
    color: "#627EEA",
    logo: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/eth.svg",
    network: "Ethereum (ERC20)",
    networkFull: "Ethereum (ERC20)",
    networkNote: "Send ETH only on the Ethereum (ERC20) network. Do NOT use another Ethereum network.",
  },
  {
    id: "usdt",
    label: "USDT",
    fullName: "Tether (USDT)",
    depositTitle: "USDT Deposit",
    symbol: "USDT",
    color: "#26A17B",
    logo: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdt.svg",
    network: "TRON (TRC20)",
    networkFull: "TRON (TRC20)",
    networkNote: "Send USDT only on the TRON (TRC20) network.",
  },
];

// Wallet addresses
const WALLET_ADDRESSES = {
  bitcoin: "13mrBR4n1BtPJwMGoNVRKn8RvFMcGGk9Xa",
  ethereum: "0xf67ba3b4d1b0ad9cb07c18446cdeba130cbfbd22",
  usdt: "TDBXXkAbmU453Bn9t4Hj9n5yDCcAEN9WxB",
};

// ── Card payment ───────────────────────────────────────────
// (Bank transfer removed — only card and crypto are available)
const CARD_NOTE = "Pay securely with Paystack — Visa, Mastercard, Verve";

function PaymentContent() {
  const router = useRouter();

  const [profileInfo, setProfileInfo] = useState(() => {
    if (typeof window === "undefined") return { id: null, name: "", avatar: "", country: "", priceCents: 0 };
    const id = window.sessionStorage.getItem("subscribe_to_profile_id");
    const name = window.sessionStorage.getItem("subscribe_to_profile_name");
    const avatar = window.sessionStorage.getItem("subscribe_to_profile_avatar");
    const country = window.sessionStorage.getItem("subscribe_to_profile_country") || "";
    const priceCents = Number(window.sessionStorage.getItem("subscribe_to_profile_price_cents") || 0);
    return id
      ? { id: Number(id), name: name || "Profile", avatar: avatar || "", country, priceCents }
      : { id: null, name: "", avatar: "", country, priceCents: 0 };
  });

  // Per-profile pricing loaded from the backend (set in admin)
  const [profilePrice, setProfilePrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState("");

  // Currency derived from the profile's country
  const currency = getCountryCurrency(profileInfo.country);

  // Build the plan list from the profile's admin-set prices (in local currency)
  const PLANS = profilePrice
    ? [
        {
          id: "14days",
          label: "14 Days",
          priceCents: profilePrice.recurring_14day_price_cents,
          priceDisplay: formatPriceCents(profilePrice.recurring_14day_price_cents, profileInfo.country),
          duration: "14 days",
        },
        {
          id: "month",
          label: "1 Month",
          priceCents: profilePrice.recurring_monthly_price_cents,
          priceDisplay: formatPriceCents(profilePrice.recurring_monthly_price_cents, profileInfo.country),
          duration: "1 month",
          popular: true,
        },
        {
          id: "year",
          label: "1 Year",
          priceCents: profilePrice.recurring_yearly_price_cents,
          priceDisplay: formatPriceCents(profilePrice.recurring_yearly_price_cents, profileInfo.country),
          duration: "1 year",
          save: true,
        },
      ]
    : [];

  // The initial unlock fee = the profile's actual price (shown on the profile page),
  // falling back to the backend's configured initial price if not set.
  const initialFeeCents = profileInfo.priceCents > 0
    ? profileInfo.priceCents
    : (profilePrice ? profilePrice.initial_price_cents : 0);

  const initialFeeDisplay = formatPriceCents(initialFeeCents, profileInfo.country);

  // Load the profile's price from the backend
  useEffect(() => {
    if (!profileInfo.id) {
      setPriceLoading(false);
      setPriceError("No profile selected. Please go back and choose a profile to subscribe to.");
      return;
    }
    setPriceLoading(true);
    api.getProfilePrice(profileInfo.id)
      .then((p) => {
        setProfilePrice(p);
        // Auto-select the first plan (14 days) once prices are known
        setSelectedPlan({
          id: "14days",
          label: "14 Days",
          priceCents: p.recurring_14day_price_cents,
          priceDisplay: formatPriceCents(p.recurring_14day_price_cents, profileInfo.country),
          duration: "14 days",
        });
      })
      .catch((err) => {
        setPriceError(err.message);
        setProfilePrice(null);
      })
      .finally(() => setPriceLoading(false));
  }, [profileInfo.id, profileInfo.country]);

  const [step, setStep] = useState("plan"); // plan → method → paystack | crypto-select | crypto → success
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paystackData, setPaystackData] = useState(null);
  const [cryptoPaymentId, setCryptoPaymentId] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const priceDisplay = selectedPlan ? selectedPlan.priceDisplay : "";
  const currencySymbol = currency.symbol;

  function handleCopyAddress() {
    navigator.clipboard?.writeText(WALLET_ADDRESSES[selectedCoin.id]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGoToServices() { router.push("/service"); }

  // ── Paystack: initialize a transaction (card) ──
  // Card payment is currently unavailable — show message instead
  function handlePaystackPayment() {
    setError("Card payment is currently unavailable. Please use Crypto to complete your payment. 🪙");
  }

  // ── Verify a Paystack transaction after redirect back ──
  useEffect(() => {
    // If we came back from Paystack with a reference, verify it
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference");
    if (reference && profileInfo.id && selectedPlan && !paystackData) {
      const p = selectedPlan;
      setLoading(true);
      setError("");
      api.confirmPaystackPayment(reference, profileInfo.id, p.id, profileInfo.country, currencySymbol)
        .then((res) => {
          if (res.success) {
            setStep("success");
            ["subscribe_to_profile_id", "subscribe_to_profile_name", "subscribe_to_profile_avatar", "subscribe_to_profile_country"].forEach(k => window.sessionStorage.removeItem(k));
          } else {
            setError(res.detail || "Payment could not be verified.");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [profileInfo.id, profileInfo.country, currencySymbol]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Crypto: create payment request ──
  async function handleCreateCryptoPayment() {
    if (!profileInfo.id || !selectedPlan) return;
    setLoading(true);
    setError("");
    try {
      // Crypto pays the INITIAL unlock fee (one-time), not the recurring amount
      const initialCents = initialFeeCents;
      const res = await api.createCryptoPayment({
        coin: selectedCoin.id,
        amount_cents: initialCents,
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
        ["subscribe_to_profile_id", "subscribe_to_profile_name", "subscribe_to_profile_avatar", "subscribe_to_profile_country"].forEach(k => window.sessionStorage.removeItem(k));
      } else {
        setError(res.detail || "Payment could not be verified.");
      }
    } catch (err) {
      setError(err.message);
    }
    setVerifying(false);
  }

  // ── Loading state ──
  if (priceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 dark:bg-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          <p className="mt-4 text-sm text-ink-400 dark:text-ink-600">Loading pricing…</p>
        </div>
      </div>
    );
  }

  // ── No profile selected ──
  if (!profileInfo.id || !profilePrice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 dark:bg-white">
        <div className="mx-auto max-w-md text-center">
          <p className="text-6xl text-ink-500">😕</p>
          <h1 className="mt-4 font-display text-2xl text-ink-50 dark:text-ink-950">Unable to start subscription</h1>
          <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">{priceError || "Please select a profile to subscribe to."}</p>
          <Link href="/home" className="mt-6 inline-block rounded-full bg-gold-400 px-8 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-300">
            Browse Profiles
          </Link>
        </div>
      </div>
    );
  }

  // ── Step: Choose plan ──
  if (step === "plan") {
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Subscription</p>
            <h1 className="font-display text-4xl text-ink-50 dark:text-ink-950">Choose your plan</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Unlock full access to {profileInfo.name || "this profile"}</p>
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-600">
              Prices shown in {currency.currency} ({currencySymbol})
            </p>
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
                <p className="text-sm text-ink-400 dark:text-ink-600">Profile subscription · {profileInfo.country || ""}</p>
              </div>
            </div>
          )}

          {/* Initial unlock fee notice */}
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-gold-400/10 p-4">
            <Sparkles className="h-5 w-5 shrink-0 text-gold-400" />
            <p className="text-sm text-ink-300 dark:text-ink-700">
              <strong className="text-ink-50 dark:text-ink-950">{initialFeeDisplay}</strong> one-time unlock fee to access this profile. Then your recurring plan starts.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative w-full rounded-2xl border p-6 text-left transition ${
                  selectedPlan?.id === plan.id
                    ? "border-gold-400 bg-gold-400/10"
                    : "border-white/10 bg-ink-900/60 hover:border-gold-400/30 dark:border-ink-200 dark:bg-ink-100/60"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink-950">
                    Popular
                  </span>
                )}
                {plan.save && (
                  <span className="absolute -top-3 right-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    Save $70
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-ink-50 dark:text-ink-950">{plan.label}</p>
                    <p className="mt-1 text-xs text-ink-400 dark:text-ink-600">Full access for {plan.duration} · recurring</p>
                  </div>
                  <p className="font-display text-3xl text-gold-300 dark:text-gold-500">{plan.priceDisplay}</p>
                </div>
                {selectedPlan?.id === plan.id && (
                  <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-gold-400" />
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <button
            onClick={() => setStep("method")}
            disabled={!selectedPlan}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gold-400 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:opacity-50"
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
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">{selectedPlan.label} — {priceDisplay} · {currency.currency}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div className="mt-8 space-y-4">
            {/* Paystack card payment — currently unavailable */}
            <div
              className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-5 text-left opacity-70 dark:border-ink-200 dark:bg-ink-100/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-800/60">
                <CreditCard className="h-6 w-6 text-ink-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-50 dark:text-ink-950">Card Payment</p>
                <p className="text-xs text-amber-500">⚠️ Currently unavailable — please use Crypto</p>
              </div>
            </div>

            {/* Crypto */}
            <button
              onClick={() => setStep("crypto-select")}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/60 p-5 text-left transition hover:border-gold-400/30 dark:border-ink-200 dark:bg-ink-100/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={COINS[0].logo} alt="BTC" className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-50 dark:text-ink-950">Crypto Payment</p>
                <p className="text-xs text-ink-400 dark:text-ink-600">BTC, Ethereum, USDT</p>
              </div>
              <ArrowRight className="h-5 w-5 text-ink-500" />
            </button>
          </div>

          {loading && (
            <p className="mt-4 text-center text-sm text-ink-400 dark:text-ink-600">Redirecting to Paystack…</p>
          )}

          <button onClick={() => setStep("plan")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back</button>
        </div>
      </div>
    );
  }

  // ── Step: Crypto coin selection ──
  if (step === "crypto-select") {
    const cryptoPriceDisplay = formatPriceCents(initialFeeCents, profileInfo.country);
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <p className="eyebrow mb-2">Crypto payment</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">Select your coin</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Pay {cryptoPriceDisplay} one-time unlock fee using crypto</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* ── Step-by-step instructions ── */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-ink-900/60 p-5 dark:border-ink-200 dark:bg-ink-100/60">
            <p className="text-sm font-semibold text-ink-50 dark:text-ink-950">📋 How to pay with crypto on Changelly — Step by Step</p>
            <div className="mt-4 space-y-3">
              {[
                { n: "1", t: "Select your coin below", d: `Choose ${selectedCoin.fullName} (${selectedCoin.symbol}) — BTC, Ethereum, or USDT` },
                { n: "2", t: `Tap "Buy ${selectedCoin.symbol} with card on Changelly"`, d: "This opens Changelly in a new tab where you can pay with your card" },
                { n: "3", t: `Enter the amount to buy (${cryptoPriceDisplay})`, d: `Buy at least ${cryptoPriceDisplay} worth of ${selectedCoin.symbol}. Changelly lets you pay with your Visa/Mastercard.` },
                { n: "4", t: `Send the crypto straight to our ${selectedCoin.network} address`, d: "On Changelly, enter the wallet address shown on the next page and select the exact network (BTC, ERC20, or TRC20)" },
                { n: "5", t: "Confirm the purchase", d: "Changelly sends your crypto to the address automatically once the payment is confirmed" },
                { n: "6", t: "Copy the transaction hash (TXID)", d: "Paste it on the next page and click Verify" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-xs font-bold text-gold-400">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-50 dark:text-ink-950">{s.t}</p>
                    <p className="text-xs text-ink-400 dark:text-ink-600">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coin.logo} alt={coin.fullName} className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink-50 dark:text-ink-950">{coin.label}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-600">{coin.fullName}</p>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedCoin.logo} alt={selectedCoin.fullName} className="h-5 w-5" />
              {loading ? "Preparing…" : `Pay ${cryptoPriceDisplay} with ${selectedCoin.symbol}`}
            </button>

          <button onClick={() => setStep("method")} className="mt-4 block w-full text-center text-sm text-ink-400 hover:text-gold-300 transition dark:text-ink-600">Back</button>
        </div>
      </div>
    );
  }

  // ── Step: Crypto payment instructions (professional deposit page) ──
  if (step === "crypto") {
    const wallet = WALLET_ADDRESSES[selectedCoin.id];
    const cryptoPriceDisplay = formatPriceCents(initialFeeCents, profileInfo.country);
    return (
      <div className="min-h-screen bg-ink-950 px-4 py-12 sm:px-6 dark:bg-white">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="text-center">
            <p className="eyebrow mb-2">Crypto Deposit</p>
            <h1 className="font-display text-3xl text-ink-50 dark:text-ink-950">{selectedCoin.depositTitle}</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-ink-600">Send {cryptoPriceDisplay} one-time unlock fee ({selectedCoin.symbol}) to the address below</p>
          </div>

          {/* Network — very prominent so users never send on the wrong chain */}
          <div className="mt-6 rounded-2xl border-2 border-gold-400/40 bg-gold-400/10 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-gold-400">Network</p>
            <p className="mt-1 text-xl font-bold text-ink-50 dark:text-ink-950">{selectedCoin.network}</p>
            <p className="mt-1 text-xs text-ink-400 dark:text-ink-600">{selectedCoin.networkNote}</p>
          </div>

          {/* QR Code + Wallet address */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-ink-900/60 p-6 dark:border-ink-200 dark:bg-ink-100/60">
            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                <QRCodeSVG value={wallet} size={180} level="M" includeMargin />
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-ink-400 dark:text-ink-600">
                <QrCode className="h-3.5 w-3.5" /> Scan to copy the {selectedCoin.symbol} address
              </p>
            </div>

            <p className="mt-6 text-xs text-ink-400 dark:text-ink-600">Send {selectedCoin.symbol} to this address</p>
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
              ⚠️ Only send {selectedCoin.symbol} on the <strong className="text-ink-400 dark:text-ink-500">{selectedCoin.network}</strong> network. Sending on the wrong network may result in loss of funds.
            </p>
          </div>

          {/* Changelly instructions */}
          <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={COINS[0].logo} alt="BTC" className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-50 dark:text-ink-950">Crypto Payment</p>
                <p className="text-xs text-ink-400 dark:text-ink-600">BTC, Ethereum, USDT</p>
              </div>
            </div>

            <a
              href={`https://changelly.com/buy-crypto?from=USD&to=${selectedCoin.symbol}&address=${wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Buy {selectedCoin.symbol} with card on Changelly <ExternalLink className="h-4 w-4" />
            </a>
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
            <span className="text-sm text-ink-300 dark:text-ink-700">Subscription active for {selectedPlan?.duration}</span>
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