"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { eventService } from "@/lib/services";
import { formatTime, getCategoryColor } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await eventService.getCalendar(month, year);
      setEvents(res.data.events || (res.data as unknown as CalendarEvent[]));
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  }

  function getEventsForDate(date: Date): CalendarEvent[] {
    return events.filter((e) => {
      try {
        return isSameDay(parseISO(e.start_time), date);
      } catch {
        return false;
      }
    });
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const selectedDayEvents = selectedDate
    ? getEventsForDate(selectedDate)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
        >
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (d) => (
                    <div
                      key={d}
                      className="text-center text-xs font-semibold text-gray-500 py-2"
                    >
                      {d}
                    </div>
                  )
                )}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-px">
                {weeks.map((week, wi) =>
                  week.map((d, di) => {
                    const dayEvents = getEventsForDate(d);
                    const isCurrentMonth = isSameMonth(d, currentDate);
                    const isToday = isSameDay(d, new Date());
                    const isSelected =
                      selectedDate && isSameDay(d, selectedDate);

                    return (
                      <button
                        key={`${wi}-${di}`}
                        onClick={() => setSelectedDate(d)}
                        className={`min-h-[80px] p-1.5 border border-gray-100 rounded-lg text-left transition hover:bg-blue-50
                          ${!isCurrentMonth ? "opacity-40" : ""}
                          ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                          ${isToday && !isSelected ? "bg-blue-50/50" : ""}
                        `}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isToday
                              ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                              : "text-gray-700"
                          }`}
                        >
                          {format(d, "d")}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div
                              key={ev.id}
                              className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${getCategoryColor(ev.category)}`}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-gray-400 px-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Day Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Select a date"}
            </h3>
          </div>
          <div className="p-4">
            {!selectedDate ? (
              <p className="text-gray-400 text-sm text-center py-8">
                Click on a date to see events
              </p>
            ) : selectedDayEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No events</p>
                <Link
                  href="/events/new"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> Create one
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition"
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(event.start_time)} –{" "}
                      {formatTime(event.end_time)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {event.location}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
