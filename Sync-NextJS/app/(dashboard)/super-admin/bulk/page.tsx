"use client";

import { useState } from "react";
import { superAdminService } from "@/lib/services";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { Layers, Users, CalendarDays, UserCheck, Trash2, AlertTriangle } from "lucide-react";

export default function SuperAdminBulkPage() {
  const [userIds, setUserIds] = useState("");
  const [eventIds, setEventIds] = useState("");
  const [running, setRunning] = useState<string | null>(null);

  function parseIds(raw: string): string[] {
    return raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function runAction(action: string) {
    setRunning(action);
    try {
      switch (action) {
        case "delete_users": {
          const ids = parseIds(userIds);
          if (!ids.length) { toast({ title: "Enter user IDs", type: "error" }); break; }
          if (!confirm(`Delete ${ids.length} users permanently?`)) break;
          await superAdminService.bulkDeleteUsers(ids);
          toast({ title: "Done", description: `${ids.length} users deleted`, type: "success" });
          setUserIds("");
          break;
        }
        case "deactivate_users": {
          const ids = parseIds(userIds);
          if (!ids.length) { toast({ title: "Enter user IDs", type: "error" }); break; }
          await superAdminService.bulkDeactivateUsers(ids);
          toast({ title: "Done", description: `${ids.length} users deactivated`, type: "success" });
          break;
        }
        case "activate_users": {
          const ids = parseIds(userIds);
          if (!ids.length) { toast({ title: "Enter user IDs", type: "error" }); break; }
          await superAdminService.bulkActivateUsers(ids);
          toast({ title: "Done", description: `${ids.length} users activated`, type: "success" });
          break;
        }
        case "delete_events": {
          const ids = parseIds(eventIds);
          if (!ids.length) { toast({ title: "Enter event IDs", type: "error" }); break; }
          if (!confirm(`Delete ${ids.length} events permanently?`)) break;
          await superAdminService.bulkDeleteEvents(ids);
          toast({ title: "Done", description: `${ids.length} events deleted`, type: "success" });
          setEventIds("");
          break;
        }
      }
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Layers className="h-6 w-6 text-orange-500" /> Bulk Operations
      </h1>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Warning: Bulk operations cannot be undone</p>
          <p className="text-xs text-amber-600 mt-1">Double-check IDs before executing. Deletions are permanent.</p>
        </div>
      </div>

      {/* User Bulk Operations */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" /> User Operations
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User IDs (one per line or comma-separated)
          </label>
          <textarea
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
            rows={4}
            placeholder="user_id_1&#10;user_id_2&#10;user_id_3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-200"
          />
          <p className="text-xs text-gray-500 mt-1">{parseIds(userIds).length} IDs entered</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => runAction("activate_users")} disabled={!!running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            <UserCheck className="h-4 w-4" /> {running === "activate_users" ? "Running..." : "Activate Users"}
          </button>
          <button onClick={() => runAction("deactivate_users")} disabled={!!running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50">
            <Users className="h-4 w-4" /> {running === "deactivate_users" ? "Running..." : "Deactivate Users"}
          </button>
          <button onClick={() => runAction("delete_users")} disabled={!!running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> {running === "delete_users" ? "Running..." : "Delete Users"}
          </button>
        </div>
      </div>

      {/* Event Bulk Operations */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-500" /> Event Operations
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event IDs (one per line or comma-separated)
          </label>
          <textarea
            value={eventIds}
            onChange={(e) => setEventIds(e.target.value)}
            rows={4}
            placeholder="event_id_1&#10;event_id_2&#10;event_id_3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-200"
          />
          <p className="text-xs text-gray-500 mt-1">{parseIds(eventIds).length} IDs entered</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => runAction("delete_events")} disabled={!!running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> {running === "delete_events" ? "Running..." : "Delete Events"}
          </button>
        </div>
      </div>
    </div>
  );
}
