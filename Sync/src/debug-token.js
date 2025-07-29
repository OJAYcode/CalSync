// JWT Token Debugging Script
// Run this in your browser console to test your JWT token

console.log("🔍 JWT Token Debugging Script");
console.log("================================");

// Get the token from localStorage
const token = localStorage.getItem('session_token');
console.log("Token exists:", !!token);

if (token) {
    console.log("Token length:", token.length);
    console.log("Token preview:", token.substring(0, 50) + "...");
    
    // Test the token with our backend
    fetch('https://calsync-production.up.railway.app/test-token', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("Token validation result:", data);
        
        if (data.valid) {
            console.log("✅ Token is valid!");
            console.log("User ID:", data.user_id);
            console.log("Expires:", new Date(data.expires * 1000));
            console.log("Issued at:", new Date(data.issued_at * 1000));
        } else {
            console.log("❌ Token is invalid!");
            console.log("Error:", data.error);
        }
    })
    .catch(error => {
        console.log("❌ Error testing token:", error);
    });
} else {
    console.log("❌ No token found in localStorage");
    console.log("Available localStorage keys:", Object.keys(localStorage));
}

// Also test the current user
const user = localStorage.getItem('user');
if (user) {
    console.log("User data:", JSON.parse(user));
} else {
    console.log("❌ No user data found");
} 