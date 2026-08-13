"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const heroSlides = [
  {
    image: "/WhatsApp Image 2026-07-13 at 3.06.13 PM (1).jpeg",
    eyebrow: "Curated encounters",
    title: "A striking first impression, every time",
    description: "Meet people in a refined space designed around trust, chemistry, and meaningful conversation.",
  },
  {
    image: "/WhatsApp Image 2026-07-13 at 3.06.11 PM.jpeg",
    eyebrow: "Thoughtful matching",
    title: "Real connection starts with better first choices",
    description: "Browse carefully verified profiles and discover people who genuinely match your pace and values.",
  },
  {
    image: "/WhatsApp Image 2026-07-13 at 3.06.15 PM.jpeg",
    eyebrow: "Stay in flow",
    title: "Your next conversation is already waiting",
    description: "Move from hello to genuine connection with a platform that feels warm, modern, and intentional.",
  },
  {
    image: "/WhatsApp Image 2026-07-13 at 3.06.12 PM.jpeg",
    eyebrow: "Designed for modern romance",
    title: "Show up as yourself and connect with confidence",
    description: "Create a profile that feels personal, explore with purpose, and start conversations that matter.",
  },
  {
    image: "/WhatsApp Image 2026-07-30 at 1.53.49 PM.jpeg",
    eyebrow: "Proudly inclusive",
    title: "Made for the gay community too",
    description: "Connect with verified gay male profiles. Filter by role — Top, Bottom, or Versatile — and find your match in a space built for you.",
  },
];

