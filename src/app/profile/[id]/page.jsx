 "use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaHeart, FaShareAlt, FaCheckCircle } from "react-icons/fa";
import { MdLocationOn, MdVerified, MdPhotoLibrary, MdClose } from "react-icons/md";
import { CreditCard, Lock, ShieldCheck, Sparkles, Crown } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { api } from "../../../lib/api";
import allProfiles from "../../../data/profiles";
import { formatPriceCents } from "../../../data/currency";

// Number of gallery photos visible without a subscription
const FREE_PHOTOS = 2;

function ProfileContent({ profileId }) {
  const router = useRouter();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [message, setMessage] = useState("");
  // Whether the current user has an active subscription to this profile
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const profile = allProfiles.find((p) => p.id === Number(profileId));

  useEffect(() => {
    if (!user || !profile) return;
    api.checkLike(profile.id).then((r) => setLiked(r.liked)).catch(() => {});
  }, [user, profile]);

  // Check if the user has an active subscription to this profile
  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    api.checkServiceAccess(profile.id)
      .then((r) => {
        if (!cancelled) setHasAccess(!!r.has_access);
      })
      .catch(() => {
        if (!cancelled) setHasAccess(false);
      })
      .finally(() => {
        if (!cancelled) setAccessChecked(true);
      });
    return () => { cancelled = true; };
  }, [user, profile]);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center page-bg">
        <div className="text-center">
          <p className="text-6xl text-ink-500">😕</p>
          <h1 className="mt-4 font-display text-2xl text-heading">User not found</h1>
          <p className="mt-2 text-sm text-muted">This profile does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  async function handleLike() {
    if (!user) { router.push("/login"); return; }
    setLikeLoading(true);
    try {
      const res = await api.likeProfile(profile.id);
      setLiked(res.liked);
      setMessage(res.liked ? "Profile liked! ❤️" : "Like removed.");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) { setMessage(err.message); }
    setLikeLoading(false);
  }

  function handleSubscribe() {
    if (!user) { router.push("/login"); return; }

    window.sessionStorage.setItem("subscribe_to_profile_id", String(profile.id));
    window.sessionStorage.setItem("subscribe_to_profile_name", profile.displayName);
    window.sessionStorage.setItem("subscribe_to_profile_avatar", profile.avatar);
    window.sessionStorage.setItem("subscribe_to_profile_country", profile.country || "");

    router.push("/payment");
  }

  return (
    <main className="min-h-screen page-bg">
      {/* Cover */}
      <div className="relative h-80 w-full overflow-hidden">
        <Image src={profile.avatar} fill alt={profile.displayName} className="object-cover blur-sm scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent dark:from-white dark:via-white/50" />
        <a href="/home" className="absolute left-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <button className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60">
          <FaShareAlt className="h-4 w-4" />
        </button>
      </div>

      {message && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gold-400 px-6 py-3 text-sm font-medium text-ink-950 shadow-2xl">
          {message}
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="-mt-24 flex flex-col items-center text-center md:flex-row md:items-end md:text-left md:gap-8">
          <div className="relative shrink-0">
            <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-ink-950 shadow-2xl dark:border-white">
              <Image src={profile.avatar} width={144} height={144} alt={profile.displayName} className="h-full w-full object-cover" />
            </div>
            {profile.online && (
              <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-emerald-400 border-4 border-ink-950 shadow-lg dark:border-white" />
            )}
          </div>
          <div className="mt-4 md:mt-0 md:pb-2">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <h1 className="font-display text-4xl font-semibold text-heading">{profile.displayName}</h1>
              {profile.verified && <MdVerified className="h-6 w-6 text-blue-400" />}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-sm text-muted md:justify-start">
              <span className="flex items-center gap-1">
                <MdLocationOn className="h-4 w-4 text-gold-400" />
                {profile.city}, {profile.country}
              </span>
              <span className="text-ink-600 dark:text-ink-400">•</span>
              <span>{profile.age} years</span>
              {profile.orientation === "gay" && profile.sexual_role && (
                <>
                  <span className="text-ink-600 dark:text-ink-400">•</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    profile.sexual_role === "Top"
                      ? "bg-fuchsia-500/15 text-fuchsia-400"
                      : profile.sexual_role === "Bottom"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-emerald-500/15 text-emerald-400"
                  }`}>
                    {profile.sexual_role}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-gold-400/80">@{profile.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 divide-x border-subtle rounded-2xl border card-bg">
          <div className="py-4 text-center"><p className="text-lg font-semibold text-heading">{profile.posts || 0}</p><p className="mt-0.5 text-xs text-muted">Posts</p></div>
          <div className="py-4 text-center"><p className="text-lg font-semibold text-heading">{profile.followers || "0"}</p><p className="mt-0.5 text-xs text-muted">Followers</p></div>
          <div className="py-4 text-center"><p className="text-lg font-semibold text-heading">{profile.gallery?.length || 0}</p><p className="mt-0.5 text-xs text-muted">Photos</p></div>
        </div>

        {/* Bio */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gold-400">About</h2>
          <p className="mt-3 leading-relaxed text-body">{profile.bio}</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={handleSubscribe} className="flex flex-1 items-center justify-center gap-3 rounded-full bg-gold-400 px-8 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300">
            <Crown className="h-5 w-5" /> Subscribe · {formatPriceCents(profile.price_cents, profile.country)}
          </button>
          <button onClick={handleLike} disabled={likeLoading} className={`flex flex-1 items-center justify-center gap-3 rounded-full border px-8 py-4 text-sm transition ${liked ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-subtle text-body hover:border-gold-400/60 hover:text-gold-300"}`}>
            <FaHeart className={`h-5 w-5 ${liked ? "text-red-400" : ""}`} /> {liked ? "Liked" : "Like Profile"}
          </button>
        </div>

        {/* Gallery */}
        {profile.gallery && profile.gallery.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2">
              <MdPhotoLibrary className="h-5 w-5 text-gold-400" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gold-400">Gallery</h2>
              <span className="text-xs text-muted">({profile.gallery.length} photos)</span>
            </div>

            {/* Premium notice */}
            {!hasAccess && profile.gallery.length > FREE_PHOTOS && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-ink-300 dark:text-ink-700">
                <Lock className="h-4 w-4 shrink-0 text-gold-400" />
                <span>
                  <strong className="text-ink-50 dark:text-ink-950">{profile.gallery.length - FREE_PHOTOS} premium photos</strong> are locked. Subscribe to unlock the full gallery.
                </span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {profile.gallery.map((photo, idx) => {
                const isLocked = !hasAccess && idx >= FREE_PHOTOS;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isLocked) {
                        handleSubscribe();
                      } else {
                        setShowModal(photo);
                      }
                    }}
                    className={`group relative aspect-square overflow-hidden rounded-xl border-subtle ${isLocked ? "cursor-pointer" : "cursor-zoom-in"}`}
                  >
                    <Image src={photo} alt={`${profile.displayName} photo ${idx + 1}`} fill className="object-cover transition duration-300 group-hover:scale-105" />

                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/40 transition group-hover:bg-ink-950/60">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/90 shadow-lg">
                          <Lock className="h-6 w-6 text-ink-950" />
                        </div>
                        <span className="mt-2 text-xs font-semibold text-white">Premium</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photo lightbox */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowModal(null)}>
            <div className="relative max-h-[90vh] max-w-3xl">
              <Image src={showModal} alt="Profile photo" width={1200} height={1200} className="max-h-[85vh] w-auto rounded-2xl object-contain" />
              <button
                onClick={() => setShowModal(null)}
                className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-950 shadow-lg"
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProfilePage({ params }) {
  const { id } = use(params);
  return <ProfileContent profileId={id} />;
}