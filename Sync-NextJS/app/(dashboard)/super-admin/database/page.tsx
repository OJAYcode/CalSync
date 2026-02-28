"use client";

import { useState, useEffect } from "react";
import { superAdminService } from "@/lib/services";
import { getErrorMessage, formatDateTime } from "@/lib/utils";
import type { DatabaseStats } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { Database, Download, Trash2, RefreshCw, HardDrive } from "lucide-react";

export default function SuperAdminDatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionRunning, setActionRunning] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await superAdminService.getDatabaseStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBackup() {
    setActionRunning("backup");
    try {
      const res = await superAdminService.createBackup();
      toast({ title: "Backup Created", description: res.data.message || "Backup completed", type: "success" });
      fetchStats();
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    } finally {
      setActionRunning(null);
    }
  }

  async function handleCleanup() {
    if (!confirm("Run database cleanup? This may remove old/orphaned data.")) return;
    setActionRunning("cleanup");
    try {
      const res = await superAdminService.cleanupDatabase();
      toast({ title: "Cleanup Complete", description: res.data.message || "Cleanup finished", type: "success" });
      fetchStats();
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    } finally {
      setActionRunning(null);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-6 w-6 text-indigo-500" /> Database Management
        </h1>
        <button onClick={fetchStats} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: stats.total_users ?? "—", color: "blue" },
            { label: "Total Events", value: stats.total_events ?? "—", color: "purple" },
            { label: "Total Departments", value: stats.total_departments ?? "—", color: "green" },
            { label: "Database Size", value: stats.database_size || "—", color: "amber" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Collections / Tables */}
      {stats?.collections && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-gray-400" /> Collections
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(stats.collections).map(([name, info]: [string, any]) => (
              <div key={name} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900 font-mono">{name}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {typeof info === "object" ? (
                    <>
                      <span>{info.count ?? info.documents ?? "—"} docs</span>
                      {info.size && <span>{info.size}</span>}
                    </>
                  ) : (
                    <span>{info} docs</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleBackup} disabled={!!actionRunning}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <Download className="h-4 w-4" />
            {actionRunning === "backup" ? "Creating Backup..." : "Create Backup"}
          </button>
          <button onClick={handleCleanup} disabled={!!actionRunning}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
            <Trash2 className="h-4 w-4" />
            {actionRunning === "cleanup" ? "Cleaning Up..." : "Cleanup Database"}
          </button>
        </div>
      </div>

      {/* Last backup info */}
      {stats?.last_backup && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Last Backup</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTime(stats.last_backup)}</p>
        </div>
      )}
    </div>
  );
}
