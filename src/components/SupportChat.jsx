"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Headset, Send, X, MessageCircle, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export default function SupportChat() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Load existing support ticket when the widget opens (with timeout to avoid hanging)
  const loadTickets = useCallback(async () => {
    if (!user) return;
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );
      const data = await Promise.race([api.mySupportTickets(), timeoutPromise]);
      const tickets = data?.tickets || [];
      if (tickets.length > 0) {
        const latest = tickets[0];
        setTicketId(latest.id);
        setHasTicket(true);
        setMessages(latest.messages || []);
      } else {
        setTicketId(null);
        setHasTicket(false);
        setMessages([]);
      }
    } catch {
      // If the API isn't available or times out, start fresh
      setTicketId(null);
      setHasTicket(false);
      setMessages([]);
    }
  }, [user]);

  // Poll for new messages when the chat is open (with timeout)
  useEffect(() => {
    if (!open || !user || !hasTicket || !ticketId) return;
    const interval = setInterval(async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        );
        const data = await Promise.race([api.getSupportTicket(ticketId), timeoutPromise]);
        if (data && data.messages) {
          setMessages(data.messages);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [open, user, hasTicket, ticketId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Load tickets when opening and user is ready
  useEffect(() => {
    if (open && user) {
      loadTickets();
    }
  }, [open, user, loadTickets]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");

    try {
      if (!user) {
        // Not logged in — redirect to login
        router.push("/login");
        return;
      }

      let msgs;
      if (hasTicket && ticketId) {
        const data = await api.sendSupportMessage(ticketId, text);
        msgs = data.messages || [];
      } else {
        // Create a new ticket with the first message
        const data = await api.createSupportTicket("Support", text);
        setTicketId(data.id);
        setHasTicket(true);
        msgs = data.messages || [];
      }
      setMessages(msgs);
      setInput("");
    } catch (err) {
      setError(err.message || "Could not send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function startTyping() {
    setTyping(true);
  }

  function stopTyping() {
    setTyping(false);
  }

  return (
    <>
      {/* Floating round support button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Customer Support"
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-gold-400 to-amber-500 text-white shadow-2xl shadow-amber-500/30 transition-all hover:scale-110 hover:shadow-amber-500/50 dark:border-ink-300"
      >
        {open ? (
          <X className="h-7 w-7" />
        ) : (
          <Headset className="h-7 w-7" />
        )}
        {/* Pulsing dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900" />
        </span>
      </button>

      {/* Chat widget */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[480px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl dark:border-ink-200 dark:bg-ink-100 sm:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-gold-400 to-amber-500 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Headset className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink-950">Meetlink Support</p>
              <p className="text-xs text-ink-800">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Usually replies within a few minutes
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-ink-800 transition hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto bg-ink-950/60 px-4 py-4 dark:bg-white/60">
            {!user && authLoading && (
              <p className="text-center text-xs text-ink-500 dark:text-ink-600">Loading…</p>
            )}

            {!user && !authLoading && (
              <div className="mt-10 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/10">
                  <MessageCircle className="h-8 w-8 text-gold-400" />
                </div>
                <p className="mt-4 text-sm font-semibold text-ink-50 dark:text-ink-950">Need help?</p>
                <p className="mt-1 max-w-[250px] text-xs text-ink-400 dark:text-ink-600">
                  Please log in to chat with our support team.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-4 flex items-center gap-2 rounded-full bg-gold-400 px-6 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
                >
                  Login <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            )}

            {user && messages.length === 0 && !sending && (
              <div className="mt-4">
                <div className="mb-3 flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-ink-800 px-4 py-3 text-sm text-ink-50 dark:bg-ink-200 dark:text-ink-950">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-gold-400 dark:text-gold-500">
                      Meetlink Support
                    </p>
                    👋 Hi there! Welcome to Meetlink Support.
                    <br /><br />
                    How can we help you today? Whether it's about payments, subscriptions, or anything else, we're here for you. Just type your message below and we'll get back to you shortly! 💛
                  </div>
                </div>
                <div className="mb-3 flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-ink-800 px-4 py-3 text-sm text-ink-50 dark:bg-ink-200 dark:text-ink-950">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-gold-400 dark:text-gold-500">
                      Meetlink Support
                    </p>
                    💡 <strong>Tip:</strong> You can ask about card payments, crypto (BTC, Ethereum, USDT), or any issue you're facing.
                  </div>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`mb-3 flex ${m.sender_type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.sender_type === "user"
                      ? "rounded-br-sm bg-gold-400 text-ink-950"
                      : "rounded-bl-sm bg-ink-800 text-ink-50 dark:bg-ink-200 dark:text-ink-950"
                  }`}
                >
                  {m.content}
                  <p
                    className={`mt-1 text-[10px] ${
                      m.sender_type === "user" ? "text-ink-700" : "text-ink-500 dark:text-ink-600"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-ink-800 px-4 py-2.5 dark:bg-ink-200">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Input area */}
          {user && (
            <div className="flex items-center gap-2 border-t border-white/10 bg-ink-900/80 px-3 py-3 dark:border-ink-200 dark:bg-ink-100/80">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={startTyping}
                onBlur={stopTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Type your message…"
                className="flex-1 rounded-full border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-ink-50 outline-none transition focus:border-gold-400 dark:border-ink-200 dark:bg-white dark:text-ink-950"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-950 transition hover:bg-gold-300 disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}