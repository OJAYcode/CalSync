import api from "./api";
import type {
  AuthResponse,
  SignupPayload,
  User,
  CalendarEvent,
  EventFormData,
  RSVP,
  RSVPStatus,
  Department,
  DepartmentMember,
  Notification,
  FeedPost,
  FeedComment,
  Meeting,
  DashboardStats,
  AuditLog,
  DatabaseStats,
  SystemSettings,
  AnalyticsData,
} from "./types";

// ========================
// Auth Services
// ========================
export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),

  signup: (data: SignupPayload) => api.post<AuthResponse>("/auth/signup", data),

  logout: () => api.post("/auth/logout"),

  me: () => api.get<{ user: User }>("/auth/me"),

  changePassword: (current_password: string, new_password: string) =>
    api.post("/auth/change-password", { current_password, new_password }),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),

  refreshToken: () => api.post<{ token: string }>("/auth/refresh-token"),
};

// ========================
// Event Services
// ========================
export const eventService = {
  getAll: (params?: { page?: number; per_page?: number }) =>
    api.get<{
      events: CalendarEvent[];
      total: number;
      page: number;
      per_page: number;
    }>("/events", { params }),

  getById: (id: string) => api.get<{ event: CalendarEvent }>(`/events/${id}`),

  create: (data: EventFormData) =>
    api.post<{ event: CalendarEvent; message?: string }>("/events", data),

  update: (id: string, data: Partial<EventFormData>) =>
    api.put<{ event: CalendarEvent }>(`/events/${id}`, data),

  delete: (id: string) => api.delete(`/events/${id}`),

  getUpcoming: () => api.get<{ events: CalendarEvent[] }>("/events/upcoming"),

  getCalendar: (month: number, year: number) =>
    api.get<{ events: CalendarEvent[] }>("/events/calendar", {
      params: { month, year },
    }),

  getByDate: (date: string) =>
    api.get<{ events: CalendarEvent[] }>(`/events/date/${date}`),

  rsvp: (eventId: string, status: RSVPStatus) =>
    api.post(`/events/${eventId}/rsvp`, { status }),

  getRSVPs: (eventId: string) =>
    api.get<{ rsvps: RSVP[] }>(`/events/${eventId}/rsvps`),

  search: (q: string) =>
    api.get<{ events: CalendarEvent[] }>("/events/search", { params: { q } }),

  getRecurring: () => api.get<{ events: CalendarEvent[] }>("/events/recurring"),

  getStats: () => api.get("/events/stats"),

  // Approval workflow
  getPending: () => api.get<{ events: CalendarEvent[] }>("/events/pending"),

  getMyPending: () =>
    api.get<{ events: CalendarEvent[] }>("/events/my-pending"),

  approve: (eventId: string) =>
    api.post<{ success: boolean; message: string }>(
      `/events/${eventId}/approve`,
    ),

  reject: (eventId: string, reason?: string) =>
    api.post<{ success: boolean; message: string }>(
      `/events/${eventId}/reject`,
      reason ? { reason } : {},
    ),
};

