import React, { useEffect, useState } from "react";
import BackButton from "./BackButton";

const Profile = () => {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", department: "" });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch user info
    const token = localStorage.getItem("session_token");
    fetch("http://localhost:5000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          department: data.department || ""
        });
        setLoading(false);
      })
      .catch(() => { setError("Failed to load profile"); setLoading(false); });
    // Fetch departments
    fetch("http://localhost:5000/departments")
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(() => setDepartments([]));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const token = localStorage.getItem("session_token");
    const res = await fetch("http://localhost:5000/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Profile updated successfully!");
      // Optionally update localStorage user
      const user = JSON.parse(localStorage.getItem("user") || "{}") || {};
      localStorage.setItem("user", JSON.stringify({ ...user, ...form }));
    } else {
      setError(data.error || "Failed to update profile");
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded shadow p-8">
        <BackButton />
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Edit Profile</h2>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
        {success && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded p-2 text-center">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Department</label>
            <select name="department" value={form.department} onChange={handleChange} className="w-full border px-3 py-2 rounded">
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold text-lg shadow hover:bg-blue-700 transition-all duration-150" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </form>
      </div>
    </div>
  );
};

export default Profile; 