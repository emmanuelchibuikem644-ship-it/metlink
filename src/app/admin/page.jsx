"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Trash2, Activity, Eye, LogOut, Search, X, Download, AlertTriangle, Heart, CreditCard, MessageSquare, Send, Camera, Bitcoin, Headset, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";
import allProfiles from "../../data/profiles";

/* ── Guard component ─────────────────────────────────────── */

function RequireAdmin({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = window.sessionStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin-login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-sm text-ink-400">
        Verifying access…
      </div>
    );
  }
  return children;
}

/* ── Main dashboard ──────────────────────────────────────── */

function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [likes, setLikes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [chatConversations, setChatConversations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cryptoPayments, setCryptoPayments] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedSupportTicketId, setSelectedSupportTicketId] = useState(null);
  const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportReplyText, setSupportReplyText] = useState("");
  const [supportReplying, setSupportReplying] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState(null);
  const [replying, setReplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // users | likes | subs | chats | bookings | crypto | support
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");

  const adminUser = typeof window !== "undefined"
    ? JSON.parse(window.sessionStorage.getItem("admin_user") || "{}")
    : {};

  // Load all data from backend
  function loadData() {
    setError("");
    Promise.all([
      api.adminStats().catch((e) => { setError(e.message); return {}; }),
      api.adminUsers().catch(() => []),
      api.adminLikes().catch(() => []),
      api.adminSubscriptions().catch(() => []),
      api.adminChats().catch(() => []),
      api.adminBookings().catch(() => []),
      api.adminCryptoPayments().catch(() => []),
      api.adminSupportTickets().catch(() => ({ tickets: [] })),
    ]).then(([s, u, l, subs, chats, allBookings, crypto, support]) => {
      setStats(s);
      setUsers(u);
      setLikes(l);
      setSubscriptions(subs);
      setChatConversations(chats);
      setBookings(allBookings);
      setCryptoPayments(crypto);
      setSupportTickets(support.tickets || []);
    });
  }

  useEffect(() => {
    loadData();
  }, [refresh]);

  useEffect(() => {
    if (activeTab === "chats" && chatConversations.length > 0 && !selectedConversationId) {
      openConversation(chatConversations[0].id);
    }
  }, [activeTab, chatConversations]);

  async function openConversation(conversationId) {
    setSelectedConversationId(conversationId);
    try {
      const data = await api.adminChatDetail(conversationId);
      setSelectedConversation(data.conversation);
      setConversationMessages(data.messages);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openSupportTicket(ticketId) {
    setSelectedSupportTicketId(ticketId);
    try {
      const data = await api.adminSupportTicketDetail(ticketId);
      setSelectedSupportTicket(data);
      setSupportMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSupportReply() {
    const content = supportReplyText.trim();
    if (!selectedSupportTicketId || !content) return;

    setSupportReplying(true);
    try {
      await api.adminSupportReply(selectedSupportTicketId, content);
      setSupportMessages((current) => [...current, {
        id: Date.now(),
        sender_type: "admin",
        content,
        created_at: new Date().toISOString(),
      }]);
      setSupportReplyText("");
      const data = await api.adminSupportTickets();
      setSupportTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSupportReplying(false);
    }
  }

  async function resolveSupportTicket(ticketId) {
    try {
      await api.adminSupportResolve(ticketId);
      await openSupportTicket(ticketId);
      const data = await api.adminSupportTickets();
      setSupportTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReply() {
    const content = replyText.trim();
    if (!selectedConversationId || (!content && !replyImage)) return;

    setReplying(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (replyImage) {
        formData.append("image", replyImage);
      }

      const message = await api.adminChatReply(selectedConversationId, formData, true);
      setConversationMessages((current) => [...current, message]);
      setReplyText("");
      setReplyImage(null);
      setChatConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedConversationId
            ? {
                ...conversation,
                last_message: content || "Image",
                last_message_at: message.created_at,
                unread_count: 0,
              }
            : conversation
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setReplying(false);
    }
  }

  // Filter users by search
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.orientation?.toLowerCase().includes(q) ||
        u.gender?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const groupedChats = useMemo(() => {
    return {
      straight: chatConversations.filter((conversation) => conversation.profile_orientation === "straight"),
      gay: chatConversations.filter((conversation) => conversation.profile_orientation === "gay"),
    };
  }, [chatConversations]);

  function handleLogout() {
    window.sessionStorage.removeItem("admin_token");
    window.sessionStorage.removeItem("admin_user");
    router.push("/admin-login");
  }

  async function handleDeleteUser(id) {
    try {
      await api.adminDeleteUser(id);
      setConfirmDelete(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateBookingStatus(bookingId, status) {
    try {
      await api.adminBookingStatus(bookingId, status);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateCryptoPaymentStatus(paymentId, status) {
    try {
      await api.adminCryptoPaymentStatus(paymentId, status);
      setCryptoPayments((current) =>
        current.map((payment) =>
          payment.id === paymentId ? { ...payment, status } : payment
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearAll() {
    try {
      await api.adminClearUsers();
      setShowDeleteAll(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(users, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meetlink-users-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 border-b border-red-500/20 bg-ink-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-red-400" />
            <span className="font-display text-xl italic tracking-wide text-red-400">
              ADMIN PANEL
            </span>
            <span className="ml-2 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400">
              Oga only
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink-400 sm:inline">
              {adminUser.display_name || "Admin"}
            </span>
            <button
              onClick={() => setRefresh((r) => r + 1)}
              className="rounded-lg border border-white/10 p-2 text-ink-400 hover:bg-white/5 hover:text-ink-50"
              title="Refresh data"
            >
              <Activity className="h-4 w-4" />
            </button>
            <Link
              href="/home"
              className="rounded-lg border border-white/10 p-2 text-ink-400 hover:bg-white/5 hover:text-ink-50"
              title="View site"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-5">
            <p className="text-xs uppercase tracking-widest text-ink-400">Total users</p>
            <p className="mt-2 font-display text-4xl text-ink-50">{stats.total_users ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-5">
            <p className="text-xs uppercase tracking-widest text-ink-400">Active today</p>
            <p className="mt-2 font-display text-4xl text-emerald-400">{stats.active_today ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-5">
            <p className="text-xs uppercase tracking-widest text-ink-400">Straight</p>
            <p className="mt-2 font-display text-4xl text-gold-400">{stats.straight_count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-5">
            <p className="text-xs uppercase tracking-widest text-ink-400">Gay</p>
            <p className="mt-2 font-display text-4xl text-fuchsia-400">{stats.gay_count ?? 0}</p>
          </div>
        </div>

        {/* ── Extra stats row ── */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4">
            <div className="flex items-center gap-2 text-ink-400">
              <Heart className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest">Total likes</span>
            </div>
            <p className="mt-1 font-display text-2xl text-ink-50">{stats.total_likes ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4">
            <div className="flex items-center gap-2 text-ink-400">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest">Subscriptions</span>
            </div>
            <p className="mt-1 font-display text-2xl text-ink-50">{stats.total_subscriptions ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-widest text-ink-400">Profiles in DB</p>
            <p className="mt-1 font-display text-2xl text-ink-50">{allProfiles.length}</p>
          </div>
        </div>

        {/* ── Gender breakdown ── */}
        {stats.gender_counts && Object.keys(stats.gender_counts).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(stats.gender_counts).map(([gender, count]) => (
              <span key={gender} className="rounded-full border border-white/10 bg-ink-900/40 px-3 py-1 text-xs text-ink-400">
                {gender}: <span className="text-ink-50 font-medium">{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Tab navigation ── */}
        <div className="mt-10 flex gap-2 overflow-x-auto border-b border-white/10 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab("users")}
            className={`shrink-0 whitespace-nowrap px-3 pb-3 text-sm font-medium transition ${
              activeTab === "users" ? "border-b-2 border-gold-400 text-gold-400" : "text-ink-400 hover:text-ink-50"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={`shrink-0 whitespace-nowrap px-3 pb-3 text-sm font-medium transition ${
              activeTab === "likes" ? "border-b-2 border-gold-400 text-gold-400" : "text-ink-400 hover:text-ink-50"
            }`}
          >
            Likes ({likes.length})
          </button>
          <button
            onClick={() => setActiveTab("subs")}
            className={`shrink-0 whitespace-nowrap px-3 pb-3 text-sm font-medium transition ${
              activeTab === "subs" ? "border-b-2 border-gold-400 text-gold-400" : "text-ink-400 hover:text-ink-50"
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={`shrink-0 whitespace-nowrap px-3 pb-3 text-sm font-medium transition ${
              activeTab === "chats" ? "border-b-2 border-gold-400 text-gold-400" : "text-ink-400 hover:text-ink-50"
            }`}
          >
            Chats ({chatConversations.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`shrink-0 whitespace-nowrap px-3 pb-3 text-sm font-medium transition ${
              activeTab === "bookings" ? "border-b-2 border-gold-400 text-gold-400" : "text-ink-400 hover:text-ink-50"
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("crypto")}
            className={`shrink-0 whitespace-nowrap px-3 pb-3 text-sm font-medium transition ${
              activeTab === "crypto" ? "border-b-2 border-gold-400 text-gold-400" : "text-ink-400 hover:text-ink-50"
            }`}
          >
            Crypto ({cryptoPayments.length})
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`shrink-0 whitespace-nowrap px-3 pb-3 text-sm font-medium transition ${
              activeTab === "support" ? "border-b-2 border-gold-400 text-gold-400" : "text-ink-400 hover:text-ink-50"
            }`}
          >
            <span className="flex items-center gap-1">
              <Headset className="h-4 w-4" /> Support ({supportTickets.length})
            </span>
          </button>
        </div>

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-2xl text-ink-50">
                Booking requests
                <span className="ml-3 text-sm text-ink-400">({bookings.length})</span>
              </h2>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-ink-900/80">
                  <tr>
                    <th className="px-5 py-4 font-medium text-ink-400">Client</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Service</th>
                    <th className="px-5 py-4 font-medium text-ink-400">When</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Status</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-ink-500">No bookings yet.</td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                        <td className="px-5 py-4">
                          <div className="text-ink-50">{booking.full_name}</div>
                          <div className="text-xs text-ink-400">{booking.email}</div>
                        </td>
                        <td className="px-5 py-4 text-ink-400">
                          <div>{booking.service_name}</div>
                          <div className="text-xs">{booking.service_price || "—"}</div>
                        </td>
                        <td className="px-5 py-4 text-ink-400">
                          <div>{booking.date || "—"}</div>
                          <div className="text-xs">{booking.time || "—"}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                            booking.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : booking.status === "declined"
                                ? "bg-red-500/15 text-red-300"
                                : "bg-gold-400/15 text-gold-300"
                          }`}>{booking.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateBookingStatus(booking.id, "approved")}
                              className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, "declined")}
                              className="rounded bg-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/30"
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CRYPTO PAYMENTS TAB ── */}
        {activeTab === "crypto" && (
          <div className="mt-6">
            <h2 className="font-display text-2xl text-ink-50">
              Crypto payments
              <span className="ml-3 text-sm text-ink-400">({cryptoPayments.length})</span>
            </h2>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-ink-900/80">
                  <tr>
                    <th className="px-5 py-4 font-medium text-ink-400">User</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Coin</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Amount</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Purpose</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Wallet</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Status</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cryptoPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-ink-500">No crypto payments yet.</td>
                    </tr>
                  ) : (
                    cryptoPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                        <td className="px-5 py-4">
                          <div className="text-ink-50">{payment.subscriber?.display_name || payment.subscriber?.email}</div>
                          <div className="text-xs text-ink-400">{payment.subscriber?.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-2 text-ink-50">
                            <Bitcoin className="h-4 w-4 text-orange-400" />
                            <span className="uppercase">{payment.coin}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-ink-400">{payment.amount_display}</td>
                        <td className="px-5 py-4 text-ink-400">{payment.purpose || "—"}</td>
                        <td className="px-5 py-4">
                          <code className="break-all text-xs text-ink-400">{payment.wallet_address || "—"}</code>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                            payment.status === "confirmed"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : payment.status === "declined"
                                ? "bg-red-500/15 text-red-300"
                                : "bg-gold-400/15 text-gold-300"
                          }`}>{payment.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateCryptoPaymentStatus(payment.id, "confirmed")}
                              className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateCryptoPaymentStatus(payment.id, "declined")}
                              className="rounded bg-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/30"
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-2xl text-ink-50">
                Registered users
                <span className="ml-3 text-sm text-ink-400">({users.length})</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 rounded-lg border border-white/10 bg-ink-900/60 py-2 pl-10 pr-3 text-sm text-ink-50 outline-none placeholder:text-ink-500 focus:border-gold-400/50"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-50">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-ink-400 hover:bg-white/5 hover:text-ink-50">
                  <Download className="h-4 w-4" /> Export
                </button>
                <button onClick={() => setShowDeleteAll(true)} className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" /> Clear all
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-ink-900/80">
                  <tr>
                    <th className="px-5 py-4 font-medium text-ink-400">Name</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Email</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Gender</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Orientation</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Verified</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Joined</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Last login</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-ink-500">
                        {searchQuery ? "No users match your search." : "No registered users yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                        <td className="px-5 py-4"><span className="text-ink-50">{u.display_name}</span></td>
                        <td className="px-5 py-4 text-ink-400">{u.email || "—"}</td>
                        <td className="px-5 py-4 text-ink-400">{u.gender || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                            u.orientation === "gay" ? "bg-fuchsia-500/15 text-fuchsia-300" :
                            u.orientation === "straight" ? "bg-gold-400/15 text-gold-300" :
                            "bg-ink-800 text-ink-400"
                          }`}>{u.orientation || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          {u.is_email_verified ? (
                            <span className="text-emerald-400">✓</span>
                          ) : (
                            <span className="text-ink-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-ink-500">
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4 text-ink-500">
                          {u.last_login ? new Date(u.last_login).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4">
                          {confirmDelete === u.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleDeleteUser(u.id)} className="rounded bg-red-500/20 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/30">Confirm</button>
                              <button onClick={() => setConfirmDelete(null)} className="rounded bg-white/10 px-2.5 py-1 text-xs text-ink-400 hover:bg-white/20">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(u.id)} className="rounded p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-400" title="Remove user">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LIKES TAB ── */}
        {activeTab === "likes" && (
          <div className="mt-6">
            <h2 className="font-display text-2xl text-ink-50">
              Profile likes
              <span className="ml-3 text-sm text-ink-400">({likes.length})</span>
            </h2>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-ink-900/80">
                  <tr>
                    <th className="px-5 py-4 font-medium text-ink-400">From</th>
                    <th className="px-5 py-4 font-medium text-ink-400">To</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {likes.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-12 text-center text-ink-500">No likes yet.</td></tr>
                  ) : (
                    likes.map((l) => (
                      <tr key={l.id} className="border-b border-white/5">
                        <td className="px-5 py-4 text-ink-50">{l.from_user?.display_name || l.from_user?.email}</td>
                        <td className="px-5 py-4 text-ink-50">{l.to_user?.display_name || l.to_user?.email}</td>
                        <td className="px-5 py-4 text-ink-500">{new Date(l.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTIONS TAB ── */}
        {activeTab === "subs" && (
          <div className="mt-6">
            <h2 className="font-display text-2xl text-ink-50">
              Active subscriptions
              <span className="ml-3 text-sm text-ink-400">({subscriptions.length})</span>
            </h2>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-ink-900/80">
                  <tr>
                    <th className="px-5 py-4 font-medium text-ink-400">Subscriber</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Creator</th>
                    <th className="px-5 py-4 font-medium text-ink-400">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-12 text-center text-ink-500">No subscriptions yet.</td></tr>
                  ) : (
                    subscriptions.map((s) => (
                      <tr key={s.id} className="border-b border-white/5">
                        <td className="px-5 py-4 text-ink-50">{s.subscriber?.display_name || s.subscriber?.email}</td>
                        <td className="px-5 py-4 text-ink-50">{s.creator?.display_name || s.creator?.email}</td>
                        <td className="px-5 py-4 text-ink-500">{new Date(s.started_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUPPORT TAB ── */}
        {activeTab === "support" && (
          <div className="mt-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-ink-50">Customer support</h2>
              <span className="rounded-full border border-white/10 bg-ink-900/60 px-3 py-1 text-xs text-ink-400">
                {supportTickets.length} tickets
              </span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              {/* Ticket list */}
              <div className="rounded-2xl border border-white/10 bg-ink-900/60">
                <div className="border-b border-white/10 px-5 py-4">
                  <h3 className="font-semibold text-ink-50">Support tickets</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 bg-ink-900/80">
                      <tr>
                        <th className="px-5 py-4 font-medium text-ink-400">User</th>
                        <th className="px-5 py-4 font-medium text-ink-400">Last message</th>
                        <th className="px-5 py-4 font-medium text-ink-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supportTickets.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-10 text-center text-ink-500">
                            No support tickets yet.
                          </td>
                        </tr>
                      ) : (
                        supportTickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className={`cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03] ${
                              selectedSupportTicketId === ticket.id ? "bg-gold-400/10" : ""
                            }`}
                            onClick={() => openSupportTicket(ticket.id)}
                          >
                            <td className="px-5 py-4">
                              <div className="text-ink-50">{ticket.user?.display_name || ticket.user?.email}</div>
                              <div className="text-xs text-ink-400">{ticket.user?.email}</div>
                            </td>
                            <td className="px-5 py-4 text-ink-500">
                              {ticket.last_message || "No messages yet."}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                                ticket.status === "resolved"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-gold-400/15 text-gold-300"
                              }`}>{ticket.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ticket detail */}
              <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-ink-50">
                    <Headset className="h-4 w-4 text-gold-400" />
                    <h3 className="font-semibold">Ticket detail</h3>
                  </div>
                  {selectedSupportTicket && selectedSupportTicket.status === "open" && (
                    <button
                      onClick={() => resolveSupportTicket(selectedSupportTicket.id)}
                      className="flex items-center gap-1 rounded bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </button>
                  )}
                </div>

                {selectedSupportTicket ? (
                  <>
                    <div className="mb-4 rounded-xl border border-white/10 bg-ink-950/70 p-4">
                      <div className="text-sm text-ink-400">User</div>
                      <div className="mt-1 font-semibold text-ink-50">
                        {selectedSupportTicket.user?.display_name || selectedSupportTicket.user?.email}
                      </div>
                      <div className="mt-1 text-xs text-ink-500">
                        {selectedSupportTicket.user?.email}
                      </div>
                      {selectedSupportTicket.whatsapp_phone && (
                        <div className="mt-1 text-xs text-ink-500">
                          WhatsApp: {selectedSupportTicket.whatsapp_phone}
                        </div>
                      )}
                    </div>

                    <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                      {supportMessages.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-ink-500">
                          No messages in this ticket yet.
                        </div>
                      ) : (
                        supportMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                              message.sender_type === "user"
                                ? "ml-auto bg-gold-400 text-ink-950"
                                : "bg-white/5 text-ink-50"
                            }`}
                          >
                            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-75">
                              {message.sender_type === "user" ? "Customer" : "You (Admin)"}
                            </div>
                            {message.content}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4">
                      <textarea
                        value={supportReplyText}
                        onChange={(e) => setSupportReplyText(e.target.value)}
                        rows={3}
                        className="input-field min-h-[96px] resize-none"
                        placeholder="Reply to the customer..."
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        disabled={supportReplying || !supportReplyText.trim()}
                        onClick={handleSupportReply}
                        className="btn-primary !px-4 !py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          {supportReplying ? "Sending…" : "Send reply"}
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-ink-500">
                    Select a ticket to see the conversation and reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CHATS TAB ── */}
        {activeTab === "chats" && (
          <div className="mt-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-ink-50">Chat monitor</h2>
              <span className="rounded-full border border-white/10 bg-ink-900/60 px-3 py-1 text-xs text-ink-400">
                {chatConversations.length} conversations
              </span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                {(["straight", "gay"]).map((orientation) => {
                  const rows = groupedChats[orientation];
                  return (
                    <div key={orientation} className="rounded-2xl border border-white/10 bg-ink-900/60">
                      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <h3 className="font-semibold text-ink-50 capitalize">{orientation} chats</h3>
                        <span className="text-xs text-ink-400">{rows.length}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-white/10 bg-ink-900/80">
                            <tr>
                              <th className="px-5 py-4 font-medium text-ink-400">Profile</th>
                              <th className="px-5 py-4 font-medium text-ink-400">Subscriber</th>
                              <th className="px-5 py-4 font-medium text-ink-400">Last message</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-5 py-10 text-center text-ink-500">
                                  No {orientation} conversations yet.
                                </td>
                              </tr>
                            ) : (
                              rows.map((conversation) => (
                                <tr
                                  key={conversation.id}
                                  className={`cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03] ${
                                    selectedConversationId === conversation.id ? "bg-gold-400/10" : ""
                                  }`}
                                  onClick={() => openConversation(conversation.id)}
                                >
                                  <td className="px-5 py-4 text-ink-50">{conversation.profile_name}</td>
                                  <td className="px-5 py-4 text-ink-400">{conversation.subscriber?.display_name || conversation.subscriber?.email}</td>
                                  <td className="px-5 py-4 text-ink-500">
                                    {conversation.last_message || "No messages yet."}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-5">
                <div className="mb-4 flex items-center gap-2 text-ink-50">
                  <MessageSquare className="h-4 w-4 text-gold-400" />
                  <h3 className="font-semibold">Conversation detail</h3>
                </div>

                {selectedConversation ? (
                  <>
                    <div className="mb-4 rounded-xl border border-white/10 bg-ink-950/70 p-4">
                      <div className="text-sm text-ink-400">Profile</div>
                      <div className="mt-1 font-semibold text-ink-50">{selectedConversation.profile_name}</div>
                      <div className="mt-1 text-xs text-ink-500">
                        Subscriber: {selectedConversation.subscriber?.display_name || selectedConversation.subscriber?.email}
                      </div>
                    </div>

                    <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                      {conversationMessages.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-ink-500">
                          No messages in this conversation yet.
                        </div>
                      ) : (
                        conversationMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                              message.is_from_subscriber
                                ? "ml-auto bg-gold-400 text-ink-950"
                                : "bg-white/5 text-ink-50"
                            }`}
                          >
                            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-75">
                              {message.is_from_subscriber ? "Subscriber" : "Profile"}
                            </div>
                            {message.content ? <div>{message.content}</div> : null}
                            {message.image ? (
                              <img
                                src={message.image}
                                alt="Attached reply"
                                className="mt-2 max-h-64 w-full rounded-xl object-cover"
                              />
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-ink-50">
                        <Camera className="h-4 w-4 text-gold-400" />
                        <span className="font-medium">Send photo reply</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => setReplyImage(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {replyImage && <div className="text-xs text-ink-400">Selected: {replyImage.name}</div>}
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="input-field min-h-[96px] resize-none"
                        placeholder="Reply as the profile..."
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        disabled={replying || (!replyText.trim() && !replyImage)}
                        onClick={handleReply}
                        className="btn-primary !px-4 !py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          {replying ? "Sending…" : "Send reply"}
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-ink-500">
                    Select a conversation to see the messages and reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete all modal ── */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-red-500/30 bg-ink-900 p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Clear all users?</h3>
            </div>
            <p className="mt-3 text-sm text-ink-400">
              This will permanently delete every registered user from the database. Profile cards in the code will not be affected. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteAll(false)} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-ink-400 hover:bg-white/5">Cancel</button>
              <button onClick={handleClearAll} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500">Yes, clear everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}