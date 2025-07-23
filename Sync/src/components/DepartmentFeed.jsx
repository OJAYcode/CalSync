import React, { useEffect, useState } from "react";
import BackButton from "./BackButton";

const DepartmentFeed = () => {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch user info
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Fetch all events
    fetch("http://localhost:5000/events", {
      headers: { Authorization: `Bearer ${localStorage.getItem("session_token")}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEvents(data);
        else setError(data.error || "Failed to load events");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load events"); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  // Filter for department and org-wide events
  const departmentEvents = events.filter(e =>
    e.is_organization_wide || (user && e.departments && e.departments.includes(user.department))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded shadow p-8">
        <BackButton />
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-200">Department Feed</h2>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center dark:bg-red-900 dark:border-red-400">{error}</div>}
        {departmentEvents.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-300">No department or organization-wide events found.</div>
        ) : (
          <ul className="divide-y bg-white dark:bg-gray-800 rounded shadow">
            {departmentEvents.map(event => (
              <li key={event.id} className="px-4 py-3 flex flex-col gap-1">
                <span className="font-medium text-blue-700 dark:text-blue-200">{event.title}</span>
                <span className="text-xs text-gray-500 dark:text-gray-300">{new Date(event.start_datetime).toLocaleString()} - {new Date(event.end_datetime).toLocaleString()}</span>
                <div className="text-xs text-gray-500 dark:text-gray-300">{event.is_organization_wide ? <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-0.5 rounded">Organization-wide</span> : <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded">{event.departments?.join(", ") || "-"}</span>}</div>
                <div className="text-xs text-gray-400 dark:text-gray-400">Location: {event.location || "-"}</div>
                {event.description && <div className="text-xs text-gray-600 dark:text-gray-300">{event.description}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DepartmentFeed; 