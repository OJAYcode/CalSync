"use client";

import { useState, useEffect } from "react";
import { superAdminService } from "@/lib/services";
import { getErrorMessage, formatDateTime, getCategoryBadge } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { CalendarDays, Search, Trash2, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SuperAdminEventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [page, search]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await superAdminService.getEvents({ page, per_page: 20, search: search || undefined });
      setEvents(res.data.events || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(ev: CalendarEvent) {
    if (!confirm(`Delete event "${ev.title}"?`)) return;
    try {
      await superAdminService.deleteEvent(ev.id);
      toast({ title: "Event deleted", type: "success" });
      fetchEvents();
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-purple-500" /> All Events
        </h1>
        <span className="text-sm text-gray-500">{total} events</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search events..."
          className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Start</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Creator</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                      {ev.location && <p className="text-xs text-gray-500">{ev.location}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryBadge(ev.category)}`}>
                        {ev.category || "general"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {ev.start_time ? formatDateTime(ev.start_time) : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{ev.creator_name || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/events/${ev.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleDelete(ev)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">No events found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">{total} total events</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
              <span className="px-3 py-1 text-sm">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={events.length < 20}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
