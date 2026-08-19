"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, Heart, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import SubscriptionRoute from "../../components/SubscriptionRoute";
import allProfiles from "../../data/profiles";

const services = [
 {
    id: 1,
    name: "Nuru Basic Massage",
    price: "$40",
    description: "Basic relaxation session",
    duration: "60 min",
    popular: false,
  },
  {
    id: 2,
    name: "Nuru Premium Massage",
    price: "$90",
    description: "Premium experience (erotic massage)",
    duration: "90 min",
    popular: true,
  },
  {
    id: 3,
    name: "BDSM Session",
    price: "$100/hr",
    description: "Contracts also available — apply within",
    duration: "1 hour",
    popular: false,
  },
  {
    id: 4,
    name: "Sensual Meet",
    price: "$60",
    description: "Intimate and sensual experience",
    duration: "60 min",
    popular: false,
  },
  {
    id: 5,
    name: "VIP Session",
    price: "$120/hr",
    description: "Professional premium session",
    duration: "Flexible",
    popular: false,
  },
  {
    id: 6,
    name: "Meet & Greet",
    price: "$20/hr",
    description: "Casual meet and greet service",
    duration: "1 hour",
    popular: false,
  },
  {
    id: 7,
    name: "Premium Interaction",
    price: "$3/min",
    description: "Premium one-on-one interaction",
    duration: "Per minute",
    popular: false,
  },
  {
    id: 8,
    name: "Direct Chat Access",
    price: "$20",
    description: "Start a direct one-on-one chat with this person.",
    duration: "Instant access",
    popular: true,
  },
];

function ServicesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);

  function handleSelectService(service) {
    setSelectedService(service);
    window.localStorage.setItem("selectedService", JSON.stringify(service));

    if (service.id === 8) {
      const storedProfile = window.sessionStorage.getItem("chat_profile");
      const selectedProfile = storedProfile ? JSON.parse(storedProfile) : null;
      const destinationProfile = selectedProfile || allProfiles[0];

      window.sessionStorage.setItem(
        "chat_profile",
        JSON.stringify({
          id: destinationProfile.id,
          displayName: destinationProfile.displayName || destinationProfile.name,
          name: destinationProfile.displayName || destinationProfile.name,
          avatar: destinationProfile.avatar,
          orientation: destinationProfile.orientation || "straight",
        })
      );

      router.push("/chat");
      return;
    }

    // Paid services go to the booking form first, then payment.
    router.push("/booking");
  }

  return (
    <div className="min-h-screen bg-ink-950 dark:bg-white">
      {/* Hero */}
      <div className="border-b border-white/5 bg-gradient-to-b from-gold-400/5 to-transparent px-6 py-16 text-center dark:border-ink-200">
        <Sparkles className="mx-auto h-8 w-8 text-gold-400" />
        <p className="eyebrow mt-4">Available services</p>
        <h1 className="mt-2 font-display text-4xl text-ink-50 dark:text-ink-950 md:text-5xl">
          Choose your experience
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-ink-400 dark:text-ink-600">
          Select a service below to pay and book your session. Direct chat access is free.
        </p>
      </div>

      {/* Services grid */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        {selectedService && (
          <div className="mb-8 rounded-2xl border border-gold-400/20 bg-gold-400/5 p-5 text-center">
            <p className="text-sm text-gold-300 dark:text-gold-500">Selected: <strong>{selectedService.name}</strong> — {selectedService.price}</p>
            <p className="mt-1 text-xs text-ink-400 dark:text-ink-600">
              {selectedService.id === 8 ? "Redirecting to chat…" : "Redirecting to booking…"}
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={`group relative rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 ${
                service.popular
                  ? "border-gold-400/40 bg-gold-400/5 shadow-glow"
                  : "border-white/10 bg-ink-900/60 hover:border-gold-400/30 dark:border-ink-200 dark:bg-white dark:hover:border-gold-400/50"
              }`}
            >
              {service.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink-950">
                  Popular
                </span>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink-50 dark:text-ink-950">{service.name}</h3>
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{service.duration}</p>
                </div>
                <Heart className="h-5 w-5 text-ink-500 transition group-hover:text-gold-400 dark:text-ink-400" />
              </div>

              <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">{service.description}</p>

              <div className="mt-6 flex items-center justify-between">
                <span className="font-display text-2xl text-gold-300 dark:text-gold-500">{service.price}</span>
                <button
                  onClick={() => handleSelectService(service)}
                  className="flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 text-xs font-semibold text-ink-950 transition hover:bg-gold-300"
                >
                  Select
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info footer */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-ink-900/60 p-6 dark:border-ink-200 dark:bg-ink-100/60">
          <div className="flex items-center gap-2 text-gold-400">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-semibold">Subscriber benefits</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-ink-300 dark:text-ink-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Priority booking
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-300 dark:text-ink-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Direct messaging
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-300 dark:text-ink-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <ProtectedRoute>
      <SubscriptionRoute>
        <ServicesContent />
      </SubscriptionRoute>
    </ProtectedRoute>
  );
}
