// src/types/index.ts

export interface ClassItem {
  id: string;
  name: string;
  user_id: string; // Crucial for Supabase RLS
  subject?: string | null; // Optional subject or course code
  meeting_times?: string; // Optional: e.g., "MWF 10:00 AM"
  location?: string;      // Optional: e.g., "Zoom" or "Building A, Room 302"
  // Add other class attributes like 'reminders' here as needed
}

// Make sure to EXPORT your interfaces
export interface TaskItem {
  id: string;
  name: string;
  due_date?: string | null; // e.g., "YYYY-MM-DD"
  class_id: string | null; // Null for miscellaneous tasks
  user_id: string; // Crucial for Supabase RLS
  priority: 'low' | 'medium' | 'high'; // New attribute
  task_type: 'Assignment' | 'Quiz' | 'Exam' | 'Project' | 'Other'; // New attribute
  // Add other task attributes as needed
}