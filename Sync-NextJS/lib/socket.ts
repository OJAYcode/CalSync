import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://calsync-backend-nmxe.onrender.com";

// ────────────────────────────────────────────────────────────────────
// Single socket instance — created once, reused everywhere.
// autoConnect: false so we can attach listeners before connecting.
// The meeting page calls socket.connect() after setting up handlers.
// ────────────────────────────────────────────────────────────────────
let socket: Socket | null = null;

/** Create a fresh Socket.IO instance with current auth token. */
function createSocket(): Socket {
  const token = localStorage.getItem("session_token");

  const s = io(SOCKET_URL, {
    autoConnect: false, // we connect manually after attaching listeners
    path: "/socket.io/", // explicit default path
    transports: ["polling", "websocket"], // polling first for reliable handshake, then upgrade
    upgrade: true,
    rememberUpgrade: false,
    timeout: 30000,
    reconnection: true,
    reconnectionAttempts: Infinity, // never give up reconnecting
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.5,
    forceNew: false,
    withCredentials: false,
    auth: token ? { token } : {},
  });

  // ── Global logging (attached once) ──
  s.onAny((event, ...args) => {
    console.log(`[Socket ↓] ${event}`, JSON.stringify(args).slice(0, 300));
  });

  s.onAnyOutgoing((event, ...args) => {
    console.log(`[Socket ↑] ${event}`, JSON.stringify(args).slice(0, 300));
  });

  s.on("connect", () => {
    console.log(
      "[Socket] ✅ Connected | id:",
      s.id,
      "| transport:",
      s.io.engine?.transport?.name,
    );
  });

  s.on("connect_error", (err) => {
    console.error("[Socket] ❌ Connect error:", err.message);
  });

  s.on("disconnect", (reason) => {
    console.warn("[Socket] ⚠️ Disconnected:", reason);
    // "io server disconnect" means the server forcefully closed the connection.
    // In that case Socket.IO will NOT auto-reconnect, so we do it manually.
    if (reason === "io server disconnect") {
      console.log("[Socket] Server forced disconnect — reconnecting...");
      const token = localStorage.getItem("session_token");
      s.auth = token ? { token } : {};
      s.connect();
    }
    // "transport close" / "ping timeout" — Socket.IO auto-reconnects.
  });

  return s;
}

/** Get (or create) the shared Socket.IO instance. */
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    // SSR guard — return a no-op stub that will never be used
    return null as unknown as Socket;
  }

  if (!socket) {
    socket = createSocket();
  }

  return socket;
}

/**
 * Ensure the socket is connected (idempotent).
 * Refreshes the auth token before connecting in case user re-logged in.
 * If the old socket instance is in a broken state, recreates it.
 */
let hasConnectedOnce = false;

export function ensureConnected(): Socket {
  if (typeof window === "undefined") {
    return null as unknown as Socket;
  }

  let s = getSocket();

  // Only check for staleness if we previously connected at least once.
  // A brand-new socket (autoConnect:false) has active=false before the
  // first .connect() call, so we must not treat that as stale.
  if (hasConnectedOnce && !s.connected && !s.active) {
    console.log("[Socket] Instance stale — recreating...");
    destroySocket();
    hasConnectedOnce = false;
    socket = createSocket();
    s = socket;
  }

  if (!s.connected) {
    const token = localStorage.getItem("session_token");
    s.auth = token ? { token } : {};

    // Track that we've initiated a connection at least once
    if (!hasConnectedOnce) {
      s.once("connect", () => {
        hasConnectedOnce = true;
      });
    }

    s.connect();
  }
  return s;
}

/**
 * Clean disconnect — removes all listeners and destroys the instance.
 * Call this only when the user is truly leaving the meeting / logging out.
 */
export function destroySocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.offAny();
    socket.offAnyOutgoing();
    if (socket.connected) {
      socket.disconnect();
    }
    socket = null;
  }
  hasConnectedOnce = false;
}

// ────────────────────────────────────────────────────────────────────
// Meeting-specific event names — must match backend exactly
// ────────────────────────────────────────────────────────────────────
export const MeetingEvents = {
  JOIN: "join-meeting",
  LEAVE: "leave-meeting",
  EXISTING_PARTICIPANTS: "existing-participants",
  USER_JOINED: "user-joined",
  USER_LEFT: "user-left",
  OFFER: "webrtc-offer",
  ANSWER: "webrtc-answer",
  ICE_CANDIDATE: "webrtc-ice-candidate",
  CHAT_MESSAGE: "chat-message",
  TOGGLE_AUDIO: "toggle-audio",
  TOGGLE_VIDEO: "toggle-video",
  SCREEN_SHARE_START: "screen-share-start",
  SCREEN_SHARE_STOP: "screen-share-stop",
  REACTION: "reaction",
  POLL_CREATE: "poll-create",
  POLL_VOTE: "poll-vote",
  MEETING_ENDED: "meeting-ended",
} as const;
