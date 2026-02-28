"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { userService, authService } from "@/lib/services";
import {
  getErrorMessage,
  getRoleBadgeColor,
  getRoleLabel,
  getInitials,
} from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { Camera, Save, Lock, Mail, User, Building2 } from "lucide-react";

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    timezone:
      user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateProfile(profile);
      const updated = res.data.user;
      if (updated) {
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }
      toast({
        title: "Success",
        description: "Profile updated",
        type: "success",
      });
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await userService.uploadAvatar(file);
      await refreshUser();
      toast({
        title: "Success",
        description: "Avatar updated",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        type: "error",
      });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(
        passwordForm.current_password,
        passwordForm.new_password,
      );
      toast({
        title: "Success",
        description: "Password changed",
        type: "success",
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {/* Avatar & Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                {getInitials(user.full_name || user.first_name)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50"
            >
              <Camera className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user.full_name}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
            <span
              className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}
            >
              {getRoleLabel(user.role)}
            </span>
            {user.department && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building2 className="h-3.5 w-3.5" /> {user.department}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" /> Edit Profile
          </h2>
        </div>
        <form onSubmit={handleProfileSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                value={profile.first_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, first_name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                value={profile.last_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, last_name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              value={profile.phone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={profile.timezone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, timezone: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />{" "}
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-400" /> Change Password
          </h2>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  current_password: e.target.value,
                }))
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    new_password: e.target.value,
                  }))
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    confirm_password: e.target.value,
                  }))
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              <Lock className="h-4 w-4" />{" "}
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
