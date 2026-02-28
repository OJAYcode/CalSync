"use client";

import { useState, useEffect } from "react";
import { superAdminService } from "@/lib/services";
import { getErrorMessage } from "@/lib/utils";
import type { SystemSettings, AnalyticsData } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { Settings, Save, BarChart3 } from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [settingsRes, analyticsRes] = await Promise.allSettled([
        superAdminService.getSettings(),
        superAdminService.getAnalytics(),
      ]);
      if (settingsRes.status === "fulfilled") {
        setSettings(settingsRes.value.data.settings || settingsRes.value.data || {});
      }
      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await superAdminService.updateSettings(settings);
      toast({ title: "Settings saved", type: "success" });
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: any) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;

  const settingEntries = Object.entries(settings);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Settings className="h-6 w-6 text-gray-500" /> System Settings
      </h1>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {settingEntries.length > 0 ? (
          <>
            {settingEntries.map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
                {typeof value === "boolean" ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateSetting(key, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-600">{value ? "Enabled" : "Disabled"}</span>
                  </label>
                ) : typeof value === "number" ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateSetting(key, Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
                  />
                )}
              </div>
            ))}
            <div className="pt-2">
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">No system settings configured yet.</p>
        )}
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" /> Analytics Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.events_this_month != null && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">Events This Month</p>
                <p className="text-xl font-bold text-purple-900">{analytics.events_this_month}</p>
              </div>
            )}
            {analytics.new_users_this_month != null && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">New Users This Month</p>
                <p className="text-xl font-bold text-blue-900">{analytics.new_users_this_month}</p>
              </div>
            )}
            {analytics.active_users != null && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Active Users</p>
                <p className="text-xl font-bold text-green-900">{analytics.active_users}</p>
              </div>
            )}
            {analytics.total_meetings != null && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-600 font-medium">Total Meetings</p>
                <p className="text-xl font-bold text-amber-900">{analytics.total_meetings}</p>
              </div>
            )}
          </div>

          {/* User signups trend */}
          {analytics.user_signups_by_month && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">User Signups by Month</h3>
              <div className="flex items-end gap-1 h-32">
                {Object.entries(analytics.user_signups_by_month).slice(-12).map(([month, count]) => {
                  const max = Math.max(...Object.values(analytics.user_signups_by_month as Record<string, number>).map(Number));
                  const h = max > 0 ? (Number(count) / max) * 100 : 0;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-blue-400 rounded-t" style={{ height: `${h}%`, minHeight: count ? 4 : 0 }} />
                      <span className="text-[9px] text-gray-400 truncate w-full text-center">{month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Events by category */}
          {analytics.events_by_category && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Events by Category</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.events_by_category).map(([cat, count]) => (
                  <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {cat}: {String(count)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
