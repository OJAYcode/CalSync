// Test Socket.IO connection to backend
const { io } = require("socket.io-client");

const BACKEND = "https://calsync-backend-nmxe.onrender.com";
const MEETING_CODE = "FLKPCV193I";

console.log("Connecting to", BACKEND, "...");

const socket = io(BACKEND, {
  transports: ["polling", "websocket"],
  timeout: 30000,
  reconnection: false,
  forceNew: true,
});

// Log ALL events (catch-all)
socket.onAny((event, ...args) => {
  console.log(`[EVENT] "${event}":`, JSON.stringify(args, null, 2));
});

socket.on("connect", () => {
  console.log("[CONNECTED] Socket ID:", socket.id);
  console.log("[TRANSPORT]", socket.io.engine.transport.name);
  
  // Try joining meeting
  console.log("\n--- Emitting join-meeting ---");
  socket.emit("join-meeting", {
    meeting_code: MEETING_CODE,
    peer_id: "test-peer-123",
    user_id: "test-user",
    display_name: "Test User"
  });
  
  // Also try alternate event name
  setTimeout(() => {
    console.log("\n--- Emitting join_meeting (underscore) ---");
    socket.emit("join_meeting", {
      meeting_code: MEETING_CODE,
      peer_id: "test-peer-123",
      user_id: "test-user",
      display_name: "Test User"
    });
  }, 2000);
  
  // Also try just "join"
  setTimeout(() => {
    console.log("\n--- Emitting join ---");
    socket.emit("join", {
      meeting_code: MEETING_CODE,
      peer_id: "test-peer-123",
      user_id: "test-user",
      display_name: "Test User"
    });
  }, 4000);
  
  // Disconnect after 15s
  setTimeout(() => {
    console.log("\n--- Disconnecting ---");
    socket.disconnect();
    process.exit(0);
  }, 15000);
});

socket.on("connect_error", (err) => {
  console.error("[CONNECT ERROR]", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("[DISCONNECTED]", reason);
});

// Listen for specific events
const events = [
  "existing-participants", "existing_participants",
  "user-joined", "user_joined", 
  "participant-joined", "participant_joined",
  "user-left", "user_left",
  "participant-left", "participant_left",
  "meeting-joined", "meeting_joined",
  "room-joined", "room_joined",
  "error", "meeting-error", "meeting_error"
];

events.forEach(evt => {
  socket.on(evt, (data) => {
    console.log(`[SPECIFIC: ${evt}]`, JSON.stringify(data, null, 2));
  });
});
