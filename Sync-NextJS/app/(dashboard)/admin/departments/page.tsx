"use client";

import { useState, useEffect } from "react";
import { departmentService, userService } from "@/lib/services";
import { getErrorMessage, getInitials } from "@/lib/utils";
import type { Department, DepartmentMember, User } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/toaster";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
} from "lucide-react";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Members
  const [showMembers, setShowMembers] = useState<string | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [deptRes, usersRes] = await Promise.all([
        departmentService.getAll(),
        userService.getAll(),
      ]);
      setDepartments(
        Array.isArray(deptRes.data)
          ? deptRes.data
          : (deptRes.data as any).departments || [],
      );
      setAllUsers(
        usersRes.data.users ||
          (Array.isArray(usersRes.data) ? usersRes.data : []),
      );
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingDept(null);
    setForm({ name: "", description: "" });
    setShowForm(true);
  }

  function openEdit(dept: Department) {
    setEditingDept(dept);
    setForm({ name: dept.name, description: dept.description || "" });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDept) {
        await departmentService.update(editingDept.id, form);
        toast({
          title: "Updated",
          description: "Department updated",
          type: "success",
        });
      } else {
        await departmentService.create(form);
        toast({
          title: "Created",
          description: "Department created",
          type: "success",
        });
      }
      setShowForm(false);
      fetchData();
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

  async function handleDelete(dept: Department) {
    if (!confirm(`Delete "${dept.name}"?`)) return;
    try {
      await departmentService.delete(dept.id);
      toast({
        title: "Deleted",
        description: "Department deleted",
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

  async function loadMembers(deptId: string) {
    setMembersLoading(true);
    try {
      const res = await departmentService.getMembers(deptId);
      setMembers(res.data.members || []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleAddMember(userId: string) {
    if (!showMembers) return;
    try {
      await departmentService.addMember(showMembers, userId);
      toast({ title: "Added", description: "Member added", type: "success" });
      loadMembers(showMembers);
      setShowAddMember(false);
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!showMembers) return;
    try {
      await departmentService.removeMember(showMembers, userId);
      toast({
        title: "Removed",
        description: "Member removed",
        type: "success",
      });
      loadMembers(showMembers);
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading departments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-500" /> Departments
        </h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> New Department
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                {dept.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {dept.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(dept)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(dept)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Users className="h-4 w-4" /> {dept.member_count ?? 0} members
              </span>
              <button
                onClick={() => {
                  setShowMembers(dept.id);
                  loadMembers(dept.id);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Manage Members
              </button>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No departments yet</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingDept ? "Edit Department" : "Create Department"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
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
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            />
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
              {saving ? "Saving..." : editingDept ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Members Modal */}
      <Modal
        isOpen={!!showMembers}
        onClose={() => {
          setShowMembers(null);
          setShowAddMember(false);
        }}
        title="Department Members"
      >
        {membersLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <UserPlus className="h-4 w-4" /> Add Member
              </button>
            </div>

            {showAddMember && (
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                {allUsers
                  .filter((u) => !members.some((m) => m.user_id === u.id))
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAddMember(u.id)}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 text-sm"
                    >
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-semibold">
                        {getInitials(u.full_name || u.first_name)}
                      </div>
                      {u.full_name || u.email}
                    </button>
                  ))}
              </div>
            )}

            {members.length === 0 ? (
              <p className="text-center text-gray-400 py-4">No members</p>
            ) : (
              members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                      {getInitials(m.user_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user_name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-400"
                    title="Remove"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
