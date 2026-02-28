"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { feedService, departmentService } from "@/lib/services";
import { formatDateTime, getErrorMessage, getInitials } from "@/lib/utils";
import type { FeedPost, FeedComment, Department } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/toaster";
import { MessageSquare, Heart, Send, Plus, Filter } from "lucide-react";

export default function FeedsPage() {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState<FeedPost[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    department_id: "",
  });
  const [creating, setCreating] = useState(false);

  // Comments
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  async function fetchData() {
    setLoading(true);
    try {
      const [feedRes, deptRes] = await Promise.all([
        selectedDept === "all"
          ? feedService.getAll()
          : feedService.getByDepartment(selectedDept),
        departmentService.getAll(),
      ]);
      setFeeds(feedRes.data.feeds || []);
      setDepartments(
        Array.isArray(deptRes.data)
          ? deptRes.data
          : (deptRes.data as any).departments || [],
      );
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;
    setCreating(true);
    try {
      await feedService.create({
        title: newPost.title,
        content: newPost.content,
        department_id: newPost.department_id || undefined,
      });
      toast({
        title: "Success",
        description: "Post created!",
        type: "success",
      });
      setShowCreate(false);
      setNewPost({ title: "", content: "", department_id: "" });
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleLike(id: string) {
    try {
      await feedService.like(id);
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                is_liked: !f.is_liked,
                likes_count: f.is_liked ? f.likes_count - 1 : f.likes_count + 1,
              }
            : f,
        ),
      );
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  async function loadComments(feedId: string) {
    try {
      const res = await feedService.getComments(feedId);
      setComments((prev) => ({ ...prev, [feedId]: res.data.comments || [] }));
    } catch {
      // silently fail
    }
  }

  async function handleComment(feedId: string) {
    if (!newComment.trim()) return;
    try {
      await feedService.comment(feedId, newComment);
      setNewComment("");
      loadComments(feedId);
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === feedId ? { ...f, comments_count: f.comments_count + 1 } : f,
        ),
      );
    } catch (err) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  }

  function toggleComments(feedId: string) {
    if (commentOpen === feedId) {
      setCommentOpen(null);
    } else {
      setCommentOpen(feedId);
      if (!comments[feedId]) loadComments(feedId);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Department Feeds</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <button
          onClick={() => setSelectedDept("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
            selectedDept === "all"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => setSelectedDept(dept.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedDept === dept.id
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner />
        </div>
      ) : feeds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    {getInitials(feed.author_name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {feed.author_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(feed.created_at)}
                      {feed.department_name && ` · ${feed.department_name}`}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-gray-900 mb-1">
                  {feed.title}
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {feed.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => handleLike(feed.id)}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium transition ${
                    feed.is_liked
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${feed.is_liked ? "fill-current" : ""}`}
                  />
                  {feed.likes_count}
                </button>
                <button
                  onClick={() => toggleComments(feed.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-500 transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  {feed.comments_count}
                </button>
              </div>

              {/* Comments */}
              {commentOpen === feed.id && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
                  {comments[feed.id]?.map((c) => (
                    <div key={c.id} className="flex gap-2 mb-3">
                      <div className="h-7 w-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {getInitials(c.user_name)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          {c.user_name}{" "}
                          <span className="text-gray-400 font-normal">
                            · {formatDateTime(c.created_at)}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-200"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleComment(feed.id);
                      }}
                    />
                    <button
                      onClick={() => handleComment(feed.id)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Post"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              value={newPost.title}
              onChange={(e) =>
                setNewPost((p) => ({ ...p, title: e.target.value }))
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={newPost.content}
              onChange={(e) =>
                setNewPost((p) => ({ ...p, content: e.target.value }))
              }
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department (optional)
            </label>
            <select
              value={newPost.department_id}
              onChange={(e) =>
                setNewPost((p) => ({ ...p, department_id: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Post"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
