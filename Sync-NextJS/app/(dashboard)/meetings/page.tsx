"use client";

import { useState, useEffect } from "react";
import { meetingService, departmentService } from "@/lib/services";
import { getErrorMessage, formatDateTime } from "@/lib/utils";
import type { Meeting, Department } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/toaster";
import { Video, Plus, Copy, ExternalLink, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduled_start: "",
    scheduled_end: "",
    max_participants: 10,
    department_id: "",
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchMeetings();
    departmentService
      .getAll()
      .then((res) =>
        setDepartments(
          Array.isArray(res.data)
            ? res.data
            : (res.data as any).departments || [],
        ),
      )
      .catch(() => {});
  }, []);

  async function fetchMeetings() {
    setLoading(true);
    try {
      const res = await meetingService.getAll();
      const hosted = res.data.hosted_meetings || [];
      const joined = (res.data as any).joined_meetings || [];
      setMeetings([...hosted, ...joined]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await meetingService.create({
        title: form.title,
        description: form.description || undefined,
        scheduled_start: form.scheduled_start || undefined,
        scheduled_end: form.scheduled_end || undefined,
        max_participants: form.max_participants,
        department_id: form.department_id || undefined,
      });
      const meetingCode = res.data.meeting_code;
      toast({
        title: "Meeting created",
        description: `Code: ${meetingCode}`,
        type: "success",
      });
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        scheduled_start: "",
        scheduled_end: "",
        max_participants: 10,
        department_id: "",
      });
      fetchMeetings();
      // Navigate to the meeting room
      if (meetingCode) {
        router.push(`/meeting/${meetingCode}`);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    router.push(`/meeting/${joinCode.trim()}`);
  }

  async function handleDelete(m: Meeting) {
    if (!confirm(`Delete "${m.title}"?`)) return;
    try {
      await meetingService.delete(m.meeting_code || m.id);
      toast({ title: "Deleted", type: "success" });
      fetchMeetings();
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied", type: "success" });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "ended":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Video className="h-6 w-6 text-blue-500" /> Meetings
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Meeting
        </button>
      </div>

      {/* Join by code */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          Join a Meeting
        </h2>
        <div className="flex gap-3">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter meeting code..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Join
          </button>
        </div>
      </div>

      {/* Meeting List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <LoadingSpinner />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-16">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No meetings yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Create your first meeting
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {meetings.map((m) => (
              <div
                key={m.id || m.meeting_code || (m as any)._id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {m.title}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(m.status)}`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    {m.meeting_code && (
                      <button
                        onClick={() => copyCode(m.meeting_code!)}
                        className="inline-flex items-center gap-1 hover:text-blue-600"
                      >
                        <Copy className="h-3 w-3" /> {m.meeting_code}
                      </button>
                    )}
                    {m.scheduled_start && (
                      <span>{formatDateTime(m.scheduled_start)}</span>
                    )}
                    {m.participant_count != null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {m.participant_count}
                        {m.max_participants ? `/${m.max_participants}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.status !== "ended" && m.meeting_code && (
                    <button
                      onClick={() => router.push(`/meeting/${m.meeting_code}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                    >
                      <ExternalLink className="h-3 w-3" /> Join
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(m)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Meeting"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Team standup"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_start}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduled_start: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_end}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduled_end: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Participants
            </label>
            <input
              type="number"
              min={2}
              max={100}
              value={form.max_participants}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  max_participants: parseInt(e.target.value) || 10,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department (optional)
            </label>
            <select
              value={form.department_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, department_id: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create & Join"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
