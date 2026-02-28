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

/** Get (or create) the shared Socket.IO instance. */
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    // SSR guard — return a no-op stub that will never be used
    return null as unknown as Socket;
  }

  if (!socket) {
    const token = localStorage.getItem("session_token");

    socket = io(SOCKET_URL, {
      autoConnect: false, // we connect manually after attaching listeners
      path: "/socket.io/", // explicit default path
      transports: ["polling", "websocket"],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      forceNew: false, // reuse the Manager so SIDs stay consistent
      withCredentials: false,
      auth: token ? { token } : {},
    });

    // ── Global logging (attached once) ──
    socket.onAny((event, ...args) => {
      console.log(`[Socket ↓] ${event}`, JSON.stringify(args).slice(0, 300));
    });

    socket.onAnyOutgoing((event, ...args) => {
      console.log(`[Socket ↑] ${event}`, JSON.stringify(args).slice(0, 300));
    });

    socket.on("connect", () => {
      console.log(
        "[Socket] ✅ Connected | id:",
        socket!.id,
        "| transport:",
        socket!.io.engine?.transport?.name,
      );
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] ❌ Connect error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[Socket] ⚠️ Disconnected:", reason);
    });
  }

  return socket;
}

/**
 * Ensure the socket is connected (idempotent).
 * Refreshes the auth token before connecting in case user re-logged in.
 */
export function ensureConnected(): Socket {
  const s = getSocket();
  if (!s.connected) {
    const token = localStorage.getItem("session_token");
    s.auth = token ? { token } : {};
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
