"use client";

import { useState, useEffect } from "react";
import { superAdminService } from "@/lib/services";
import { getErrorMessage, formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ScrollText, Search, Filter } from "lucide-react";

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await superAdminService.getAuditLogs({
        page,
        per_page: 30,
        action: actionFilter || undefined,
      });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const actionTypes = [
    "login",
    "logout",
    "create_user",
    "update_user",
    "delete_user",
    "create_event",
    "update_event",
    "delete_event",
    "create_department",
    "update_department",
    "delete_department",
    "role_change",
    "backup",
    "cleanup",
  ];

  function getActionColor(action: string) {
    if (action.includes("delete")) return "bg-red-100 text-red-700";
    if (action.includes("create")) return "bg-green-100 text-green-700";
    if (action.includes("update") || action.includes("change"))
      return "bg-yellow-100 text-yellow-700";
    if (action.includes("login")) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-amber-500" /> Audit Logs
        </h1>
        <span className="text-sm text-gray-500">{total} entries</span>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, i) => (
              <div key={log.id || i} className="px-5 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}
                    >
                      {log.action?.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm text-gray-900">
                      {log.description || log.details || "—"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {log.timestamp ? formatDateTime(log.timestamp) : "—"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                  {log.user_email && <span>User: {log.user_email}</span>}
                  {log.ip_address && <span>IP: {log.ip_address}</span>}
                  {log.target_type && <span>Target: {log.target_type}</span>}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-gray-500 py-10">
                No audit logs found
              </p>
            )}
          </div>
        )}

        {total > 30 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">{total} entries</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={logs.length < 30}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
