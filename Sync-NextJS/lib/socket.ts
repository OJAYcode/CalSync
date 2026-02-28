import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://calsync-backend-nmxe.onrender.com";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("session_token")
        : null;

    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
      // CRITICAL: polling first, then upgrade to websocket (required for Render)
      transports: ["polling", "websocket"],
      // Increased timeout for Render cold starts
      timeout: 30000,
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // CRITICAL: forceNew to avoid stale manager/SID reuse
      forceNew: true,
      upgrade: true,
      rememberUpgrade: false,
    });

    // Base logging — attached once per instance
    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket!.id);
      console.log("[Socket] Transport:", socket!.io.engine?.transport?.name);
    });
    socket.on("connect_error", (err) =>
      console.error("[Socket] Connect error:", err.message),
    );
    socket.on("disconnect", (reason) =>
      console.log("[Socket] Disconnected:", reason),
    );
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected && !s.active) {
    // Update auth token before connecting
    const token = localStorage.getItem("session_token");
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    if (socket.connected) {
      socket.disconnect();
    }
    socket = null;
  }
}

// Meeting-specific socket events — must match backend event names exactly
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
