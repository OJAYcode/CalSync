"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "./services";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("session_token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    console.log("[AUTH] Calling authService.login...");
    const res = await authService.login(email, password);
    console.log("[AUTH] Login response:", res.status, res.data);
    const { token, user: userData } = res.data;
    if (!token) {
      console.error("[AUTH] No token in response!", res.data);
      throw new Error("No token received from server");
    }
    localStorage.setItem("session_token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    console.log("[AUTH] Login complete, user set:", userData?.email);
  };

  const logout = useCallback(() => {
    authService.logout().catch(() => {});
    localStorage.removeItem("session_token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.me();
      const userData = res.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, setUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
