"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Users,
  Building2,
  Bell,
  MessageSquare,
  Video,
  Shield,
  ClipboardCheck,
  Clock,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "New Event", href: "/events/new", icon: PlusCircle },
  { label: "My Submissions", href: "/events/my-pending", icon: Clock },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Feeds", href: "/feeds", icon: MessageSquare },
  { label: "Meetings", href: "/meetings", icon: Video },
];

const adminItems: NavItem[] = [
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: Users,
    roles: ["admin", "super_admin"],
  },
  {
    label: "Event Approvals",
    href: "/admin/approvals",
    icon: ClipboardCheck,
    roles: ["admin", "super_admin"],
  },
  {
    label: "Departments",
    href: "/admin/departments",
    icon: Building2,
    roles: ["admin", "super_admin"],
  },
];

const superAdminItems: NavItem[] = [
  {
    label: "Super Admin",
    href: "/super-admin",
    icon: Shield,
    roles: ["super_admin"],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "employee";

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function renderItems(items: NavItem[]) {
    return items
      .filter((item) => !item.roles || item.roles.includes(role))
      .map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                active ? "text-blue-600" : "text-gray-400",
              )}
            />
            {item.label}
          </Link>
        );
      });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <span className="text-lg font-bold text-blue-600">CalSync</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hidden spacer for lg screens (navbar height) */}
        <div className="hidden lg:block h-16" />

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="mb-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Main
            </p>
            {renderItems(navItems)}
          </div>

          {(role === "admin" || role === "super_admin") && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Administration
              </p>
              {renderItems(adminItems)}
            </div>
          )}

          {role === "super_admin" && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                System
              </p>
              {renderItems(superAdminItems)}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