// ========================
// User Services
// ========================
export const userService = {
  getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<{ users: User[]; total: number }>("/users", { params }),

  getMe: () => api.get<{ user: User }>("/users/me"),

  getById: (id: string) => api.get<{ user: User }>(`/users/${id}`),

  update: (id: string, data: Partial<User>) =>
    api.put<{ user: User }>(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),

  updateRole: (id: string, role: string) =>
    api.put(`/users/${id}/role`, { role }),

  activate: (id: string) => api.put(`/users/${id}/activate`),

  deactivate: (id: string) => api.put(`/users/${id}/deactivate`),

  promote: (id: string) => api.post(`/users/${id}/promote`),

  demote: (id: string) => api.post(`/users/${id}/demote`),

  getAdmins: () => api.get<{ users: User[] }>("/users/admins"),

  getByDepartment: (deptId: string) =>
    api.get<{ users: User[] }>(`/users/by-department/${deptId}`),

  updateProfile: (data: Partial<User>) =>
    api.put<{ user: User }>("/users/profile", data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post<{ avatar_url: string }>("/users/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ========================
// Department Services
// ========================
export const departmentService = {
  getAll: () => api.get<Department[]>("/departments"),

  getById: (id: string) => api.get<Department>(`/departments/${id}`),

  create: (data: { name: string; description?: string; head_id?: string }) =>
    api.post<{ department: Department }>("/departments", data),

  update: (
    id: string,
    data: { name?: string; description?: string; head_id?: string },
  ) => api.put<{ department: Department }>(`/departments/${id}`, data),

  delete: (id: string) => api.delete(`/departments/${id}`),

  getMembers: (id: string) =>
    api.get<{ members: DepartmentMember[] }>(`/departments/${id}/members`),

  addMember: (deptId: string, userId: string) =>
    api.post(`/departments/${deptId}/members`, { user_id: userId }),

  removeMember: (deptId: string, userId: string) =>
    api.delete(`/departments/${deptId}/members/${userId}`),
};

// ========================
// Notification Services
// ========================
export const notificationService = {
  getAll: () => api.get<{ notifications: Notification[] }>("/notifications"),

  getUnread: () =>
    api.get<{ notifications: Notification[] }>("/notifications/unread"),

  getUnreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count"),

  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),

  markAllRead: () => api.post("/notifications/mark-all-read"),

  delete: (id: string) => api.delete(`/notifications/${id}`),

  subscribe: (subscription: PushSubscriptionJSON) =>
    api.post("/notifications/subscribe", { subscription }),

  unsubscribe: () => api.post("/notifications/unsubscribe"),

  sendTest: () => api.post("/notifications/test"),

  getVapidPublicKey: () =>
    api.get<{ public_key: string }>("/notifications/vapid-public-key"),
};

// ========================
// Feed Services
// ========================
export const feedService = {
  getAll: () => api.get<{ feeds: FeedPost[] }>("/department-feeds"),

  create: (data: { title: string; content: string; department_id?: string }) =>
    api.post<{ feed: FeedPost }>("/department-feeds", data),

  getById: (id: string) =>
    api.get<{ feed: FeedPost }>(`/department-feeds/${id}`),

  update: (id: string, data: { title?: string; content?: string }) =>
    api.put<{ feed: FeedPost }>(`/department-feeds/${id}`, data),

  delete: (id: string) => api.delete(`/department-feeds/${id}`),

  like: (id: string) => api.post(`/department-feeds/${id}/like`),

  comment: (id: string, content: string) =>
    api.post(`/department-feeds/${id}/comment`, { content }),

  getComments: (id: string) =>
    api.get<{ comments: FeedComment[] }>(`/department-feeds/${id}/comments`),

  getByDepartment: (deptId: string) =>
    api.get<{ feeds: FeedPost[] }>(`/department-feeds/department/${deptId}`),
};

// ========================
// Meeting Services
// ========================
export const meetingService = {
  create: (data: {
    title: string;
    description?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    max_participants?: number;
    department_id?: string;
  }) =>
    api.post<{
      meeting_code: string;
      meeting_id: string;
      message: string;
      join_url: string;
    }>("/meetings/create", data),

  getAll: () =>
    api.get<{ hosted_meetings: any[]; joined_meetings?: any[] }>(
      "/meetings/my-meetings",
    ),

  getById: (code: string) => api.get<{ meeting: Meeting }>(`/meetings/${code}`),

  update: (id: string, data: Partial<Meeting>) =>
    api.put<{ meeting: Meeting }>(`/meetings/${id}/update`, data),

  delete: (code: string) => api.delete(`/meetings/${code}`),

  join: (code: string) =>
    api.post<{ meeting: Meeting }>(`/meetings/${code}/join`),

  joinInfo: (code: string) =>
    api.get<{ meeting: Meeting }>(`/meetings/join/${code}`),

  end: (code: string) => api.post(`/meetings/${code}/end`),

  cancel: (code: string) => api.post(`/meetings/${code}/cancel`),

  getParticipants: (code: string) => api.get(`/meetings/${code}/participants`),

  getChat: (code: string) =>
    api.get<{ messages: any[] }>(`/meetings/${code}/chat`),

  getRecordings: (code: string) => api.get(`/meetings/${code}/recordings`),

  startRecording: (code: string) =>
    api.post(`/meetings/${code}/recording/start`),

  stopRecording: (code: string) => api.post(`/meetings/${code}/recording/stop`),

  createPoll: (code: string, data: { question: string; options: string[] }) =>
    api.post(`/meetings/${code}/poll/create`, data),

  getPolls: (code: string) => api.get(`/meetings/${code}/polls`),

  votePoll: (code: string, pollId: string, optionId: string) =>
    api.post(`/meetings/${code}/poll/${pollId}/vote`, { option_id: optionId }),

  sendReaction: (code: string, reaction: string) =>
    api.post(`/meetings/${code}/reaction`, { reaction }),

  createBreakoutRooms: (code: string, data: { rooms: number }) =>
    api.post(`/meetings/${code}/breakout-rooms/create`, data),

  getBreakoutRooms: (code: string) =>
    api.get(`/meetings/${code}/breakout-rooms`),

  assignBreakoutRoom: (
    code: string,
    data: { user_id: string; room_id: string },
  ) => api.post(`/meetings/${code}/breakout-rooms/assign`, data),
};

// ========================
// Super Admin Services
// ========================
export const superAdminService = {
  getDashboard: () => api.get<DashboardStats>("/super-admin/dashboard"),

  // Users — reuse /users endpoint
  getUsers: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<{ users: User[]; total: number }>("/users", { params }),

  createUser: (data: SignupPayload & { role?: string }) =>
    api.post<{ user: User }>("/auth/signup", data),

  updateUser: (id: string, data: Partial<User>) =>
    api.put<{ user: User }>(`/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/users/${id}`),

  // Events
  getEvents: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<{ events: CalendarEvent[]; total: number }>("/events", {
      params,
    }),

  deleteEvent: (id: string) => api.delete(`/events/${id}`),

  // Admins — dedicated super-admin endpoints
  getAdmins: () => api.get<{ admins: User[] }>("/super-admin/admins"),

  createAdmin: (data: {
    email: string;
    name: string;
    password: string;
    department?: string;
  }) => api.post<{ user: User }>("/super-admin/admins/create", data),

  promoteToAdmin: (id: string) =>
    api.post<{ user: User }>(`/users/${id}/promote`),

  promoteToSuperAdmin: (id: string) =>
    api.post<{ user: User }>(`/super-admin/admins/${id}/promote-super`),

  demoteFromSuperAdmin: (id: string) =>
    api.post<{ user: User }>(`/super-admin/admins/${id}/demote-super`),

  removeAdmin: (id: string) => api.delete(`/super-admin/admins/${id}`),

  // Audit
  getAuditLogs: (params?: {
    page?: number;
    per_page?: number;
    action?: string;
  }) =>
    api.get<{ logs: AuditLog[]; total: number }>("/super-admin/audit-logs", {
      params,
    }),

  searchAuditLogs: (params?: {
    query?: string;
    action?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  }) =>
    api.get<{ logs: AuditLog[]; total: number }>(
      "/super-admin/audit-logs/search",
      { params },
    ),

  exportAuditLogs: (params?: { format?: string }) =>
    api.get("/super-admin/audit-logs/export", { params, responseType: "blob" }),

  // Bulk Operations
  bulkDeleteUsers: (user_ids: string[]) =>
    api.post("/super-admin/bulk/delete-users", { user_ids }),

  bulkDeactivateUsers: (user_ids: string[]) =>
    api.post("/super-admin/bulk/deactivate-users", { user_ids }),

  bulkActivateUsers: (user_ids: string[]) =>
    api.post("/super-admin/bulk/activate-users", { user_ids }),

  bulkDeleteEvents: (event_ids: string[]) =>
    api.post("/super-admin/bulk/delete-events", { event_ids }),

  // Database
  getDatabaseStats: () => api.get<DatabaseStats>("/super-admin/database/stats"),

  createBackup: () => api.post("/super-admin/database/backup"),

  restoreBackup: (data: { backup_id: string }) =>
    api.post("/super-admin/database/restore", data),

  cleanupDatabase: () => api.post("/super-admin/database/cleanup"),

  // Settings
  getSettings: () =>
    api.get<{ settings: SystemSettings }>("/super-admin/settings"),

  updateSettings: (data: Partial<SystemSettings>) =>
    api.put("/super-admin/settings", data),

  updateSetting: (key: string, value: any) =>
    api.put(`/super-admin/settings/${key}`, { value }),

  // Analytics
  getAnalytics: (params?: { period?: string }) =>
    api.get<AnalyticsData>("/super-admin/analytics", { params }),

  getAnalyticsOverview: (params?: { period?: string }) =>
    api.get("/super-admin/analytics/overview", { params }),

  getAnalyticsUsers: (params?: { period?: string }) =>
    api.get("/super-admin/analytics/users", { params }),

  getAnalyticsEvents: (params?: { period?: string }) =>
    api.get("/super-admin/analytics/events", { params }),

  getAnalyticsNotifications: (params?: { period?: string }) =>
    api.get("/super-admin/analytics/notifications", { params }),
};
