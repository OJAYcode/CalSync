"use client";

import { useState, useEffect } from "react";
import { superAdminService } from "@/lib/services";
import {
  getErrorMessage,
  getRoleBadgeColor,
  getRoleLabel,
  getInitials,
} from "@/lib/utils";
import type { User } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/toaster";
import { ShieldCheck, Plus, Trash2, Search } from "lucide-react";

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPromote, setShowPromote] = useState(false);
  const [promoteForm, setPromoteForm] = useState({
    user_id: "",
    role: "admin",
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await superAdminService.getAdmins();
      const adminList =
        res.data.admins || (Array.isArray(res.data) ? res.data : []);
      setAdmins(adminList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openPromote() {
    try {
      const res = await superAdminService.getUsers({ per_page: 200 });
      const users = (
        res.data.users || (Array.isArray(res.data) ? res.data : [])
      ).filter((u: User) => u.role === "employee");
      setAllUsers(users);
    } catch {}
    setShowPromote(true);
  }

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (promoteForm.role === "super_admin") {
        await superAdminService.promoteToSuperAdmin(promoteForm.user_id);
      } else {
        await superAdminService.promoteToAdmin(promoteForm.user_id);
      }
      toast({
        title: "Promoted",
        description: "User promoted to admin",
        type: "success",
      });
      setShowPromote(false);
      fetchAdmins();
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

  async function handleRemoveAdmin(u: User) {
    if (!confirm(`Remove admin privileges from ${u.email}?`)) return;
    try {
      await superAdminService.removeAdmin(u.id);
      toast({
        title: "Removed",
        description: "Admin privileges removed",
        type: "success",
      });
      fetchAdmins();
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-green-500" /> Admin Management
        </h1>
        <button
          onClick={openPromote}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus className="h-4 w-4" /> Promote User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {admins.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    {getInitials(u.full_name || u.first_name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {u.full_name || `${u.first_name} ${u.last_name}`}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(u.role)}`}
                  >
                    {getRoleLabel(u.role)}
                  </span>
                  {u.role !== "super_admin" && (
                    <button
                      onClick={() => handleRemoveAdmin(u)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-400"
                      title="Remove admin"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <p className="text-center text-gray-500 py-10">No admins found</p>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showPromote}
        onClose={() => setShowPromote(false)}
        title="Promote User to Admin"
      >
        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              value={promoteForm.user_id}
              onChange={(e) =>
                setPromoteForm((f) => ({ ...f, user_id: e.target.value }))
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Select --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || `${u.first_name} ${u.last_name}`} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={promoteForm.role}
              onChange={(e) =>
                setPromoteForm((f) => ({ ...f, role: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowPromote(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Promoting..." : "Promote"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
