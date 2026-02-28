"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { userService, departmentService } from "@/lib/services";
import {
  getErrorMessage,
  getRoleBadgeColor,
  getRoleLabel,
  getInitials,
} from "@/lib/utils";
import type { User, Department } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/toaster";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
      ]);
      setUsers(
        usersRes.data.users ||
          (Array.isArray(usersRes.data) ? usersRes.data : []),
      );
      setDepartments(
        Array.isArray(deptsRes.data)
          ? deptsRes.data
          : (deptsRes.data as any).departments || [],
      );
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(u: User) {
    try {
      if (u.is_active) {
        await userService.deactivate(u.id);
      } else {
        await userService.activate(u.id);
      }
      toast({
        title: "Success",
        description: `User ${u.is_active ? "deactivated" : "activated"}`,
        type: "success",
      });
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  async function handleRoleChange() {
    if (!actionUser || !newRole) return;
    try {
      await userService.updateRole(actionUser.id, newRole);
      toast({
        title: "Success",
        description: `Role changed to ${newRole}`,
        type: "success",
      });
      setShowRoleModal(false);
      setActionUser(null);
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-500" /> Manage Users
        </h1>
        <span className="text-sm text-gray-500">{users.length} users</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Roles</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Department
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
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
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getRoleBadgeColor(u.role)}`}
                    >
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        u.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {u.department || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {currentUser?.role === "super_admin" && (
                        <button
                          onClick={() => {
                            setActionUser(u);
                            setNewRole(u.role);
                            setShowRoleModal(true);
                          }}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
                          title="Change role"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`p-1.5 rounded ${
                          u.is_active
                            ? "hover:bg-red-50 text-red-500"
                            : "hover:bg-green-50 text-green-500"
                        }`}
                        title={u.is_active ? "Deactivate" : "Activate"}
                      >
                        {u.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No users match the filter
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={`Change Role: ${actionUser?.full_name}`}
        size="sm"
      >
        <div className="space-y-4">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowRoleModal(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleRoleChange}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Role
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
