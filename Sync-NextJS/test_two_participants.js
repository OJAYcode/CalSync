// Test Socket.IO with auth and two participants
const { io } = require("socket.io-client");
const https = require("https");

const BACKEND = "https://calsync-backend-nmxe.onrender.com";
const MEETING_CODE = "FLKPCV193I";

// First, login to get a token
function login(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = https.request(
      BACKEND + "/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("Logging in...");
  const loginRes = await login("superadmin@calsync.com", "SuperAdmin@123");
  console.log("Login:", loginRes.message || loginRes.error || "unknown");
  const token =
    loginRes.token || loginRes.session_token || loginRes.access_token;
  console.log("Token:", token ? token.substring(0, 20) + "..." : "NO TOKEN");

  if (!token) {
    console.log("Full login response:", JSON.stringify(loginRes));
    process.exit(1);
  }

  // Connect participant 1
  console.log("\n--- Participant 1 connecting ---");
  const s1 = io(BACKEND, {
    transports: ["polling", "websocket"],
    timeout: 30000,
    forceNew: true,
    auth: { token },
  });

  s1.onAny((evt, ...args) => {
    console.log(`[P1 EVENT] "${evt}":`, JSON.stringify(args).substring(0, 500));
  });

  s1.on("connect", () => {
    console.log("[P1] Connected:", s1.id);
    s1.emit("join-meeting", {
      meeting_code: MEETING_CODE,
      peer_id: "peer-p1-111",
      user_id: "user-1",
      display_name: "Participant One",
    });
    console.log("[P1] Sent join-meeting");

    // After P1 joins, connect P2 after 3 seconds
    setTimeout(() => {
      console.log("\n--- Participant 2 connecting ---");
      const s2 = io(BACKEND, {
        transports: ["polling", "websocket"],
        timeout: 30000,
        forceNew: true,
        auth: { token },
      });

      s2.onAny((evt, ...args) => {
        console.log(
          `[P2 EVENT] "${evt}":`,
          JSON.stringify(args).substring(0, 500),
        );
      });

      s2.on("connect", () => {
        console.log("[P2] Connected:", s2.id);
        s2.emit("join-meeting", {
          meeting_code: MEETING_CODE,
          peer_id: "peer-p2-222",
          user_id: "user-2",
          display_name: "Participant Two",
        });
        console.log("[P2] Sent join-meeting");
      });

      s2.on("connect_error", (e) =>
        console.log("[P2] Connect error:", e.message),
      );

      // Cleanup after 10s
      setTimeout(() => {
        console.log("\n--- Cleanup ---");
        s1.disconnect();
        s2.disconnect();
        process.exit(0);
      }, 10000);
    }, 3000);
  });

  s1.on("connect_error", (e) => {
    console.log("[P1] Connect error:", e.message);
  });

  // Global timeout
  setTimeout(() => {
    console.log("TIMEOUT");
    process.exit(1);
  }, 60000);
}

main().catch(console.error);
