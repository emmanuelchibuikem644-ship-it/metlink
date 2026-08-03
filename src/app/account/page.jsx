"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ChevronDown, CheckCircle2, Circle, Edit3, ImagePlus, Link2, Search, Settings2, Trash2 } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function AccountPage() {
  const { user, updateProfilePic, updateBackgroundPic } = useAuth();
  const [status, setStatus] = useState("Available");
  const [showStatus, setShowStatus] = useState(false);
  const [preview, setPreview] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initials = useMemo(() => {
    if (!user?.display_name) return "U";
    return user.display_name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  const username = useMemo(() => {
    if (!user?.display_name) return "@user";
    return `@${user.display_name.toLowerCase().replace(/\s+/g, "").slice(0, 10)}`;
  }, [user]);

  useEffect(() => {
    if (user?.profile_pic) {
      setPreview(user.profile_pic);
    }
    if (user?.background_pic) {
      setBackgroundImage(user.background_pic);
    }
  }, [user]);

  function handleFileChange(event) {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      if (typeof imageData === "string") {
        setPreview(imageData);
        setSaving(true);
        updateProfilePic(imageData);
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleBackgroundFileChange(event) {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      if (typeof imageData === "string") {
        setBackgroundImage(imageData);
        setSaving(true);
        updateBackgroundPic(imageData);
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setPreview("");
    updateProfilePic(null);
  }

  function handleRemoveBackground() {
    setBackgroundImage("");
    updateBackgroundPic(null);
  }

  function toggleEditMode() {
    setIsEditing((current) => !current);
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-ink-950 dark:bg-[#0d0d0d] dark:text-white">
        <div
          className="relative h-48 w-full bg-cover bg-center"
          style={{
            backgroundImage: backgroundImage
              ? `url('${backgroundImage}')`
              : `url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200')`,
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 px-6 py-10">
          <div className="lg:col-span-2">
            <div className="-mt-16 flex justify-between items-start gap-6">
              <div className="flex gap-5">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-4xl font-bold border-4 border-white dark:border-[#0d0d0d]">
                    {preview ? (
                      <img src={preview} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-green-500 border-2 border-white dark:border-black" />
                </div>

                <div className="mt-16">
                  <h1 className="text-3xl font-bold">{user?.display_name || "Member"}</h1>
                  <div className="flex items-center gap-3 mt-2 text-zinc-500 dark:text-zinc-400">
                    <span>{username}</span>
                    <button
                      onClick={() => setShowStatus(!showStatus)}
                      className="flex items-center gap-1 hover:text-ink-950 dark:hover:text-white"
                    >
                      {status}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-16 flex gap-3">
                <button
                  onClick={toggleEditMode}
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label={isEditing ? "Finish editing" : "Edit profile"}
                >
                  {isEditing ? <CheckCircle2 className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                </button>
                <button className="rounded-full border border-zinc-300 dark:border-zinc-700 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Share profile">
                  <Link2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isEditing && (
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <label htmlFor="profile-pic-upload" className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <Camera className="h-4 w-4" />
                </label>
                <label htmlFor="background-pic-upload" className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <ImagePlus className="h-4 w-4" />
                </label>
                <button
                  onClick={handleRemovePhoto}
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Remove profile picture"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRemoveBackground}
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Remove background image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            <input
              id="profile-pic-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              id="background-pic-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundFileChange}
            />

            {showStatus && (
              <div className="mt-4 w-60 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] p-2 shadow-lg">
                <button
                  onClick={() => {
                    setStatus("Available");
                    setShowStatus(false);
                  }}
                  className="w-full rounded-lg px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Circle className="h-3 w-3 text-emerald-400" />
                  Available
                </button>
                <button
                  onClick={() => {
                    setStatus("Invisible");
                    setShowStatus(false);
                  }}
                  className="w-full rounded-lg px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Circle className="h-3 w-3 text-zinc-400" />
                  Invisible
                </button>
              </div>
            )}

            <div className="mt-10 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex">
                <button className="border-b-2 border-cyan-500 px-6 py-4 font-semibold">
                  Posts
                </button>
                <button className="px-6 py-4 text-zinc-500">Media</button>
              </div>
            </div>

            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <Search className="mx-auto h-20 w-20 text-zinc-400 dark:text-zinc-500" />
                <p className="mt-5 text-zinc-400 dark:text-zinc-500">No posts yet</p>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111] p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  placeholder="Search user's posts"
                  className="w-full rounded-lg bg-white dark:bg-[#1a1a1a] py-3 pl-10 pr-3 text-ink-950 dark:text-white outline-none border border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111] p-5">
              <div className="flex justify-between items-center">
                <h2 className="font-bold">Spotify</h2>
                <Settings2 className="h-4 w-4 text-zinc-400" />
              </div>
              <button className="mt-5 w-full rounded-full bg-green-500 py-3 font-bold text-black hover:bg-green-400">
                Sign in with Spotify
              </button>
            </div>

            <div className="mt-8 text-sm text-zinc-400 dark:text-zinc-500 flex gap-5">
              <a href="#">Privacy</a>
              <a href="#">Cookie Notice</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}