import React, { useEffect, useState } from "react";
import BackButton from "./BackButton";

// API URL configuration - using Railway backend
const API_URL = "https://calsync-production.up.railway.app";

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
                  <span className="text-xs text-gray-500">{new Date(notif.notify_at).toLocaleString()} (Event: {new Date(notif.start_datetime).toLocaleString()})</span>
                  <div className="text-xs text-gray-400">{notif.body}</div>
                  <button onClick={() => markAsRead(notif.id)} className="self-end text-xs text-blue-600 hover:underline mt-1">Mark as read</button>
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