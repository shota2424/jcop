// ============================================================
// JCOP v4.0 - Type Definitions
// ============================================================

// ---------- Members ----------
export type MemberPosition = '正副' | '理事会' | '一般';

export interface Member {
  name: string;
  email: string;
  role: 'admin' | 'member';
  committee: string;
  lineDisplayName: string;
  position: MemberPosition;
}

// ---------- Events ----------
export interface JCEvent {
  eventId: string;
  title: string;
  dateTime: string; // ISO 8601
  location: string;
  category: string;
  detail: string;
  documentUrl: string;
}

// ---------- Attendances ----------
export type AttendanceStatus = 0 | 1 | 2 | 3 | 4;
// 0 = 未回答, 1 = ○(出席), 2 = △(未定), 3 = ×(欠席), 4 = 遅刻

export interface Attendance {
  eventId: string;
  email: string;
  status: AttendanceStatus;
  comment: string;
  updatedAt: string; // ISO 8601
}

// ---------- Bills ----------
export type BillStatus = 'not_created' | 'in_progress' | 'submitted';

export interface Bill {
  billId: string;
  title: string;
  assigneeEmail: string;
  deadline: string;
  status: BillStatus;
  relatedEventId: string;
}

// ---------- Dashboard Stats ----------
export interface DashboardStats {
  totalMembers: number;
  upcomingEvents: number;
  pendingAttendances: number;
  pendingBills: number;
  overallAttendanceRate: number;
}

// ---------- AI Parsed Event ----------
export interface ParsedEvent {
  title: string;
  dateTime: string;
  location: string;
  category?: string;
  detail?: string;
}

// ---------- Mention ----------
export interface MentionTarget {
  name: string;
  lineDisplayName: string;
  email: string;
}

// ---------- API Response ----------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------- Session User ----------
export interface SessionUser {
  name: string;
  email: string;
  role: 'admin' | 'member';
  image?: string;
}
