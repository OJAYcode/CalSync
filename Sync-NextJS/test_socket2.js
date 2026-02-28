// Test Socket.IO connection — polling only, max timeout
const { io } = require("socket.io-client");

const BACKEND = "https://calsync-backend-nmxe.onrender.com";
const MEETING_CODE = "FLKPCV193I";

console.log("Testing health endpoint first...");

const http = require("https");
http
  .get(BACKEND + "/health", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("[Health]", res.statusCode, data.substring(0, 200));
      connectSocket();
    });
  })
  .on("error", (err) => {
    console.error("[Health Error]", err.message);
    connectSocket();
  });

function connectSocket() {
  console.log("\nConnecting Socket.IO to", BACKEND, "...");
  console.log("Using polling only, timeout 60s");

  const socket = io(BACKEND, {
    transports: ["polling"],
    timeout: 60000,
    reconnection: false,
    forceNew: true,
    path: "/socket.io/",
  });

  // Log ALL events
  socket.onAny((event, ...args) => {
    console.log(`[EVENT] "${event}":`, JSON.stringify(args).substring(0, 500));
  });

  socket.on("connect", () => {
    console.log("[CONNECTED] Socket ID:", socket.id);
    console.log("[TRANSPORT]", socket.io.engine.transport.name);

    // Join meeting
    socket.emit("join-meeting", {
      meeting_code: MEETING_CODE,
      peer_id: "test-peer-123",
      user_id: "test-user",
      display_name: "Test User",
    });
    console.log("[SENT] join-meeting");

    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 10000);
  });

  socket.on("connect_error", (err) => {
    console.error("[CONNECT ERROR]", err.message);
    console.error("[CONNECT ERROR details]", err);
  });

  socket.on("disconnect", (reason) => {
    console.log("[DISCONNECTED]", reason);
  });

  // Timeout safety
  setTimeout(() => {
    console.log("TIMEOUT - giving up after 65s");
    socket.disconnect();
    process.exit(1);
  }, 65000);
}
