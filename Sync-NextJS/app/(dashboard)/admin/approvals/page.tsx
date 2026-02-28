"use client";

import { useState, useEffect } from "react";
import { eventService } from "@/lib/services";
import { getErrorMessage, formatDateTime } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/toaster";
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Calendar,
} from "lucide-react";

export default function EventApprovalsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject modal
  const [rejectEvent, setRejectEvent] = useState<CalendarEvent | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    try {
      const res = await eventService.getPending();
      setEvents(res.data.events || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Failed to fetch pending events:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(event: CalendarEvent) {
    setActionLoading(event.id);
    try {
      await eventService.approve(event.id);
      toast({
        title: "Approved",
        description: `"${event.title}" has been approved.`,
        type: "success",
      });
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function openReject(event: CalendarEvent) {
    setRejectEvent(event);
    setRejectReason("");
  }

  async function handleReject() {
    if (!rejectEvent) return;
    setRejecting(true);
    try {
      await eventService.reject(rejectEvent.id, rejectReason || undefined);
      toast({
        title: "Rejected",
        description: `"${rejectEvent.title}" has been rejected.`,
        type: "success",
      });
      setEvents((prev) => prev.filter((e) => e.id !== rejectEvent.id));
      setRejectEvent(null);
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-blue-600" />
          Event Approvals
        </h1>
        <span className="text-sm text-gray-500">
          {events.length} pending {events.length === 1 ? "event" : "events"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <LoadingSpinner />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">
            No events waiting for approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" /> Pending
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {event.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
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
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {event.creator_name || event.created_by}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(event)}
                    disabled={actionLoading === event.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => openReject(event)}
                    disabled={actionLoading === event.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectEvent}
        onClose={() => setRejectEvent(null)}
        title="Reject Event"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to reject{" "}
            <strong>&ldquo;{rejectEvent?.title}&rdquo;</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for rejection..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRejectEvent(null)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={rejecting}
              className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {rejecting ? "Rejecting..." : "Reject Event"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
