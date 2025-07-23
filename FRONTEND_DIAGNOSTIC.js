// FRONTEND DIAGNOSTIC - Run this in browser console (F12) on your React app
console.log("🔍 FRONTEND EVENT CREATION DIAGNOSTIC");
console.log("=====================================");

// Test 1: Check authentication state
console.log("\n1️⃣ Authentication Check:");
const accessToken = localStorage.getItem("access_token");
const refreshToken = localStorage.getItem("refresh_token");
const userData = localStorage.getItem("user");

console.log("Access Token:", accessToken ? "EXISTS ✅" : "MISSING ❌");
console.log("Refresh Token:", refreshToken ? "EXISTS ✅" : "MISSING ❌");
console.log("User Data:", userData ? "EXISTS ✅" : "MISSING ❌");

if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log("User Email:", user.email);
    console.log("User Role:", user.role);
    console.log("Can Create Events:", user.can_create_events || user.is_admin);
  } catch (e) {
    console.log("❌ Error parsing user data:", e);
  }
}

// Test 2: Test API connection
console.log("\n2️⃣ API Connection Test:");
fetch("http://localhost:5000/api/events/test")
  .then((response) => {
    console.log("API Test Response Status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("API Test Response:", data);
  })
  .catch((error) => {
    console.log("❌ API Test Failed:", error);
  });

// Test 3: Test authenticated API call
console.log("\n3️⃣ Authenticated API Test:");
if (accessToken) {
  fetch("http://localhost:5000/api/events", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log("Auth API Test Status:", response.status);
      if (response.status === 401) {
        console.log("❌ Token is invalid or expired");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Auth API Test Response:", data);
    })
    .catch((error) => {
      console.log("❌ Auth API Test Failed:", error);
    });
} else {
  console.log("❌ Cannot test authenticated API - no access token");
}

// Test 4: Test event creation
console.log("\n4️⃣ Event Creation Test:");
if (accessToken) {
  const testEventData = {
    title: "Browser Console Test Event",
    description: "Testing from browser console",
    start_datetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    end_datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: "Console Test Location",
    is_all_day: false,
    is_organization_wide: true,
    notification_minutes_before: [15, 60],
  };

  console.log("Sending event data:", testEventData);

  fetch("http://localhost:5000/api/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testEventData),
  })
    .then((response) => {
      console.log("Event Creation Status:", response.status);
      console.log("Event Creation Headers:", [...response.headers.entries()]);
      return response.text().then((text) => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      });
    })
    .then((data) => {
      console.log("Event Creation Response:", data);
      if (typeof data === "object" && data.id) {
        console.log("🎉 EVENT CREATED SUCCESSFULLY!");
        console.log("Event ID:", data.id);
        console.log("Event Title:", data.title);
      } else {
        console.log("❌ Event creation response doesn't look right");
      }
    })
    .catch((error) => {
      console.log("❌ Event Creation Failed:", error);
    });
} else {
  console.log("❌ Cannot test event creation - no access token");
}

console.log("\n📋 INSTRUCTIONS:");
console.log("1. Check the results above");
console.log("2. If API tests fail, backend might not be running");
console.log("3. If auth fails, try logging out and back in");
console.log("4. If event creation fails, check the error details");
console.log("5. Share any error messages you see");
