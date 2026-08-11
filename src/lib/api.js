const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const TOKEN_KEY = "meetlink_tokens";

export function getTokens() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setTokens(tokens) {
  if (typeof window === "undefined") return;
  if (!tokens) {
    window.localStorage.removeItem(TOKEN_KEY);
  } else {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  }
}

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;

  const res = await fetch(`${API_URL}/accounts/login/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!res.ok) {
    setTokens(null);
    return null;
  }
  const data = await res.json();
  const next = { ...tokens, access: data.access };
  setTokens(next);
  return next.access;
}

/**
 * Thin wrapper around fetch that talks to the Django API, attaches the JWT
 * access token, and retries once after a silent refresh on a 401.
 */
export async function apiFetch(path, { method = "GET", body, auth = true, retry = true, multipart = false, timeout = 30000 } = {}) {
  const headers = {};

  if (!multipart) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const tokens = getTokens();
    if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? (multipart ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 && auth && retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiFetch(path, { method, body, auth, retry: false });
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. some 204s / webhook responses)
  }

  if (!res.ok) {
    const message =
      (data && (data.detail || Object.values(data)?.[0])) || "Something went wrong. Please try again.";
    throw new Error(Array.isArray(message) ? message[0] : message);
  }

  return data;
}

export const api = {
  signup: (payload) => apiFetch("/accounts/signup/", { method: "POST", body: payload, auth: false }),
  login: (payload) => apiFetch("/accounts/login/", { method: "POST", body: payload, auth: false }),
  logout: (refresh) => apiFetch("/accounts/logout/", { method: "POST", body: { refresh } }),
  me: () => apiFetch("/accounts/me/"),
  verifyEmail: (payload) => apiFetch("/accounts/verify-email/", { method: "POST", body: payload, auth: false }),
  resendVerification: () => apiFetch("/accounts/verify-email/resend/", { method: "POST" }),
  requestPasswordReset: (payload) =>
    apiFetch("/accounts/password-reset/", { method: "POST", body: payload, auth: false }),
  confirmPasswordReset: (payload) =>
    apiFetch("/accounts/password-reset/confirm/", { method: "POST", body: payload, auth: false }),
  plans: () => apiFetch("/premium/plans/", { auth: false }),
  mySubscription: () => apiFetch("/premium/me/"),
  startCheckout: (planCode) => apiFetch("/premium/checkout/", { method: "POST", body: { plan_code: planCode } }),
  // Core app — likes & subscriptions
  likeProfile: (toUserId) => apiFetch("/core/like/", { method: "POST", body: { to_user_id: toUserId } }),
  checkLike: (userId) => apiFetch(`/core/like/${userId}/`),
  likesReceived: () => apiFetch("/core/likes-received/"),
  subscribeToProfile: (creatorId) => apiFetch("/core/subscribe/", { method: "POST", body: { creator_id: creatorId } }),
  checkSubscription: (userId) => apiFetch(`/core/subscription/${userId}/`),
  mySubscriptions: () => apiFetch("/core/my-subscriptions/"),
  userChats: () => apiFetch("/core/chat/conversations/"),
  chatWithProfile: (profileId) => apiFetch(`/core/chat/${profileId}/`),
  sendChatMessage: (profileId, payload, multipart = false) =>
    apiFetch(`/core/chat/${profileId}/`, { method: "POST", body: payload, multipart }),
  createBooking: (payload) => apiFetch("/core/bookings/", { method: "POST", body: payload }),
  myBookings: () => apiFetch("/core/bookings/mine/"),
  // Admin API — backed by Django, not localStorage
  adminLogin: (email, password) =>
    apiFetch("/core/admin/login/", { method: "POST", body: { email, password }, auth: false }),
  adminStats: () => adminFetch("/core/admin/stats/"),
  adminUsers: () => adminFetch("/core/admin/users/"),
  adminDeleteUser: (userId) => adminFetch(`/core/admin/users/${userId}/`, { method: "DELETE" }),
  adminClearUsers: () => adminFetch("/core/admin/users/clear-all/", { method: "DELETE" }),
  adminLikes: () => adminFetch("/core/admin/likes/"),
  adminSubscriptions: () => adminFetch("/core/admin/subscriptions/"),
  adminChats: (orientation = "all") => adminFetch(`/core/admin/chats/?orientation=${orientation}`),
  adminChatDetail: (conversationId) => adminFetch(`/core/admin/chats/${conversationId}/`),
  adminChatReply: (conversationId, payload, multipart = false) =>
    adminFetch(`/core/admin/chats/${conversationId}/reply/`, { method: "POST", body: payload, multipart }),
  adminBookings: () => adminFetch("/core/admin/bookings/"),
  adminBookingStatus: (bookingId, status) =>
    adminFetch(`/core/admin/bookings/${bookingId}/status/`, { method: "POST", body: { status } }),
  adminCryptoPayments: () => adminFetch("/core/admin/crypto-payments/"),
  adminCryptoPaymentStatus: (paymentId, status) =>
    adminFetch(`/core/admin/crypto-payments/${paymentId}/status/`, { method: "POST", body: { status } }),
  // Paystack payments (subscriptions — card + bank transfer)
  getProfilePrice: (profileId) => apiFetch(`/core/profile-price/${profileId}/`),
  createPaystackPayment: (profileId, plan, country, currencySymbol) =>
    apiFetch("/core/paystack/create-payment/", {
      method: "POST",
      body: { profile_id: profileId, plan, country, currency_symbol: currencySymbol },
    }),
  createPaystackTransfer: (profileId, plan, country, currency, currencySymbol) =>
    apiFetch("/core/paystack/create-transfer/", {
      method: "POST",
      body: { profile_id: profileId, plan, country, currency, currency_symbol: currencySymbol },
    }),
  confirmPaystackPayment: (reference, profileId, plan, country, currencySymbol) =>
    apiFetch("/core/paystack/confirm-payment/", {
      method: "POST",
      body: { reference, profile_id: profileId, plan, country, currency_symbol: currencySymbol },
    }),
  adminProfilePrices: () => adminFetch("/core/admin/profile-prices/"),
  adminUpdateProfilePrice: (profileId, payload) =>
    adminFetch(`/core/admin/profile-prices/${profileId}/`, { method: "PUT", body: payload }),
  checkServiceAccess: (creatorId) => apiFetch(`/core/paystack/check-access/${creatorId}/`),
  createServicePayment: (serviceName, amountCents) =>
    apiFetch("/core/stripe/create-service-payment/", { method: "POST", body: { service_name: serviceName, amount_cents: amountCents } }),
  confirmServicePayment: (paymentIntentId) =>
    apiFetch("/core/stripe/confirm-service-payment/", { method: "POST", body: { payment_intent_id: paymentIntentId } }),
  // Crypto payments
  createCryptoPayment: (payload) => apiFetch("/core/crypto-payments/", { method: "POST", body: payload }),
  myCryptoPayments: () => apiFetch("/core/crypto-payments/mine/"),
  verifyCryptoPayment: (paymentId, txHash) =>
    apiFetch("/core/crypto-payments/verify/", { method: "POST", body: { payment_id: paymentId, tx_hash: txHash } }),
  // Customer support chat
  mySupportTickets: () => apiFetch("/core/support/tickets/"),
  createSupportTicket: (subject, content, whatsappPhone = "") =>
    apiFetch("/core/support/tickets/", { method: "POST", body: { subject, content, whatsapp_phone: whatsappPhone } }),
  getSupportTicket: (ticketId) => apiFetch(`/core/support/tickets/${ticketId}/`),
  sendSupportMessage: (ticketId, content) =>
    apiFetch(`/core/support/tickets/${ticketId}/`, { method: "POST", body: { content } }),
  // Admin support ticket management
  adminSupportTickets: () => adminFetch("/core/admin/support/"),
  adminSupportTicketDetail: (ticketId) => adminFetch(`/core/admin/support/${ticketId}/`),
  adminSupportReply: (ticketId, content) =>
    adminFetch(`/core/admin/support/${ticketId}/`, { method: "POST", body: { content } }),
  adminSupportResolve: (ticketId) =>
    adminFetch(`/core/admin/support/${ticketId}/resolve/`, { method: "POST" }),
};

/* ── Admin-specific fetch (uses admin token, not JWT) ──────── */
function adminFetch(path, { method = "GET", body, multipart = false } = {}) {
  const token = typeof window !== "undefined" ? window.sessionStorage.getItem("admin_token") : null;
  const headers = {};
  if (!multipart) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? (multipart ? body : JSON.stringify(body)) : undefined,
  }).then(async (res) => {
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const msg = (data && data.detail) || "Something went wrong.";
      throw new Error(msg);
    }
    return data;
  });
}