"use client";

import { useState, useEffect } from "react";
import { notificationService } from "@/lib/services";
import {
  isPushSupported,
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-notifications";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  BellRing,
  Info,
  Calendar,
  Users,
  MessageSquare,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
    checkPushStatus();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res =
        filter === "unread"
          ? await notificationService.getUnread()
          : await notificationService.getAll();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkPushStatus() {
    setPushSupported(isPushSupported());
    if (isPushSupported()) {
      const subscribed = await isPushSubscribed();
      setPushSubscribed(subscribed);
    }
  }

  async function togglePush() {
    setPushLoading(true);
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush();
        setPushSubscribed(false);
        toast({
          title: "Disabled",
          description: "Push notifications disabled",
          type: "info",
        });
      } else {
        const success = await subscribeToPush();
        if (success) {
          setPushSubscribed(true);
          toast({
            title: "Enabled",
            description: "Push notifications enabled!",
            type: "success",
          });
        } else {
          toast({
            title: "Error",
            description: "Could not enable push notifications",
            type: "error",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setPushLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({ title: "Done", description: "All marked as read", type: "success" });
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    }
  }

  async function sendTestNotification() {
    try {
      await notificationService.sendTest();
      toast({
        title: "Sent",
        description: "Test notification sent!",
        type: "success",
      });
    } catch (err) {
      toast({ title: "Error", description: getErrorMessage(err), type: "error" });
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "event_created":
      case "event_updated":
      case "event_deleted":
      case "event_reminder":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "rsvp_update":
      case "meeting_invite":
        return <Users className="h-5 w-5 text-purple-500" />;
      case "feed_post":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pushSupported && (
            <button
              onClick={togglePush}
              disabled={pushLoading}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition
                ${
                  pushSubscribed
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
            >
              {pushSubscribed ? (
                <>
                  <BellRing className="h-4 w-4" /> Push On
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4" /> Enable Push
                </>
              )}
            </button>
          )}
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
          >
            <CheckCheck className="h-4 w-4" /> Read All
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setTimeout(fetchNotifications, 0);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              filter === f
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 transition ${
                  !n.is_read ? "bg-blue-50/40" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      !n.is_read ? "font-semibold text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 rounded hover:bg-blue-100 text-blue-500"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Push */}
      {pushSubscribed && (
        <div className="text-center">
          <button
            onClick={sendTestNotification}
            className="text-sm text-blue-600 hover:underline"
          >
            Send a test push notification
          </button>
        </div>
      )}
    </div>
  );
}
