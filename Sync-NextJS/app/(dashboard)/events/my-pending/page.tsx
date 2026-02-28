"use client";

import { useState, useEffect } from "react";
import { eventService } from "@/lib/services";
import { formatDateTime } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  RefreshCw,
} from "lucide-react";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-amber-700 bg-amber-50",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className: "text-green-700 bg-green-50",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "text-red-700 bg-red-50",
  },
};

export default function MyPendingEventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPending();
  }, []);

  async function fetchMyPending() {
    setLoading(true);
    try {
      const res = await eventService.getMyPending();
      setEvents(res.data.events || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Failed to fetch my pending events:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" />
          My Submissions
        </h1>
        <button
          onClick={fetchMyPending}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <LoadingSpinner />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No pending submissions</p>
          <p className="text-gray-400 text-sm mt-1">
            Events you submit for approval will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const status = event.approval_status || "pending";
            const config =
              statusConfig[status as keyof typeof statusConfig] ||
              statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}
                      >
                        <StatusIcon className="h-3 w-3" /> {config.label}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {event.category}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(event.start_time)} —{" "}
                        {formatDateTime(event.end_time)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {event.location}
                        </span>
                      )}
                    </div>
                    {status === "rejected" && event.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Rejection reason:</strong>{" "}
                          {event.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
