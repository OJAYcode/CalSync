import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newDept, setNewDept] = useState("");
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

  // Placeholder for promote/demote/deactivate actions
  // You would implement backend endpoints for these actions
  const handlePromote = (userId) => alert(`Promote user ${userId} to admin (backend endpoint needed)`);
  const handleDemote = (userId) => alert(`Demote user ${userId} to employee (backend endpoint needed)`);
  const handleDeactivate = (userId) => alert(`Deactivate user ${userId} (backend endpoint needed)`);
  const handleReactivate = (userId) => alert(`Reactivate user ${userId} (backend endpoint needed)`);

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
          {error && <div className="text-red-600 mb-2 dark:text-red-400">{error}</div>}
          {success && <div className="text-green-600 mb-2 dark:text-green-400">{success}</div>}
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
      </main>
    </div>
  );
};

export default AdminDashboard; 