import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

// API URL configuration - using Railway backend
const API_URL = "https://calsync-production.up.railway.app";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [departmentFeeds, setDepartmentFeeds] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [newFeed, setNewFeed] = useState({ title: "", content: "", department: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({ total: 0, admins: 0, employees: 0, active: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.role !== "admin") {
        navigate("/dashboard");
      }
    } else {
      navigate("/login");
    }
    fetchDepartments();
    fetchUsers();
    fetchDepartmentFeeds();
    // eslint-disable-next-line
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`);
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      setDepartments([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("session_token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        // Calculate stats
        setStats({
          total: data.length,
          admins: data.filter(u => u.role === "admin").length,
          employees: data.filter(u => u.role === "employee").length,
          active: data.filter(u => u.is_active).length,
        });
      }
    } catch (err) {
      setUsers([]);
    }
  };

  const fetchDepartmentFeeds = async () => {
    try {
      const res = await fetch(`${API_URL}/department-feeds`);
      const data = await res.json();
      setDepartmentFeeds(Array.isArray(data) ? data : []);
    } catch (err) {
      setDepartmentFeeds([]);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newDept.trim()) {
      setError("Department name required");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
        body: JSON.stringify({ name: newDept.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Department added");
        setNewDept("");
        fetchDepartments();
      } else {
        setError(data.error || "Failed to add department");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleDeleteDepartment = async (id) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/departments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Department deleted");
        fetchDepartments();
      } else {
        setError(data.error || "Failed to delete department");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newFeed.title.trim() || !newFeed.content.trim() || !newFeed.department.trim()) {
      setError("Title, content, and department are required");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/department-feeds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
        body: JSON.stringify(newFeed),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Department feed added");
        setNewFeed({ title: "", content: "", department: "" });
        fetchDepartmentFeeds();
      } else {
        setError(data.error || "Failed to add department feed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleDeleteFeed = async (id) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/department-feeds/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Department feed deleted");
        fetchDepartmentFeeds();
      } else {
        setError(data.error || "Failed to delete department feed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handlePromote = async (userId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/promote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("User promoted to admin");
        fetchUsers();
      } else {
        setError(data.error || "Failed to promote user");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleDemote = async (userId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/demote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("User demoted to employee");
        fetchUsers();
      } else {
        setError(data.error || "Failed to demote user");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleDeactivate = async (userId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/deactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("User deactivated");
        fetchUsers();
      } else {
        setError(data.error || "Failed to deactivate user");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleReactivate = async (userId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/reactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("session_token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("User reactivated");
        fetchUsers();
      } else {
        setError(data.error || "Failed to reactivate user");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem("session_token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="text-red-600 dark:text-red-400 hover:underline"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-4"><BackButton /></div>
        
        {/* Error and Success Messages */}
        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>}
        
        {/* System Stats */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">System Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
              <div className="text-gray-500 dark:text-gray-300 text-sm">Total Users</div>
              <div className="text-2xl font-bold dark:text-gray-100">{stats.total}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
              <div className="text-gray-500 dark:text-gray-300 text-sm">Admins</div>
              <div className="text-2xl font-bold dark:text-gray-100">{stats.admins}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
              <div className="text-gray-500 dark:text-gray-300 text-sm">Employees</div>
              <div className="text-2xl font-bold dark:text-gray-100">{stats.employees}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
              <div className="text-gray-500 dark:text-gray-300 text-sm">Active Users</div>
              <div className="text-2xl font-bold dark:text-gray-100">{stats.active}</div>
            </div>
          </div>
        </section>

        {/* User Management */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">User Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 dark:text-gray-100">Name</th>
                  <th className="px-4 py-2 dark:text-gray-100">Email</th>
                  <th className="px-4 py-2 dark:text-gray-100">Role</th>
                  <th className="px-4 py-2 dark:text-gray-100">Department</th>
                  <th className="px-4 py-2 dark:text-gray-100">Status</th>
                  <th className="px-4 py-2 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2 dark:text-gray-100">{u.full_name}</td>
                    <td className="px-4 py-2 dark:text-gray-100">{u.email}</td>
                    <td className="px-4 py-2 capitalize dark:text-gray-100">{u.role}</td>
                    <td className="px-4 py-2 dark:text-gray-100">{u.department || "-"}</td>
                    <td className="px-4 py-2 dark:text-gray-100">{u.is_active ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-2 space-x-2">
                      {u.role === "employee" && <button onClick={() => handlePromote(u.id)} className="text-blue-600 hover:underline">Promote</button>}
                      {u.role === "admin" && u.id !== user?.id && <button onClick={() => handleDemote(u.id)} className="text-yellow-600 hover:underline">Demote</button>}
                      {u.is_active ? (
                        <button onClick={() => handleDeactivate(u.id)} className="text-red-600 hover:underline">Deactivate</button>
                      ) : (
                        <button onClick={() => handleReactivate(u.id)} className="text-green-600 hover:underline">Reactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-4">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Department Management */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Department Management</h2>
          <form onSubmit={handleAddDepartment} className="flex items-center mb-4 gap-2">
            <input
              type="text"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="New department name"
              className="border px-3 py-2 rounded w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Add
            </button>
          </form>
          <ul className="bg-white dark:bg-gray-800 rounded shadow divide-y dark:divide-gray-700">
            {departments.map((dept) => (
              <li key={dept.id} className="flex justify-between items-center px-4 py-2 dark:text-gray-100">
                <span>{dept.name}</span>
                <button
                  onClick={() => handleDeleteDepartment(dept.id)}
                  className="text-red-500 hover:underline dark:text-red-400"
                >
                  Delete
                </button>
              </li>
            ))}
            {departments.length === 0 && (
              <li className="px-4 py-2 text-gray-500 dark:text-gray-400">No departments found.</li>
            )}
          </ul>
        </section>

        {/* Department Feed Management */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Department Feed Management</h2>
          <form onSubmit={handleAddFeed} className="mb-4 space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={newFeed.title}
                onChange={(e) => setNewFeed({...newFeed, title: e.target.value})}
                placeholder="Feed title"
                className="border px-3 py-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              <select
                value={newFeed.department}
                onChange={(e) => setNewFeed({...newFeed, department: e.target.value})}
                className="border px-3 py-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <textarea
                value={newFeed.content}
                onChange={(e) => setNewFeed({...newFeed, content: e.target.value})}
                placeholder="Feed content"
                rows="3"
                className="border px-3 py-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 self-end"
              >
                Add Feed
              </button>
            </div>
          </form>
          
          <div className="space-y-4">
            {departmentFeeds.map((feed) => (
              <div key={feed.id} className="bg-white dark:bg-gray-800 rounded shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold dark:text-gray-100">{feed.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{feed.department}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFeed(feed.id)}
                    className="text-red-500 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{feed.content}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Created: {new Date(feed.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {departmentFeeds.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No department feeds found.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard; 