export default function LandingPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const currentSlide = heroSlides[currentImage];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const showPreviousSlide = () => {
    setCurrentImage((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const showNextSlide = () => {
    setCurrentImage((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <>
      {/* HERO */}
    {/* HERO */}
<section className="relative isolate h-screen overflow-hidden">

  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
    style={{
      backgroundImage: `url("${currentSlide.image}")`,
    }}
  />

  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/60" />

  {/* Content */}
  <div className="relative z-10 flex h-full items-center">

    <div className="mx-auto w-full max-w-7xl px-6">

      <p className="mb-5 text-sm uppercase tracking-[0.4em] text-gold-400">
        {currentSlide.eyebrow}
      </p>

      <h1 className="max-w-3xl text-5xl font-bold leading-tight text-white md:text-7xl">
        {currentSlide.title}
      </h1>

      <p className="mt-6 max-w-xl text-lg text-gray-200">
        {currentSlide.description}
      </p>

      <div className="mt-10 flex gap-4">
        <Link href="/signup" className="btn-primary">
          Join now
        </Link>

        <Link href="/login" className="btn-secondary">
          Log in
        </Link>
      </div>

    </div>

  </div>

  {/* Previous / Next */}
  <div className="absolute right-8 top-8 z-20 flex gap-3">

    <button
      onClick={showPreviousSlide}
      className="h-12 w-12 rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40"
    >
      ←
    </button>

    <button
      onClick={showNextSlide}
      className="h-12 w-12 rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40"
    >
      →
    </button>

  </div>

  {/* Dots */}
  <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-3">

    {heroSlides.map((_, index) => (

      <button
        key={index}
        onClick={() => setCurrentImage(index)}
        className={`h-3 w-3 rounded-full transition-all ${
          currentImage === index
            ? "bg-gold-400 scale-125"
            : "bg-white/60"
        }`}
      />

    ))}

  </div>
</section>
      {/* FEATURES */}
      <section className="border-t border-white/5 dark:border-ink-200  dark:bg-ink-100/40 white:bg-ink-800 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow mb-3">Why meetlink</p>
          <h2 className="font-display text-3xl text-ink-50 dark:text-ink-950 md:text-4xl">
            Built for people who take connection seriously.
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="card">
              <h3 className="font-display text-xl italic text-gold-300 dark:text-gold-500">Verified, always</h3>
              <p className="mt-3 text-sm text-ink-400 dark:text-ink-900">
                Every profile carries a visible verification status, so you always know who you&apos;re really talking to.
              </p>
            </div>
            <div className="card">
              <h3 className="font-display text-xl italic text-gold-300 dark:text-gold-500">Real conversation</h3>
              <p className="mt-3 text-sm text-ink-400 dark:text-ink-900">
                Secure, real-time messaging with read receipts and typing indicators — built for depth, not just a match count.
              </p>
            </div>
            <div className="card">
              <h3 className="font-display text-xl italic text-gold-300 dark:text-gold-500">Search with intent</h3>
              <p className="mt-3 text-sm text-ink-400 dark:text-ink-900">
                Filter by location, interests, and verification status to find people who are actually compatible with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOR EVERYONE */}
      <section className="border-y border-white/5 dark:border-ink-200 dark:bg-ink-100/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">Inclusive by design</p>
              <h2 className="font-display text-3xl text-ink-50 dark:text-ink-950 md:text-4xl">
                For everyone. <span className="italic text-gold-300 dark:text-gold-500">Proudly.</span>
              </h2>
              <p className="mt-6 text-ink-400 dark:text-ink-900">
                {`Meetlink is built for both straight and gay communities. Whether you're looking for a meaningful connection or a curated experience, you'll find verified profiles that match your orientation and preferences.`}
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-400">G</span>
                  <div>
                    <p className="font-semibold text-ink-50 dark:text-ink-950">Gay community</p>
                    <p className="text-sm text-ink-400 dark:text-ink-900">Verified gay male profiles with sexual role filters — Top, Bottom, and Versatile.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-xs font-bold text-gold-400">S</span>
                  <div>
                    <p className="font-semibold text-ink-50 dark:text-ink-950">Straight community</p>
                    <p className="text-sm text-ink-400 dark:text-ink-900">Curated straight female profiles with verified status and premium experiences.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">✓</span>
                  <div>
                    <p className="font-semibold text-ink-50 dark:text-ink-950">Safe & verified</p>
                    <p className="text-sm text-ink-400 dark:text-ink-900">Every profile is verified. Your privacy and safety are our top priority.</p>
                  </div>
                </div>
              </div>
              <Link href="/signup" className="btn-primary mt-8 inline-flex">
                Join the community
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl">
                <img src="/WhatsApp Image 2026-07-30 at 1.53.49 PM.jpeg" alt="Gay community" className="h-64 w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <img src="/WhatsApp Image 2026-07-13 at 3.06.13 PM (1).jpeg" alt="Straight community" className="h-64 w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <img src="/WhatsApp Image 2026-07-30 at 1.12.45 PM.jpeg" alt="Gay community" className="h-64 w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <img src="/WhatsApp Image 2026-07-13 at 3.06.15 PM.jpeg" alt="Straight community" className="h-64 w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow mb-3">The process</p>
          <h2 className="font-display text-3xl text-ink-50 dark:text-ink-950 md:text-4xl">
            Three steps to your next real conversation.
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <div className="font-display text-4xl italic text-gold-400/60 dark:text-gold-400/70">01</div>
              <h3 className="mt-3 text-lg text-ink-50 dark:text-ink-950">Build your profile</h3>
              <p className="mt-2 text-sm text-ink-400 dark:text-ink-900">Photos, interests, and a bio that actually sounds like you.</p>
            </div>
            <div>
              <div className="font-display text-4xl italic text-gold-400/60 dark:text-gold-400/70">02</div>
              <h3 className="mt-3 text-lg text-ink-50 dark:text-ink-950">Discover &amp; match</h3>
              <p className="mt-2 text-sm text-ink-400 dark:text-ink-900">Browse, filter, and like the profiles that catch your eye. When it&apos;s mutual, you match.</p>
            </div>
            <div>
              <div className="font-display text-4xl italic text-gold-400/60 dark:text-gold-400/70">03</div>
              <h3 className="mt-3 text-lg text-ink-50 dark:text-ink-950">Start talking</h3>
              <p className="mt-2 text-sm text-ink-400 dark:text-ink-900">Secure real-time messaging keeps the conversation going, wherever it leads.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-y border-white/5 dark:border-ink-200  dark:bg-ink-100/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow mb-3">Success stories</p>
          <h2 className="font-display text-3xl text-ink-50 dark:text-ink-950 md:text-4xl">Real members, real matches.</h2>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="card">
              <p className="text-sm italic text-ink-400 dark:text-ink-900">
                &ldquo;I&apos;d tried every app. Meetlink  was the first one where the conversations didn&apos;t fizzle out after &apos;hey&apos;.&rdquo;
              </p>
              <p className="mt-4 text-sm text-gold-300 dark:text-gold-700">— Maya, 29</p>
            </div>
            <div className="card">
              <p className="text-sm italic text-ink-400 dark:text-ink-900">
                &ldquo;The verification badges genuinely changed how safe I felt reaching out to people first.&rdquo;
              </p>
              <p className="mt-4 text-sm text-gold-300 dark:text-gold-700">— Daniel, 34</p>
            </div>
            <div className="card">
              <p className="text-sm italic text-ink-400 dark:text-ink-900">
                &ldquo;Met my partner here eight months ago. We still joke about our terrible first-message icebreakers.&rdquo;
              </p>
              <p className="mt-4 text-sm text-gold-300 dark:text-gold-700">— Priya &amp; Alex</p>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section id="safety" className="py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="eyebrow mb-3">Safety &amp; privacy</p>
          <h2 className="font-display text-3xl text-ink-50 dark:text-ink-950 md:text-4xl">Your safety shapes every decision we make.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-ink-400 dark:text-ink-900">
            Profile verification, in-app reporting and blocking, and a dedicated safety team are built into
            Meetlink from day one — not bolted on afterward.
          </p>
          <a href="#" className="btn-secondary mt-8 inline-flex">Read our safety tips</a>
        </div>
      </section>

      {/* FAQ PREVIEW */}
      <section className="border-t border-white/5 dark:border-ink-200 dark:bg-ink-100/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="eyebrow mb-3">Questions</p>
          <h2 className="font-display text-3xl text-ink-50 dark:text-ink-950">A few things people ask us.</h2>
          <div className="mt-10 space-y-4">
            <details className="card group">
              <summary className="cursor-pointer text-ink-50 dark:text-ink-950 marker:text-gold-400">Is Meetlink free to join?</summary>
              <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">
                Yes —  login, browsing,  are free. Premium unlocks unlimited likes, advanced filters, and more.
              </p>
            </details>
            <details className="card group">
              <summary className="cursor-pointer text-ink-50 dark:text-ink-950 marker:text-gold-400">How does verification work?</summary>
              <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">
                Verified members carry a visible badge on their profile, so you always know who&apos;s confirmed their identity.
              </p>
            </details>
            <details className="card group">
              <summary className="cursor-pointer text-ink-50 dark:text-ink-950 marker:text-gold-400">Can I block or report someone?</summary>
              <p className="mt-3 text-sm text-ink-400 dark:text-ink-600">Yes, from any profile or conversation — our safety team reviews every report.</p>
            </details>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-4xl italic text-ink-50 dark:text-ink-950">Ready to meet someone real?</h2>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup" className="btn-primary">Join now</Link>
            <Link href="/login" className="btn-secondary">Log in</Link>
          </div>
        </div>
      </section>
    </>
  );
}
