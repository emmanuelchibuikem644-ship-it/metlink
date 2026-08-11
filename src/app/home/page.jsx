"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../lib/auth-context";
import ProtectedRoute from "../../components/ProtectedRoute";
import { FaCheckCircle } from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";
import allProfiles from "../../data/profiles";
import { formatPriceCents } from "../../data/currency";

function HomeContent() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All countries");
  const [role, setRole] = useState("All roles");
  const [orientationTab, setOrientationTab] = useState("straight"); // straight | gay | bisexual

  // Filter profiles based on the selected orientation tab
  const profiles = useMemo(() => {
  const orientation = orientationTab.toLowerCase();

  if (orientation === "gay") {
    // Show only gay male profiles
    return allProfiles.filter(
      (profile) =>
        profile.orientation.toLowerCase() === "gay" &&
        profile.gender.toLowerCase() === "male"
    );
  }

  if (orientation === "bisexual") {
    // Show only bisexual profiles (both male and female)
    return allProfiles.filter(
      (profile) =>
        profile.orientation.toLowerCase() === "bisexual"
    );
  }

  // Show only straight female profiles
  return allProfiles.filter(
    (profile) =>
      profile.orientation.toLowerCase() === "straight" &&
      profile.gender.toLowerCase() === "female"
  );
}, [orientationTab]);

  const countries = useMemo(
    () => ["All countries", ...new Set(profiles.map((item) => item.country))],
    [profiles]
  );

  const roles = useMemo(
    () => ["All roles", ...new Set(profiles.filter((p) => p.sexual_role).map((p) => p.sexual_role))],
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    const query = search.toLowerCase().trim();

    return profiles.filter((item) => {
      const matchesCountry =
        country === "All countries" || item.country === country;

      const matchesSearch =
        !query ||
        item.displayName.toLowerCase().includes(query) ||
        item.country.toLowerCase().includes(query) ||
        item.bio.toLowerCase().includes(query);

      const matchesRole = role === "All roles" || item.sexual_role === role;

      return matchesCountry && matchesSearch && matchesRole;
    });
  }, [search, country, role, profiles]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">

      <p className="mb-2 text-sm uppercase tracking-[4px] text-gold-400 dark:text-gold-500">
        Welcome Back
      </p>

      <h1 className="text-4xl font-bold text-ink-50 dark:text-ink-950">
        Hi, {user.display_name}
      </h1>

      {/* ── Orientation tabs (Straight | Gay | Bisexual) ── */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => setOrientationTab("straight")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            orientationTab === "straight"
              ? "bg-gold-400 text-ink-950 shadow-lg shadow-gold-400/20"
              : "border border-white/10 bg-ink-900/60 text-ink-400 hover:text-ink-50 dark:border-ink-200 dark:bg-white dark:text-ink-600 dark:hover:text-ink-950"
          }`}
        >
          Straight ♀
        </button>
        <button
          onClick={() => setOrientationTab("gay")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            orientationTab === "gay"
              ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20"
              : "border border-white/10 bg-ink-900/60 text-ink-400 hover:text-ink-50 dark:border-ink-200 dark:bg-white dark:text-ink-600 dark:hover:text-ink-950"
          }`}
        >
          Gay ♂
        </button>
        <button
          onClick={() => setOrientationTab("bisexual")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            orientationTab === "bisexual"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "border border-white/10 bg-ink-900/60 text-ink-400 hover:text-ink-50 dark:border-ink-200 dark:bg-white dark:text-ink-600 dark:hover:text-ink-950"
          }`}
        >
          Bisexual ⚥
        </button>
      </div>

      {/* Search */}

      <div className="mt-10 flex flex-col gap-4 md:flex-row">

        <input
          type="text"
          placeholder="Search people or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-white/10 bg-ink-900/60 px-5 py-3 text-ink-50 outline-none placeholder:text-ink-500 focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950 dark:placeholder:text-ink-400"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-full border border-white/10 bg-ink-900/60 px-5 py-3 text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
        >
          {countries.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        {profiles.some((p) => p.sexual_role) && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-full border border-white/10 bg-ink-900/60 px-5 py-3 text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
          >
            {roles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        )}

      </div>

      {/* Cards */}

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((item) => (

            <Link
              key={item.id}
              href={`/profile/${item.id}`}
              className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60 shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-ink-200 dark:bg-white"
            >

              {/* Picture */}

              <div className="relative h-[420px] w-full">

                <Image
                  src={item.avatar}
                  alt={item.displayName}
                  fill
                  className="object-cover"
                />

                {/* Price badge in profile's local currency */}
                <div className="absolute bottom-3 left-3 rounded-full bg-ink-950/80 px-4 py-2 text-sm font-semibold text-gold-300 backdrop-blur dark:bg-white/80 dark:text-gold-600">
                  {formatPriceCents(item.price_cents, item.country)}
                </div>

              </div>

              {/* Information */}

              <div className="p-6">

                <div className="flex items-center gap-2">

                  <h2 className="text-2xl font-bold text-ink-50 dark:text-ink-950">
                    {item.displayName}, {item.age}
                  </h2>

                  {item.verified && (
                    <FaCheckCircle className="text-blue-500 text-xl" />
                  )}

                </div>

                {item.orientation === "gay" && item.sexual_role && (
                  <div className="mt-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.sexual_role === "Top"
                        ? "bg-fuchsia-500/15 text-fuchsia-400"
                        : item.sexual_role === "Bottom"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {item.sexual_role}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 text-ink-400 dark:text-ink-600">

                  <MdLocationOn className="text-red-500" />

                  <span>{item.country}</span>

                </div>

                <p className="mt-4 text-ink-400 dark:text-ink-600">
                  {item.bio}
                </p>

              </div>

            </Link>

          ))
        ) : (

          <div className="col-span-full rounded-xl border border-dashed border-ink-500 p-10 text-center text-ink-400 dark:border-ink-300 dark:text-ink-500">
            No profiles found.
          </div>

        )}

      </div>

    </section>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}