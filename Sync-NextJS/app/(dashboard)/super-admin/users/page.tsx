"use client";

import { useState, useEffect } from "react";
import { superAdminService } from "@/lib/services";
import {
  getErrorMessage,
  getRoleBadgeColor,
  getRoleLabel,
  getInitials,
  formatDateTime,
} from "@/lib/utils";
import type { User } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/toaster";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Create/Edit
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "employee" as string,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await superAdminService.getUsers({
        page,
        per_page: 20,
        search: search || undefined,
      });
      const allUsers =
        res.data.users || (Array.isArray(res.data) ? res.data : []);
      setUsers(allUsers);
      setTotal(res.data.total || allUsers.length);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingUser(null);
    setForm({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "employee",
    });
    setShowForm(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setForm({
      email: u.email,
      password: "",
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const data: Record<string, string> = {
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
        };
        if (form.email !== editingUser.email) data.email = form.email;
        await superAdminService.updateUser(editingUser.id, data as any);
        toast({ title: "Updated", type: "success" });
      } else {
        await superAdminService.createUser({
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
        });
        toast({
          title: "Created",
          description: "User created",
          type: "success",
        });
      }
      setShowForm(false);
      fetchUsers();
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

  async function handleDelete(u: User) {
    if (!confirm(`Delete user ${u.email}?`)) return;
    try {
      await superAdminService.deleteUser(u.id);
      toast({ title: "Deleted", type: "success" });
      fetchUsers();
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
          <Users className="h-6 w-6 text-blue-500" /> All Users
        </h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Create User
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    User
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                          {getInitials(u.full_name || u.first_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {u.full_name || `${u.first_name} ${u.last_name}`}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(u.role)}`}
                      >
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {u.department || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium ${u.is_active ? "text-green-600" : "text-red-500"}`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {u.created_at ? formatDateTime(u.created_at) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">{total} total users</span>
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
                disabled={users.length < 20}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingUser ? "Edit User" : "Create User"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingUser ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
