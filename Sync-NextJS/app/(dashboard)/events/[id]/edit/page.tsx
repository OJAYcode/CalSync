"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { eventService } from "@/lib/services";
import { getErrorMessage } from "@/lib/utils";
import type { EventFormData, EventCategory, RecurrenceType, CalendarEvent } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { ArrowLeft, Save } from "lucide-react";

const categories: EventCategory[] = [
  "meeting", "deadline", "reminder", "social", "training", "other",
];

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: "none", label: "No Repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventFormData>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    category: "meeting",
    is_all_day: false,
    recurrence: "none",
    is_private: false,
    meeting_link: "",
  });

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      const res = await eventService.getById(id);
      const ev: CalendarEvent = res.data.event || (res.data as unknown as CalendarEvent);
      setForm({
        title: ev.title,
        description: ev.description || "",
        start_time: ev.start_time ? ev.start_time.slice(0, 16) : "",
        end_time: ev.end_time ? ev.end_time.slice(0, 16) : "",
        location: ev.location || "",
        category: ev.category,
        is_all_day: ev.is_all_day,
        recurrence: ev.recurrence,
        recurrence_end: ev.recurrence_end,
        is_private: ev.is_private,
        meeting_link: ev.meeting_link || "",
      });
    } catch {
      toast({ title: "Error", description: "Event not found", type: "error" });
      router.push("/calendar");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target;
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await eventService.update(id, form);
      toast({ title: "Success", description: "Event updated!", type: "success" });
      router.push(`/events/${id}`);
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading event..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Edit Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
              <input type="datetime-local" name="start_time" value={form.start_time} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End *</label>
              <input type="datetime-local" name="end_time" value={form.end_time} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500">
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="location" value={form.location} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
              <select name="recurrence" value={form.recurrence} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500">
                {recurrenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {form.recurrence !== "none" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Until</label>
                <input type="date" name="recurrence_end" value={form.recurrence_end || ""} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
            <input name="meeting_link" value={form.meeting_link} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_all_day" checked={form.is_all_day} onChange={handleChange}
                className="rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">All Day</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_private" checked={form.is_private} onChange={handleChange}
                className="rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Private</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
