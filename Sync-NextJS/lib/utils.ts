import { clsx, type ClassValue } from "clsx";
import { format, parseISO, isToday, isTomorrow, isThisWeek } from "date-fns";
import type { UserRole, EventCategory } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date formatting helpers
export function formatDate(dateStr: string, fmt = "MMM d, yyyy") {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string) {
  try {
    return format(parseISO(dateStr), "h:mm a");
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string) {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy h:mm a");
  } catch {
    return dateStr;
  }
}

export function getRelativeDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

// Role helpers
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    employee: "Employee",
    admin: "Admin",
    super_admin: "Super Admin",
  };
  return labels[role] || role;
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    employee: "bg-gray-100 text-gray-700",
    admin: "bg-blue-100 text-blue-700",
    super_admin: "bg-purple-100 text-purple-700",
  };
  return colors[role] || "bg-gray-100 text-gray-700";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

// Event category helpers
export function getCategoryColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    meeting: "bg-blue-500",
    deadline: "bg-red-500",
    reminder: "bg-yellow-500",
    social: "bg-green-500",
    training: "bg-purple-500",
    other: "bg-gray-500",
  };
  return colors[category] || "bg-gray-500";
}

export function getCategoryBadge(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    meeting: "bg-blue-100 text-blue-700",
    deadline: "bg-red-100 text-red-700",
    reminder: "bg-yellow-100 text-yellow-700",
    social: "bg-green-100 text-green-700",
    training: "bg-purple-100 text-purple-700",
    other: "bg-gray-100 text-gray-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
}

// Error extraction
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if (err.response && typeof err.response === "object") {
      const res = err.response as Record<string, unknown>;
      if (res.data && typeof res.data === "object") {
        const data = res.data as Record<string, unknown>;
        return (
          (data.error as string) ||
          (data.message as string) ||
          "An error occurred"
        );
      }
    }
    if (err.message) return err.message as string;
  }
  return "An unexpected error occurred";
}

// Initials for avatar
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
