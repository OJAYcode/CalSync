import React, { useState } from "react";
import BackButton from "./BackButton";

const ChangePassword = () => {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.new_password !== form.confirm_password) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("session_token");
    const res = await fetch("http://localhost:5000/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password })
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Password changed successfully!");
      setForm({ old_password: "", new_password: "", confirm_password: "" });
    } else {
      setError(data.error || "Failed to change password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded shadow p-8">
        <BackButton />
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Change Password</h2>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
        {success && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded p-2 text-center">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Old Password</label>
            <input name="old_password" type="password" value={form.old_password} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">New Password</label>
            <input name="new_password" type="password" value={form.new_password} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Confirm New Password</label>
            <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold text-lg shadow hover:bg-blue-700 transition-all duration-150" disabled={loading}>{loading ? "Changing..." : "Change Password"}</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 