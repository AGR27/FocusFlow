// src/types/index.ts

export interface ClassItem {
  id?: string | null; // Optional ID for existing classes, null for new ones
  name: string;
  user_id: string; // Crucial for Supabase RLS
  subject?: string | null; // Optional subject or course code
  meeting_times?: string; // Optional: e.g., "MWF 10:00 AM"
  location?: string;      // Optional: e.g., "Zoom" or "Building A, Room 302"
  source?: 'google_classroom' | 'canvas' | 'manual';
  source_id?: string;
  source_url?: string; // Link back to the original class (e.g., in Google Classroom)
  // Add other class attributes like 'reminders' here as needed
}

// Make sure to EXPORT your interfaces
export interface TaskItem {
  id?: string;
  name: string;
  due_date_time?: string | null; // ISO string for date and time
  class_id: string | null; // Null for miscellaneous tasks
  user_id: string; // Crucial for Supabase RLS
  priority: 'low' | 'medium' | 'high' | 'asap'; // New attribute
  type: 'Assignment' | 'Quiz' | 'Exam' | 'Project' | 'Other'; // New attribute
  source?: 'google-classroom' | 'canvas' | 'manual'; // Optional source or reference link
  source_id?: string; // Original ID from Google Classroom/Canvas for unique tracking
  source_url?: string; // Link back to the original task (e.g., in Google Classroom)
}

export interface MeetingTime {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string; // e.g., "10:00 AM", "14:30"
}

export interface SessionItem {
  id: string;
  user_id: string;
  created_at: string;
  prod_level: number;
  mood_x: number;
  mood_y: number;
  session_minutes: number;
  focus_minutes: number;
  break_activity: string | null;
  break_satisfactoin: number | null;
}