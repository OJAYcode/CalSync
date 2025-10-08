import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Calendar from "./components/Calendar";
import CreateEvent from "./components/CreateEvent";
import AdminDashboard from "./components/AdminDashboard";
// Add placeholder imports
import Profile from "./components/Profile";
import ChangePassword from "./components/ChangePassword";
import Notifications from "./components/Notifications";
import DepartmentFeed from "./components/DepartmentFeed";
import { Menu, X } from "lucide-react";
import "./App.css";
import { messaging, getToken, onMessage } from "./firebase";

const API_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    if (host === 'localhost' || isIp) return `http://${host}:5000`;
  }
  return 'https://calsync-production.up.railway.app';
})();

// Remove DarkModeContext, useDarkMode, and DarkModeToggle

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if user is logged in when app starts
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('session_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Firebase Cloud Messaging setup
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          getToken(messaging, { vapidKey: "BLhSO04C1IcQfMNI01xlPPaPQOlSDGiZ-UgEQsqlF4sqwkXBk40ijJxbEXvz7Dj3EkmLQZ4PaPILitB7RxAsbeI" }).then((currentToken) => {
            if (currentToken) {
              // Send this token to your backend to send notifications later
              console.log('FCM Token:', currentToken);
              
              // Send token to backend if user is logged in
              if (user) {
                const token = localStorage.getItem('session_token');
                fetch(`${API_URL}/users/fcm-token`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ fcm_token: currentToken })
                }).then(response => {
                  if (response.ok) {
                    console.log('✅ FCM token sent to backend successfully');
                  } else {
                    console.log('❌ Failed to send FCM token to backend');
                  }
                }).catch(err => {
                  console.log('❌ Error sending FCM token to backend:', err);
                });
              }
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          }).catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
          });
        }
      });

      onMessage(messaging, (payload) => {
        // Handle foreground messages
        if (payload.notification) {
          alert(payload.notification.title + ": " + payload.notification.body);
        }
      });
    }
  }, [user]); // Add user as dependency to re-run when user logs in

  // Simple logout function
  const logout = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Calendar Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50 text-gray-900">
        {/* Remove the global navigation bar entirely */}
        <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <Login setUser={setUser} />} 
            />
            <Route 
              path="/signup" 
              element={user ? <Navigate to="/dashboard" replace /> : <Signup setUser={setUser} />} 
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={user ? <Dashboard logout={logout} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/calendar"
              element={user ? <Calendar /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/events/create"
              element={user ? <CreateEvent /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin"
              element={user ? <AdminDashboard /> : <Navigate to="/login" replace />}
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/department-feed" element={<DepartmentFeed />} />

            {/* Default Route */}
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
            />
          </Routes>
      </div>
    </Router>
  );
}

export default App;
