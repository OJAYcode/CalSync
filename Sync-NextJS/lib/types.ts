// ============================
// User & Auth Types
// ============================
export type UserRole = "employee" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_admin?: boolean;
  is_super_admin?: boolean;
  department?: string;
  department_id?: string;
  avatar_url?: string;
  phone?: string;
  timezone?: string;
  created_at?: string;
  last_login?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  department_id?: string;
  department?: string;
  role?: string;
}

// ============================
// Event Types
// ============================
export type EventCategory =
  | "meeting"
  | "deadline"
  | "reminder"
  | "social"
  | "training"
  | "other";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type RSVPStatus = "attending" | "declined" | "maybe" | "pending";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
  category: EventCategory;
  is_all_day: boolean;
  recurrence: RecurrenceType;
  recurrence_end?: string;
  created_by: string;
  creator_name?: string;
  department_id?: string;
  department_name?: string;
  attendees?: string[];
  invited_users?: string[];
  color?: string;
  is_private: boolean;
  meeting_link?: string;
  created_at?: string;
  updated_at?: string;
  approval_status?: "approved" | "pending" | "rejected";
  rejection_reason?: string;
  rsvp_status?: RSVPStatus;
  rsvp_counts?: { attending: number; declined: number; maybe: number };
}

export interface EventFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  category: EventCategory;
  is_all_day: boolean;
  recurrence: RecurrenceType;
  recurrence_end?: string;
  department_id?: string;
  attendees?: string[];
  color?: string;
  is_private: boolean;
  meeting_link?: string;
}

export interface RSVP {
  id: string;
  user_id: string;
  user_name: string;
  event_id: string;
  status: RSVPStatus;
  created_at: string;
}

// ============================
// Department Types
// ============================
export interface Department {
  id: string;
  name: string;
  description?: string;
  head_id?: string;
  head_name?: string;
  member_count?: number;
  created_at?: string;
}

export interface DepartmentMember {
  id: string;
  user_id: string;
  user_name: string;
  email: string;
  role: UserRole;
}

// ============================
// Notification Types
// ============================
export type NotificationType =
  | "event_created"
  | "event_updated"
  | "event_deleted"
  | "event_reminder"
  | "rsvp_update"
  | "meeting_invite"
  | "feed_post"
  | "system"
  | "admin";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

// ============================
// Feed Types
// ============================
export interface FeedPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  department_id?: string;
  department_name?: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FeedComment {
  id: string;
  feed_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

// ============================
// Meeting / Video Types
// ============================
export type MeetingStatus = "scheduled" | "active" | "ended" | "cancelled";

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  host_name?: string;
  meeting_code: string;
  status: MeetingStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  participants?: MeetingParticipant[];
  participant_count?: number;
  max_participants?: number;
  is_recorded?: boolean;
  created_at: string;
}

export interface MeetingParticipant {
  user_id: string;
  user_name: string;
  joined_at: string;
  left_at?: string;
  is_audio_on: boolean;
  is_video_on: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  sender_name?: string;
  message: string;
  timestamp: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  created_by: string;
  is_active: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
}

// ============================
// Super Admin Types
// ============================
export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_events: number;
  total_departments: number;
  total_admins: number;
  recent_signups: number;
  events_this_month: number;
  active_meetings?: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  description?: string;
  details?: string;
  target_type?: string;
  ip_address?: string;
  timestamp?: string;
  created_at: string;
}

export interface DatabaseStats {
  total_users: number;
  total_events: number;
  total_departments: number;
  total_notifications: number;
  total_feeds: number;
  total_meetings: number;
  db_size?: string;
  database_size?: string;
  last_backup?: string;
  collections?: Record<string, any>;
}

export interface SystemSettings {
  site_name: string;
  maintenance_mode: boolean;
  allow_signups: boolean;
  max_events_per_user: number;
  default_timezone: string;
  notification_enabled: boolean;
  meeting_enabled: boolean;
  [key: string]: unknown;
}

export interface AnalyticsData {
  user_growth: { date: string; count: number }[];
  event_trends: { date: string; count: number }[];
  department_distribution: { name: string; count: number }[];
  active_users_trend: { date: string; count: number }[];
  category_breakdown: { category: string; count: number }[];
  events_this_month?: number;
  new_users_this_month?: number;
  active_users?: number;
  total_meetings?: number;
  user_signups_by_month?: Record<string, number>;
  events_by_category?: Record<string, number>;
}

// ============================
// API Response Wrappers
// ============================
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}
