"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("[LOGIN] Attempting login with:", email);

    try {
      await login(email, password);
      console.log("[LOGIN] Login succeeded, redirecting...");
      toast({
        title: "Success",
        description: "Logged in successfully",
        type: "success",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("[LOGIN] Login failed:", error);
      console.error(
        "[LOGIN] Error response:",
        error?.response?.status,
        error?.response?.data,
      );
      console.error("[LOGIN] Error message:", error?.message);
      console.error("[LOGIN] Error code:", error?.code);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Login failed";
      toast({ title: "Error", description: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700 flex items-center justify-center gap-2">
          <LogIn className="h-7 w-7 text-blue-500" />
          Welcome Back
        </h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border pl-8 px-3 py-2 rounded focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="mt-6 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
