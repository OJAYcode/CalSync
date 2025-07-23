// Debug script for testing token validation
// Open browser console and run this on your React app page

console.log("=== TOKEN DEBUG ===");
console.log("Access Token:", localStorage.getItem("access_token"));
console.log("Refresh Token:", localStorage.getItem("refresh_token"));
console.log("User:", localStorage.getItem("user"));

// Test token format
const token = localStorage.getItem("access_token");
if (token) {
  try {
    const parts = token.split(".");
    console.log("Token parts:", parts.length);
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log("Token payload:", payload);
      console.log("Token expires:", new Date(payload.exp * 1000));
      console.log("Token expired?", Date.now() > payload.exp * 1000);
    }
  } catch (e) {
    console.error("Error parsing token:", e);
  }
}

// Test API call manually
fetch("http://localhost:5000/api/events/test", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  },
})
  .then((r) => r.json())
  .then((data) => console.log("API Test Result:", data))
  .catch((e) => console.error("API Test Error:", e));
