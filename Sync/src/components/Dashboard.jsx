import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Bell,
  Settings,
  LogOut,
  Crown,
  Plus,
  Shield,
  Lock,
  Menu,
  X,
} from "lucide-react";
import BackButton from "./BackButton";

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Dashboard = ({ logout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    todayEvents: 0,
    weekEvents: 0,
    notifications: 0,
    loading: true,
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [events, setEvents] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [feedForm, setFeedForm] = useState({ title: "", content: "", department: "" });
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [feedSuccess, setFeedSuccess] = useState("");
  const [eventError, setEventError] = useState("");

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/signin');
    }
  }, [navigate]);

  // Logout function
  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      navigate('/signin');
    }
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("session_token");
        const response = await fetch(`${API_URL}/events/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const statsData = await response.json();
          setStats({
            todayEvents: statsData.today_events || 0,
            weekEvents: statsData.week_events || 0,
            notifications: 0, // Will be updated when notifications API is implemented
            loading: false,
          });
        } else {
          // Fallback to events endpoint if stats endpoint not available
          const eventsResponse = await fetch(
            `${API_URL}/events`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            const events = eventsData.events || eventsData; // Handle both response formats
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            // Count today's events
            const todayEvents = events.filter((event) => {
              const eventDate = new Date(event.start_datetime);
              return eventDate.toDateString() === today.toDateString();
            }).length;

            // Count this week's events
            const weekEvents = events.filter((event) => {
              const eventDate = new Date(event.start_datetime);
              return eventDate >= startOfWeek && eventDate <= endOfWeek;
            }).length;

            setStats({
              todayEvents,
              weekEvents,
              notifications: 0,
              loading: false,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("session_token");
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setNotifications(await res.json());
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch events for admin dashboard
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("session_token");
      const response = await fetch(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setEvents(await response.json());
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (user?.role === "admin") fetchFeeds();
  }, [user]);

  const fetchFeeds = async () => {
    setFeedLoading(true);
    setFeedError("");
    try {
      const res = await fetch(`${API_URL}/department-feeds`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("session_token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setFeeds(data);
      else setFeedError(data.error || "Failed to load feeds");
    } catch {
      setFeedError("Failed to load feeds");
    }
    setFeedLoading(false);
  };

  const handleFeedFormChange = e => {
    setFeedForm({ ...feedForm, [e.target.name]: e.target.value });
  };

  const handleFeedSubmit = async e => {
    e.preventDefault();
    setFeedError("");
    setFeedSuccess("");
    if (!feedForm.title || !feedForm.content || !feedForm.department) {
      setFeedError("All fields are required");
      return;
    }
    setFeedLoading(true);
    try {
      const res = await fetch(`${API_URL}/department-feeds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
        body: JSON.stringify(feedForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedSuccess("Feed created successfully!");
        setFeedForm({ title: "", content: "", department: "" });
        fetchFeeds();
      } else {
        setFeedError(data.error || "Failed to create feed");
      }
    } catch {
      setFeedError("Failed to create feed");
    }
    setFeedLoading(false);
  };

  const handleDeleteFeed = async (id) => {
    if (!window.confirm("Delete this feed?")) return;
    setFeedLoading(true);
    setFeedError("");
    setFeedSuccess("");
    try {
      const res = await fetch(`${API_URL}/department-feeds/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("session_token")}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedSuccess("Feed deleted");
        fetchFeeds();
      } else {
        setFeedError(data.error || "Failed to delete feed");
      }
    } catch {
      setFeedError("Failed to delete feed");
    }
    setFeedLoading(false);
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem("session_token");
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDeleteEvent = async (id) => {
    setEventError("");
    if (!window.confirm("Delete this event?")) return;
    try {
      const token = localStorage.getItem("session_token");
      const res = await fetch(`${API_URL}/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchEvents();
        // Also refresh stats
        const statsRes = await fetch(`${API_URL}/events/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats((prev) => ({ ...prev, todayEvents: statsData.today_events, weekEvents: statsData.week_events }));
        }
      } else {
        setEventError(data.error || "Failed to delete event");
      }
    } catch (err) {
      setEventError("Failed to delete event");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-row justify-between items-center py-4 sm:py-6 gap-2 sm:gap-0">
            <div className="flex flex-row items-center gap-4">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar Sync</h1>
            </div>
            {/* Desktop navigation bar */}
            <nav className="hidden sm:flex flex-row gap-4 items-center">
              <button onClick={() => navigate('/dashboard')} className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded transition">Dashboard</button>
              <button onClick={() => navigate('/calendar')} className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded transition">Calendar</button>
              <button onClick={() => navigate('/profile')} className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded transition">Profile</button>
              <button onClick={() => navigate('/change-password')} className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded transition">Change Password</button>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium px-3 py-2 rounded transition">Logout</button>
            </nav>
            {/* Hamburger for mobile, far right */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-2 rounded hover:bg-gray-100 focus:outline-none"
                aria-label="Open menu"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {/* Mobile menu dropdown */}
          {menuOpen && (
            <div className="sm:hidden mt-2 bg-white rounded shadow p-4 flex flex-col gap-3 animate-fade-in">
              <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 font-medium shadow flex items-center gap-2">
                <Users className="h-4 w-4" /> Profile
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/change-password'); }} className="bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 font-medium shadow flex items-center gap-2">
                <Lock className="h-4 w-4" /> Change Password
              </button>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="text-red-600 hover:text-red-800 font-medium px-3 py-2 rounded shadow text-left flex items-center gap-2">Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 px-2 sm:px-6 lg:px-8 w-full">
        <div className="mb-4"><BackButton /></div>
        {/* Admin Dashboard for Admins */}
        {user?.role === "admin" ? (
          <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-700 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-500" /> Admin Dashboard
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link to="/events/create" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold shadow w-full sm:w-auto text-center">
                  + Create Event
                </Link>
                <Link to="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold shadow w-full sm:w-auto text-center">
                  Manage Users & Departments
                </Link>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">System Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow border">
                  <div className="text-gray-500 text-sm">Today's Events</div>
                  <div className="text-2xl font-bold">{stats.todayEvents}</div>
                </div>
                <div className="bg-white p-4 rounded shadow border">
                  <div className="text-gray-500 text-sm">This Week's Events</div>
                  <div className="text-2xl font-bold">{stats.weekEvents}</div>
                </div>
                <div className="bg-white p-4 rounded shadow border">
                  <div className="text-gray-500 text-sm">Notifications</div>
                  <div className="text-2xl font-bold">{stats.notifications}</div>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
              {eventError && <div className="mb-2 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{eventError}</div>}
              {events.length === 0 ? (
                <div className="text-gray-500">No events scheduled.</div>
              ) : (
                <ul className="divide-y bg-white rounded shadow">
                  {events.map(event => (
                    <li key={event.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <span className="font-medium text-blue-700">{event.title}</span>
                        <span className="ml-2 text-xs text-gray-500">{new Date(event.start_datetime).toLocaleString()} - {new Date(event.end_datetime).toLocaleString()}</span>
                        <div className="text-xs text-gray-500">{event.is_organization_wide ? "Organization-wide" : `Departments: ${event.departments?.join(", ") || "-"}`}</div>
                      </div>
                      <div className="mt-2 md:mt-0 text-xs text-gray-400 flex items-center gap-2">
                        Created by: {event.creator_name || "-"}
                        <button onClick={() => handleDeleteEvent(event.id)} className="text-red-600 hover:underline ml-4">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white rounded shadow p-4 w-full overflow-x-auto">
              <div className="text-gray-500 mb-2">All department feeds/announcements:</div>
              {feedLoading ? <div className="text-gray-400">Loading...</div> : feeds.length === 0 ? <div className="text-gray-400">No feeds found.</div> : (
                <ul className="divide-y">
                  {feeds.map(feed => (
                    <li key={feed.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-2">
                      <div>
                        <span className="font-semibold text-blue-700">{feed.title}</span>
                        <span className="ml-2 text-xs text-gray-500">{feed.department}</span>
                        <div className="text-xs text-gray-500">{feed.content}</div>
                        <div className="text-xs text-gray-400">Created: {new Date(feed.created_at).toLocaleString()}</div>
                      </div>
                      <button onClick={() => handleDeleteFeed(feed.id)} className="text-red-600 hover:underline">Delete</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          // Advanced Employee Dashboard
          <div>
            {/* Personalized Welcome */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-blue-200 rounded-full flex items-center justify-center text-3xl font-bold text-blue-700 border-2 border-blue-400">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Welcome, {user?.first_name}!</h2>
                  <div className="text-gray-500 text-sm">Department: <span className="font-semibold text-blue-600">{user?.department || "-"}</span></div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                <button onClick={() => navigate('/profile')} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium shadow flex items-center gap-1 w-full sm:w-auto justify-center">
                  <Users className="h-4 w-4" /> Edit Profile
                </button>
                <button onClick={() => navigate('/change-password')} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium shadow flex items-center gap-1 w-full sm:w-auto justify-center">
                  <Lock className="h-4 w-4" /> Change Password
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow border flex flex-col items-center">
                <Calendar className="h-6 w-6 text-blue-500 mb-1" />
                <div className="text-gray-500 text-sm">Upcoming Events</div>
                <div className="text-2xl font-bold">{events.length}</div>
              </div>
              <div className="bg-white p-4 rounded shadow border flex flex-col items-center">
                <Bell className="h-6 w-6 text-yellow-500 mb-1" />
                <div className="text-gray-500 text-sm">Unread Notifications</div>
                <div className="text-2xl font-bold">{notifications.length}</div>
              </div>
              <div className="bg-white p-4 rounded shadow border flex flex-col items-center">
                <Users className="h-6 w-6 text-green-500 mb-1" />
                <div className="text-gray-500 text-sm">Department Events</div>
                <div className="text-2xl font-bold">{events.filter(e => e.departments?.includes(user?.department)).length}</div>
              </div>
              <div className="bg-white p-4 rounded shadow border flex flex-col items-center">
                <Crown className="h-6 w-6 text-purple-500 mb-1" />
                <div className="text-gray-500 text-sm">Org-wide Events</div>
                <div className="text-2xl font-bold">{events.filter(e => e.is_organization_wide).length}</div>
              </div>
            </div>

            {/* Upcoming Events Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-500" /> Upcoming Events</h3>
              {events.length === 0 ? (
                <div className="text-gray-500">No upcoming events.</div>
              ) : (
                <ul className="divide-y bg-white rounded shadow">
                  {events.slice(0, 5).map(event => (
                    <li key={event.id} className="px-2 sm:px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <span className="font-medium text-blue-700">{event.title}</span>
                        <span className="ml-2 text-xs text-gray-500">{new Date(event.start_datetime).toLocaleString()} - {new Date(event.end_datetime).toLocaleString()}</span>
                        <div className="text-xs text-gray-500">{event.is_organization_wide ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Organization-wide</span> : <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{event.departments?.join(", ") || "-"}</span>}</div>
                        <div className="text-xs text-gray-400">Location: {event.location || "-"}</div>
                      </div>
                      <div className="flex gap-2 items-center mt-2 md:mt-0">
                        <button onClick={() => navigate(`/calendar?event=${event.id}`)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium shadow">View Details</button>
                        {/* RSVP Placeholder */}
                        <button className="bg-green-100 text-green-700 px-3 py-1 rounded font-medium shadow" disabled>RSVP</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 text-right">
                <Link to="/calendar" className="text-blue-600 hover:underline font-medium">See all events &rarr;</Link>
              </div>
            </div>

            {/* Notifications Center */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Bell className="h-5 w-5 text-yellow-500" /> Notifications</h3>
              {notifications.length === 0 ? (
                <div className="text-gray-500">No new notifications.</div>
              ) : (
                <ul className="divide-y bg-white rounded shadow">
                  {notifications.slice(0, 5).map(notif => (
                    <li key={notif.id} className="px-2 sm:px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <span className="font-medium text-gray-900">{notif.title}</span>
                        <span className="ml-2 text-xs text-gray-500">{new Date(notif.notify_at).toLocaleString()}</span>
                        <div className="text-xs text-gray-400">{notif.body}</div>
                      </div>
                      <button onClick={() => markAsRead(notif.id)} className="text-xs text-blue-600 hover:underline mt-1">Mark as read</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 text-right">
                <button onClick={() => setShowNotif(false)} className="text-blue-600 hover:underline font-medium">View all notifications &rarr;</button>
              </div>
            </div>

            {/* Calendar Preview */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-500" /> Calendar Preview</h3>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center w-full">
                <div className="text-gray-500 mb-2">See all your events in the calendar</div>
                <button onClick={() => navigate('/calendar')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold shadow w-full sm:w-auto">Go to Full Calendar</button>
              </div>
            </div>

            {/* Department Feed */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Users className="h-5 w-5 text-green-500" /> Department Feed</h3>
              <div className="bg-white rounded shadow p-4 w-full">
                <div className="text-gray-500">Latest announcements and events from your department will appear here.</div>
                {/* Placeholder for department feed */}
              </div>
            </div>

            {/* Request Event Creation Permission */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Plus className="h-5 w-5 text-purple-500" /> Want to create events?</h3>
              <div className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
                <div className="text-gray-500">Request permission to become an event creator and help organize events for your department or the whole organization.</div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-semibold shadow w-full md:w-auto" disabled>Request Event Creator Access</button>
                {/* TODO: Implement request logic and status */}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
