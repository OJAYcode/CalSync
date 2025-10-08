import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Users, Shield, Key } from "lucide-react";

const ADMIN_CODE = "ADMIN2024"; 

// API base URL: prefers VITE_API_URL, else use current host with :5000 in dev/LAN, else Railway
const API_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // If accessing from phone on LAN (host is an IP) or localhost, point to same host on port 5000
    const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    if (host === "localhost" || isIp) {
      return `http://${host}:5000`;
    }
  }
  return "https://calsync-production.up.railway.app";
})();

const Signup = ({ setUser }) => {
  const [activeTab, setActiveTab] = useState("employee");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Employee form state
  const [empForm, setEmpForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    departments: [],
  });
  // Admin form state
  const [adminForm, setAdminForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    admin_code: "",
  });
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/departments`)
      .then(res => res.json())
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load departments", err);
        setDepartments([]);
      });
  }, []);

  // Employee form handlers
  const handleEmpChange = e => {
    setEmpForm({ ...empForm, [e.target.name]: e.target.value });
  };
  const handleEmpDeptChange = dept => {
    setEmpForm(f => ({
      ...f,
      departments: f.departments.includes(dept)
        ? f.departments.filter(d => d !== dept)
        : [...f.departments, dept]
    }));
  };

  // Admin form handlers
  const handleAdminChange = e => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  // Employee signup submit
  const handleEmpSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!empForm.first_name.trim() || !empForm.last_name.trim() || !empForm.email.trim() || !empForm.password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (empForm.departments.length === 0) {
      setError("Please select at least one department.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...empForm,
        department: empForm.departments.join(", "),
        role: "employee"
      };
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Admin signup submit
  const handleAdminSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!adminForm.first_name.trim() || !adminForm.last_name.trim() || !adminForm.email.trim() || !adminForm.password.trim() || !adminForm.admin_code.trim()) {
      setError("All fields are required.");
      return;
    }
    if (adminForm.admin_code !== ADMIN_CODE) {
      setError("Invalid admin code.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...adminForm,
        role: "admin"
      };
      delete payload.admin_code;
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-lg border border-blue-100">
        {/* Toggle Tabs */}
        <div className="flex mb-8 justify-center gap-2">
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold transition-all duration-150 ${activeTab === "employee" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}
            onClick={() => { setActiveTab("employee"); setError(""); setSuccess(""); }}
          >
            Employee Signup
          </button>
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold transition-all duration-150 ${activeTab === "admin" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}
            onClick={() => { setActiveTab("admin"); setError(""); setSuccess(""); }}
          >
            Admin Signup
          </button>
        </div>
        {/* Error/Success */}
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
        {success && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded p-2 text-center">{success}</div>}
        {/* Employee Signup Form */}
        {activeTab === "employee" && (
          <form onSubmit={handleEmpSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium">First Name</label>
                <div className="relative">
                  <User className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                  <input type="text" name="first_name" value={empForm.first_name} onChange={handleEmpChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Last Name</label>
                <div className="relative">
                  <User className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                  <input type="text" name="last_name" value={empForm.last_name} onChange={handleEmpChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <input type="email" name="email" value={empForm.email} onChange={handleEmpChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <input type={showEmpPassword ? "text" : "password"} name="password" value={empForm.password} onChange={handleEmpChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
                <button type="button" onClick={() => setShowEmpPassword(v => !v)} className="absolute right-2 top-2.5 text-xs text-blue-500 hover:underline focus:outline-none">
                  {showEmpPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium flex items-center gap-1"><Users className="h-4 w-4 text-blue-400" /> Departments</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {departments.length === 0 ? (
                  <span className="text-gray-400 text-sm col-span-2">No departments available</span>
                ) : (
                  departments.map(dept => (
                    <label key={dept.id} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded px-2 py-1 cursor-pointer hover:bg-blue-100">
                      <input
                        type="checkbox"
                        checked={empForm.departments.includes(dept.name)}
                        onChange={() => handleEmpDeptChange(dept.name)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-blue-800">{dept.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 rounded-lg font-semibold text-lg shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150 mt-2" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</button>
          </form>
        )}
        {/* Admin Signup Form */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium">First Name</label>
                <div className="relative">
                  <User className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                  <input type="text" name="first_name" value={adminForm.first_name} onChange={handleAdminChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Last Name</label>
                <div className="relative">
                  <User className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                  <input type="text" name="last_name" value={adminForm.last_name} onChange={handleAdminChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <input type="email" name="email" value={adminForm.email} onChange={handleAdminChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
                <input type={showAdminPassword ? "text" : "password"} name="password" value={adminForm.password} onChange={handleAdminChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
                <button type="button" onClick={() => setShowAdminPassword(v => !v)} className="absolute right-2 top-2.5 text-xs text-blue-500 hover:underline focus:outline-none">
                  {showAdminPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium flex items-center gap-1"><Key className="h-4 w-4 text-blue-400" /> Admin Code</label>
              <div className="relative">
                <input type="text" name="admin_code" value={adminForm.admin_code} onChange={handleAdminChange} required className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
              </div>
              <div className="text-xs text-gray-400 mt-1">Ask your system owner for the admin code.</div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 rounded-lg font-semibold text-lg shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150 mt-2" disabled={loading}>{loading ? "Signing up..." : "Sign Up as Admin"}</button>
          </form>
        )}
        <div className="mt-6 text-center text-sm">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline font-medium">Log in</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
