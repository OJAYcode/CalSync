"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { eventService } from "@/lib/services";
import {
  formatDateTime,
  formatTime,
  getCategoryBadge,
  getErrorMessage,
  getRoleLabel,
} from "@/lib/utils";
import type { CalendarEvent, RSVP, RSVPStatus } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Repeat,
  Lock,
  Video,
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      const [eventRes, rsvpRes] = await Promise.all([
        eventService.getById(id),
        eventService.getRSVPs(id).catch(() => ({ data: { rsvps: [] } })),
      ]);
      setEvent(eventRes.data.event || (eventRes.data as unknown as CalendarEvent));
      setRsvps(rsvpRes.data.rsvps || []);
    } catch (err) {
      toast({ title: "Error", description: "Event not found", type: "error" });
      router.push("/calendar");
    } finally {
      setLoading(false);
    }
  }

  async function handleRSVP(status: RSVPStatus) {
    setRsvpLoading(true);
    try {
      await eventService.rsvp(id, status);
      toast({ title: "Success", description: `RSVP: ${status}`, type: "success" });
      fetchEvent();
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this event?")) return;
    try {
      await eventService.delete(id);
      toast({ title: "Success", description: "Event deleted", type: "success" });
      router.push("/calendar");
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading event..." />
      </div>
    );
  }

  if (!event) return null;

  const isOwner = event.created_by === user?.id;
  const canEdit = isOwner || user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${getCategoryBadge(event.category)}`}
                >
                  {event.category}
                </span>
                {event.is_private && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Private
                  </span>
                )}
                {event.recurrence !== "none" && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> {event.recurrence}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {event.title}
              </h1>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/events/${id}/edit`}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {event.description && (
            <p className="text-gray-600">{event.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{formatDateTime(event.start_time)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>
                {formatTime(event.start_time)} – {formatTime(event.end_time)}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {event.meeting_link && (
              <div className="flex items-center gap-3 text-sm">
                <Video className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <a
                  href={event.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>

          {event.creator_name && (
            <p className="text-sm text-gray-500">
              Created by <span className="font-medium">{event.creator_name}</span>
            </p>
          )}

          {/* RSVP Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" /> RSVP
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {(["attending", "maybe", "declined"] as RSVPStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleRSVP(status)}
                    disabled={rsvpLoading}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition
                      ${
                        event.rsvp_status === status
                          ? status === "attending"
                            ? "bg-green-50 border-green-300 text-green-700"
                            : status === "maybe"
                            ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                            : "bg-red-50 border-red-300 text-red-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    {status === "attending" && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {status === "maybe" && (
                      <HelpCircle className="h-4 w-4" />
                    )}
                    {status === "declined" && (
                      <XCircle className="h-4 w-4" />
                    )}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* RSVP list */}
            {rsvps.length > 0 && (
              <div className="space-y-2">
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="text-gray-700">{rsvp.user_name}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        rsvp.status === "attending"
                          ? "bg-green-100 text-green-700"
                          : rsvp.status === "maybe"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {rsvp.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
