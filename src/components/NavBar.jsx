"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme-context";

const links = [
  { href: "/home", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/service", label: "Service" },
  { href: "/booking", label: "Booking System" },
  
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const themeButton = mounted ? (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 dark:text-ink-500 dark:hover:bg-ink-900/20"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l-2.121-2.121a1 1 0 00-1.414 1.414l2.121 2.121a1 1 0 001.414-1.414zM2.05 6.464l2.121 2.121a1 1 0 101.414-1.414L3.464 5.05a1 1 0 00-1.414 1.414zM17.95 6.464l-2.121 2.121a1 1 0 101.414 1.414l2.121-2.121a1 1 0 00-1.414-1.414zM2.05 13.536l2.121-2.121a1 1 0 101.414 1.414l-2.121 2.121a1 1 0 01-1.414-1.414zM15.657 7.343a1 1 0 001.414-1.414l-2.121-2.121a1 1 0 10-1.414 1.414l2.121 2.121zM19 10a1 1 0 100-2h-1a1 1 0 100 2h1zM2 10a1 1 0 100-2H1a1 1 0 100 2h1zM16.657 12.657a1 1 0 00-1.414-1.414l-2.121 2.121a1 1 0 101.414 1.414l2.121-2.121zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  ) : null;

  if (!user) {
    return (
      <header className="sticky top-0 z-50">
        <div className="border-b border-white/5 bg-ink-950/95 backdrop-blur transition dark:border-black/10 dark:bg-white/95">
          <div className="page-shell flex items-center justify-between gap-3 py-4">
            <Link href="/" className="font-display text-2xl italic tracking-wide text-ink-50 dark:text-ink-950">
              MEETLINK
            </Link>
    <div className="flex items-center gap-2 sm:gap-3">
              {themeButton}
              <Link href="/login" className="hidden text-sm text-ink-400 transition hover:text-ink-50 dark:text-ink-500 dark:hover:text-ink-950 sm:inline-block">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary !px-5 !py-2 text-sm">
                Join now
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/5 bg-ink-950/95 backdrop-blur transition dark:border-black/10 dark:bg-white/95">
        <div className="page-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="/home" className="font-display text-2xl italic tracking-wide text-ink-50 dark:text-ink-950">
              MEETLINK
            </Link>

            <div className="flex items-center gap-2 lg:hidden">
              {themeButton}
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="rounded-lg p-2 text-ink-50 transition hover:bg-white/10 dark:text-ink-950 dark:hover:bg-black/5"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <nav className="hidden flex-wrap items-center justify-center gap-6 text-sm text-ink-400 lg:flex dark:text-ink-500">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-ink-50 dark:hover:text-ink-950">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {themeButton}
            <span className="hidden text-sm text-ink-400 sm:inline-block dark:text-ink-500">
              Hello, {user.display_name}
            </span>
            <Link href="/account" className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-ink-50 transition hover:border-gold-400 hover:text-gold-300 sm:inline-flex dark:border-ink-900 dark:bg-ink-950/80 dark:text-ink-50">
              My account
            </Link>
            <button onClick={logout} className="btn-primary !px-5 !py-2 text-sm">
              Sign out
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="page-shell pb-4 lg:hidden">
            <div className="rounded-2xl border border-white/10 bg-ink-950/95 p-3 text-sm text-ink-400 dark:border-ink-200 dark:bg-white/95 dark:text-ink-500">
              <div className="space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-ink-50 dark:hover:bg-black/5 dark:hover:text-ink-950"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-3 border-t border-white/10 pt-3 dark:border-ink-200">
                <div className="mb-3 text-sm text-ink-400 dark:text-ink-500">Hello, {user.display_name}</div>
                <div className="flex flex-col gap-2">
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-full border border-white/10 px-4 py-2 text-center text-ink-50 transition hover:border-gold-400 hover:text-gold-300 dark:border-ink-900 dark:text-ink-950">
                    My account
                  </Link>
                  <button onClick={logout} className="btn-primary w-full !px-5 !py-2 text-sm">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
