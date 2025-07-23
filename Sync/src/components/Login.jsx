import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";

const Login = ({ setUser }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("session_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user); // <-- update App state
        navigate("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700 flex items-center justify-center gap-2">
          <LogIn className="inline-block h-7 w-7 text-blue-500 mr-1" />
          Welcome Back
        </h2>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
          </div>
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200" />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-2.5 text-xs text-blue-500 hover:underline focus:outline-none">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 rounded-lg font-semibold text-lg shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
        <div className="mt-6 text-center text-sm">
          Don&apos;t have an account? <a href="/signup" className="text-blue-600 hover:underline font-medium">Sign up</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
