// src/types.ts

export interface TaskItem {
  id: string;
  name: string;
  due_date_time: string | null;
  class_id: string | null;
  user_id: string;
  priority: 'low' | 'medium' | 'high' | 'asap';
  type: 'Assignment' | 'Quiz' | 'Exam' | 'Project' | 'Other';
  source?: string;
  source_id?: string;
  source_url?: string;
  time_goal?: number;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface ClassItem {
  id: string;
  name: string;
  subject?: string;
  meeting_times?: string;
  location?: string;
  user_id: string;
  source?: string;
  source_id?: string;
  source_url?: string;
}

export interface SessionItem {
  id: string;
  session_minutes: number;
  focus_minutes: number;
  prod_level: number;
  mood_x: number;
  mood_y: number;
  break_activity?: string | null;
  break_satisfaction: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  // Additional fields that might be used in sessions page
  task?: string;
  class?: string;
  duration_minutes?: number;
  is_productive?: boolean;
}

export interface SessionTask {
  id: string;
  session_id: string;
  task_id: string;
  user_id: string;
  task_time: number;
  created_at?: string;
  updated_at?: string;
  task?: TaskItem;
}
