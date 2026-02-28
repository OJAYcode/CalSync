"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { eventService } from "@/lib/services";
import { formatDate, formatTime, getCategoryBadge, getRelativeDate } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ChevronRight,
  Video,
  Users,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [upcomingRes, todayRes] = await Promise.all([
        eventService.getUpcoming(),
        eventService.getByDate(new Date().toISOString().split("T")[0]),
      ]);
      setUpcomingEvents(
        (upcomingRes.data.events || upcomingRes.data as unknown as CalendarEvent[]).slice(0, 5)
      );
      setTodayEvents(
        todayRes.data.events || todayRes.data as unknown as CalendarEvent[]
      );
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Today's Events"
          value={todayEvents.length}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Upcoming"
          value={upcomingEvents.length}
          color="green"
        />
        <StatCard
          icon={Video}
          label="Meetings"
          value={
            todayEvents.filter((e) => e.category === "meeting").length
          }
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Role"
          value={user?.role === "super_admin" ? "Super Admin" : user?.role === "admin" ? "Admin" : "Employee"}
          color="amber"
          isText
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Events */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" /> Today&apos;s Schedule
            </h2>
            <Link
              href="/calendar"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View Calendar <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {todayEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No events today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" /> Upcoming
            </h2>
            <Link
              href="/events/new"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Create Event <Plus className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} showDate />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`font-bold ${isText ? "text-lg" : "text-2xl"} text-gray-900`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({
  event,
  showDate,
}: {
  event: CalendarEvent;
  showDate?: boolean;
}) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className={`w-3 h-3 rounded-full ${getCategoryBadge(event.category).includes("blue") ? "bg-blue-500" : getCategoryBadge(event.category).includes("red") ? "bg-red-500" : getCategoryBadge(event.category).includes("green") ? "bg-green-500" : getCategoryBadge(event.category).includes("purple") ? "bg-purple-500" : getCategoryBadge(event.category).includes("yellow") ? "bg-yellow-500" : "bg-gray-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
          {event.title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {showDate ? getRelativeDate(event.start_time) + " · " : ""}
            {formatTime(event.start_time)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" /> {event.location}
            </span>
          )}
        </div>
      </div>
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getCategoryBadge(event.category)}`}
      >
        {event.category}
      </span>
    </Link>
  );
}
