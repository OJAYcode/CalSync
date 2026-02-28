"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { superAdminService } from "@/lib/services";
import type { DashboardStats } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Users,
  Calendar,
  Building2,
  Shield,
  FileText,
  Database,
  Settings,
  BarChart3,
  Layers,
  TrendingUp,
} from "lucide-react";

const menuItems = [
  { label: "Users", href: "/super-admin/users", icon: Users, color: "blue" },
  { label: "Events", href: "/super-admin/events", icon: Calendar, color: "green" },
  { label: "Admins", href: "/super-admin/admins", icon: Shield, color: "purple" },
  { label: "Audit Logs", href: "/super-admin/audit", icon: FileText, color: "amber" },
  { label: "Bulk Operations", href: "/super-admin/bulk", icon: Layers, color: "rose" },
  { label: "Database", href: "/super-admin/database", icon: Database, color: "cyan" },
  { label: "Settings", href: "/super-admin/settings", icon: Settings, color: "gray" },
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }
    fetchStats();
  }, [user]);

  async function fetchStats() {
    try {
      const res = await superAdminService.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading admin dashboard..." />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "blue" },
    { label: "Active Users", value: stats?.active_users ?? 0, icon: TrendingUp, color: "green" },
    { label: "Total Events", value: stats?.total_events ?? 0, icon: Calendar, color: "purple" },
    { label: "Departments", value: stats?.total_departments ?? 0, icon: Building2, color: "amber" },
    { label: "Admins", value: stats?.total_admins ?? 0, icon: Shield, color: "rose" },
    { label: "Events This Month", value: stats?.events_this_month ?? 0, icon: BarChart3, color: "cyan" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    cyan: "bg-cyan-50 text-cyan-600",
    gray: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${colorMap[card.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Management
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition group"
              >
                <div className={`p-3 rounded-lg ${colorMap[item.color]} w-fit mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {item.label}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
