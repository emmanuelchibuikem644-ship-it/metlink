"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, MessageCircle, Send } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import SubscriptionRoute from "../../components/SubscriptionRoute";
import allProfiles from "../../data/profiles";

function ChatContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") return allProfiles[0] || null;
    const storedProfile = window.sessionStorage.getItem("chat_profile");
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        return {
          id: Number(parsed.id),
          displayName: parsed.displayName || parsed.name,
          name: parsed.displayName || parsed.name,
          avatar: parsed.avatar,
          orientation: parsed.orientation || "straight",
        };
      } catch {
        return allProfiles[0] || null;
      }
    }
    return allProfiles[0] || null;
  });
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Load messages + poll every 3s so admin replies show up automatically
  useEffect(() => {
    if (!profile || !user) return;

    let cancelled = false;

    async function loadMessages() {
      try {
        const data = await api.chatWithProfile(profile.id);
        if (!cancelled) {
          setMessages(data.messages || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMessages();
    const interval = window.setInterval(loadMessages, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [profile, user]);

  async function handleSendMessage() {
    const content = messageInput.trim();
    if ((!content && !imageFile) || !profile || !profile.id) return;

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("profile_name", profile.displayName || profile.name);
      formData.append("profile_avatar", profile.avatar || "");
      formData.append("profile_orientation", profile.orientation || "straight");
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const newMessage = await api.sendChatMessage(Number(profile.id), formData, true);

      setMessages((current) => [...current, { ...newMessage, is_from_subscriber: true }]);
      setMessageInput("");
      setImageFile(null);
    } catch (err) {
      setError(err.message || "Unable to send message right now.");
    } finally {
      setSending(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 dark:bg-white">
        <p className="text-sm text-ink-400 dark:text-ink-500">Preparing chat…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-ink-950 px-6 py-8 dark:bg-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/home")}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-ink-400 hover:text-ink-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2 text-ink-50 dark:text-ink-950">
            <MessageCircle className="h-5 w-5 text-gold-400" />
            <span className="font-display text-2xl">Main chat</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-4 shadow-2xl dark:border-ink-200 dark:bg-white">
          <div className="mb-4 border-b border-white/10 pb-4 dark:border-ink-200">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Chatting with</p>
            <h1 className="mt-2 font-display text-3xl text-ink-50 dark:text-ink-950">
              {profile.displayName || profile.name}
            </h1>
          </div>

          <div className="max-h-[26rem] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-ink-950/60 p-4 dark:border-ink-200 dark:bg-ink-100/80">
            {loading ? (
              <p className="text-sm text-ink-400">Loading messages…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-ink-400">No messages yet. Start the conversation below.</p>
            ) : (
              messages.map((item) => (
                <div
                  key={item.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    item.is_from_subscriber
                      ? "ml-auto bg-gold-400 text-ink-950"
                      : "bg-white/5 text-ink-50 dark:bg-ink-200 dark:text-ink-950"
                  }`}
                >
                  <div className="mb-1 text-[11px] uppercase tracking-wide opacity-75">
                    {item.is_from_subscriber ? "You" : profile.displayName || profile.name}
                  </div>
                  {item.content ? <div>{item.content}</div> : null}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt="Attached message"
                      className="mt-2 max-h-64 w-full rounded-xl object-cover"
                    />
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50 dark:border-ink-200 dark:bg-white dark:text-ink-950">
              <Camera className="h-4 w-4 text-gold-400" />
              <span className="font-medium">Add photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {imageFile && <div className="text-xs text-ink-400">Selected: {imageFile.name}</div>}
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message"
                className="flex-1 rounded-full border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || (!messageInput.trim() && !imageFile)}
                className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {sending ? "Sending…" : "Send"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <SubscriptionRoute>
        <ChatContent />
      </SubscriptionRoute>
    </ProtectedRoute>
  );
}
