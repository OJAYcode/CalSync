"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eventService } from "@/lib/services";
import { getErrorMessage } from "@/lib/utils";
import type { EventFormData, EventCategory, RecurrenceType } from "@/lib/types";
import { toast } from "@/components/ui/toaster";
import { ArrowLeft, Save } from "lucide-react";

const categories: EventCategory[] = [
  "meeting",
  "deadline",
  "reminder",
  "social",
  "training",
  "other",
];

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: "none", label: "No Repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
    if (!form.title || !form.start_time || !form.end_time) {
      toast({
        title: "Error",
        description: "Fill in required fields",
        type: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.recurrence === "none") {
        delete payload.recurrence_end;
      }
      const res = await eventService.create(payload);
      const event = res.data.event;
      if (event?.approval_status === "pending") {
        toast({
          title: "Submitted",
          description: "Your event has been submitted for approval.",
          type: "success",
        });
        router.push("/events/my-pending");
      } else {
        toast({
          title: "Success",
          description: "Event created!",
          type: "success",
        });
        router.push("/calendar");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-xl font-semibold text-gray-900">
            Create New Event
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              placeholder="Event title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              placeholder="Describe your event..."
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="e.g., Room 301"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat
              </label>
              <select
                name="recurrence"
                value={form.recurrence}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                {recurrenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {form.recurrence !== "none" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat Until
                </label>
                <input
                  type="date"
                  name="recurrence_end"
                  value={form.recurrence_end || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Link
            </label>
            <input
              name="meeting_link"
              value={form.meeting_link}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_all_day"
                checked={form.is_all_day}
                onChange={handleChange}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">All Day</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_private"
                checked={form.is_private}
                onChange={handleChange}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Private</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
