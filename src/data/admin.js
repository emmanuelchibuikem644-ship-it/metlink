/**
 * Admin configuration — this is the master control centre for the site.
 *
 * ADMIN CREDENTIALS (hardcoded):
 *   ID:       "admin"
 *   Password: "MeetlinkAdmin@2026"
 *
 * The admin can log in from /admin-login and access /admin to manage
 * every user and profile on the platform.
 */

export const ADMIN_CREDENTIALS = {
  id: "admin",
  password: "MeetlinkAdmin@2026",
  display_name: "Oga Admin",
  is_admin: true,
};

/* ── localStorage keys ─────────────────────────────────────── */

const REGISTERED_USERS_KEY = "Meetlink_registered_users";
const ADMIN_SESSION_KEY = "Meetlink_admin_session";

/* ── Registered users CRUD ─────────────────────────────────── */

/**
 * Returns the list of every user who has signed up via the Meetlink app.
 * Each user object looks like:
 *   { id, display_name, email, date_of_birth, gender, orientation,
 *     registered_at, last_login_at, profile_pic, background_pic, status }
 */
export function getRegisteredUsers() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveRegisteredUsers(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

/**
 * Register a new user when they sign up. Idempotent – won't duplicate
 * the same email twice.
 */
export function registerUser(user) {
  const users = getRegisteredUsers();
  const exists = users.find((u) => u.email === user.email);
  if (exists) {
    // Update last login and return existing
    exists.last_login_at = new Date().toISOString();
    exists.status = "active";
    saveRegisteredUsers(users);
    return exists;
  }
  const entry = {
    id: user.id || Date.now(),
    display_name: user.display_name || "Unknown",
    email: user.email || "",
    date_of_birth: user.date_of_birth || "",
    gender: user.gender || "unspecified",
    orientation: user.orientation || "straight",
    registered_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
    profile_pic: user.profile_pic || "",
    background_pic: user.background_pic || "",
    status: "active",
  };
  users.push(entry);
  saveRegisteredUsers(users);
  return entry;
}

/**
 * Record a user's last login time (called after successful login).
 */
export function recordUserLogin(email) {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.email === email);
  if (user) {
    user.last_login_at = new Date().toISOString();
    saveRegisteredUsers(users);
  }
}

/**
 * Update a registered user's fields.
 */
export function updateRegisteredUser(id, updates) {
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveRegisteredUsers(users);
  return users[idx];
}

/**
 * Delete a registered user by id.
 */
export function deleteRegisteredUser(id) {
  const users = getRegisteredUsers().filter((u) => u.id !== id);
  saveRegisteredUsers(users);
}

/**
 * Delete ALL registered users.
 */
export function clearAllUsers() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REGISTERED_USERS_KEY);
}

/* ── Admin session ─────────────────────────────────────────── */

export function getAdminSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAdminSession(session) {
  if (typeof window === "undefined") return;
  if (session) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function isAdminLoggedIn() {
  const session = getAdminSession();
  return !!(session && session.is_admin);
}

/* ── Statistics ────────────────────────────────────────────── */

export function getAdminStats() {
  const users = getRegisteredUsers();
  const now = new Date();

  const totalUsers = users.length;
  const activeToday = users.filter((u) => {
    if (!u.last_login_at) return false;
    const last = new Date(u.last_login_at);
    return last.toDateString() === now.toDateString();
  }).length;

  const straightCount = users.filter((u) => u.orientation === "straight").length;
  const gayCount = users.filter((u) => u.orientation === "gay").length;

  const genderCounts = {};
  users.forEach((u) => {
    const g = u.gender || "unspecified";
    genderCounts[g] = (genderCounts[g] || 0) + 1;
  });

  return {
    totalUsers,
    activeToday,
    straightCount,
    gayCount,
    genderCounts,
  };
}