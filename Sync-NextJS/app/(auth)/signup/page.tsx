"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { departmentService } from "@/lib/services";
import type { Department } from "@/lib/types";
import { Mail, Lock, User, UserPlus, Building2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    department: "",
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const API =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://calsync-backend-nmxe.onrender.com";
    fetch(`${API}/departments`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.departments || [];
        setDepartments(list);
      })
      .catch((err) => console.error("Failed to load departments:", err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, string> = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };
      if (formData.department) body.department = formData.department;
      await api.post("/auth/signup", body);
      toast({
        title: "Success",
        description: "Account created successfully",
        type: "success",
      });
      router.push("/login");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Signup failed";
      toast({
        title: "Error",
        description: msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700 flex items-center justify-center gap-2">
          <UserPlus className="h-7 w-7 text-blue-500" />
          Create Account
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium text-sm">First Name</label>
            <div className="relative">
              <User className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Last Name</label>
            <div className="relative">
              <User className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-sm">Department</label>
          <div className="relative">
            <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 text-sm"
            >
              <option value="">Select department (optional)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2.5 text-xs text-blue-500 hover:underline focus:outline-none"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 rounded-lg font-semibold text-lg shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
