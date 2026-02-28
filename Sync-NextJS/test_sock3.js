// Minimal socket.io test
const { io } = require("socket.io-client");

const socket = io("https://calsync-backend-nmxe.onrender.com", {
  transports: ["polling"],
  timeout: 60000,
  forceNew: true,
});

socket.onAny((evt, ...args) => {
  console.log("EVENT:", evt, JSON.stringify(args).substring(0, 300));
});

socket.on("connect", () => {
  console.log("CONNECTED id=" + socket.id);
  socket.emit("join-meeting", {
    meeting_code: "FLKPCV193I",
    peer_id: "test-peer-abc",
    user_id: "test",
    display_name: "Tester",
  });
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 8000);
});

socket.on("connect_error", (e) => {
  console.log("CONNECT_ERROR:", e.message);
});

setTimeout(() => {
  console.log("GLOBAL TIMEOUT");
  process.exit(1);
}, 65000);
