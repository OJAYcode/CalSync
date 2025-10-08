import React, { useEffect, useState } from "react";
import BackButton from "./BackButton";

// Dynamic API base URL
const API_URL = (() => {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    if (host === 'localhost' || isIp) return `http://${host}:5000`;
  }
  return 'https://calsync-production.up.railway.app';
})();

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchNotifications = () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("session_token");
    fetch(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
        else setError(data.error || "Failed to load notifications");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load notifications"); setLoading(false); });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("session_token");
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSuccess("Notification marked as read");
      setNotifications(notifications.filter(n => n.id !== id));
    } else {
      setError("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    for (const notif of notifications) {
      await markAsRead(notif.id);
    }
    setSuccess("All notifications marked as read");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-2 sm:px-0">
      <div className="w-full max-w-lg bg-white rounded shadow p-4 sm:p-8">
        <BackButton />
        <h2 className="text-2xl font-bold mb-4 text-blue-700">All Notifications</h2>
        
        {/* Test Notification Button */}
                        <div className="mb-4 flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("session_token");
                        const res = await fetch(`${API_URL}/notifications/test`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                          setSuccess("Test notification created! Refresh to see it.");
                          setTimeout(() => fetchNotifications(), 1000);
                        } else {
                          setError("Failed to create test notification");
                        }
                      } catch (err) {
                        setError("Error creating test notification");
                      }
                    }}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 font-medium shadow"
                  >
                    Create Test Notification
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("session_token");
                        const res = await fetch(`${API_URL}/notifications/test-push`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                          setSuccess("Test push notification sent! Check your device.");
                        } else {
                          const errorData = await res.json();
                          setError(`Failed to send push notification: ${errorData.error}`);
                        }
                      } catch (err) {
                        setError("Error sending push notification");
                      }
                    }}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium shadow"
                  >
                    Test Push Notification
                  </button>
                </div>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
        {success && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded p-2 text-center">{success}</div>}
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-gray-500">No notifications.</div>
        ) : (
          <>
            <button onClick={markAllAsRead} className="mb-4 bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium shadow w-full sm:w-auto">Mark All as Read</button>
            <ul className="divide-y bg-white rounded shadow">
              {notifications.map(notif => (
                <li key={notif.id} className="px-2 sm:px-4 py-3 flex flex-col gap-1">
                  <span className="font-medium text-gray-900">{notif.title}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(notif.created_at).toLocaleString()}
                    {notif.event_title && ` - Event: ${notif.event_title}`}
                  </span>
                  <div className="text-xs text-gray-400">{notif.message}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      notif.is_read ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {notif.is_read ? 'Read' : 'Unread'}
                    </span>
                    {!notif.is_read && (
                      <button 
                        onClick={() => markAsRead(notif.id)} 
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications; 