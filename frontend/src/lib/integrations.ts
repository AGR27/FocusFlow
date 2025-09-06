// src/lib/integrations.ts

import { TaskItem } from '@/types';

// --- Google Classroom Integration ---
export const initiateGoogleClassroomAuth = () => {
  // This will redirect to your backend API route that handles Google OAuth.
  // Your backend will then redirect to Google for user consent.
  window.location.href = '/api/google-classroom/auth';
};

export const fetchGoogleClassroomTasks = async (): Promise<TaskItem[]> => {
  try {
    const response = await fetch('/api/google-classroom/tasks'); // Call your backend API route
    const data = await response.json();
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch Google Classroom tasks.');
    }

    const googleClassroomTasks = data.tasks || [];
    
    // Map Google Classroom task structure to your TaskItem structure
    // This is a simplified example; actual mapping will depend on Google's API response.
    const mappedTasks: TaskItem[] = googleClassroomTasks.map((gcTask: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const task = gcTask as any;
      return {
        id: crypto.randomUUID(), // Google's assignment ID
        name: task.name,
        due_date_time: task.dueDate ? new Date(task.dueDate.year, task.dueDate.month - 1, task.dueDate.day).toISOString() : null,
        class_id: null, // You'd need a more complex mapping to link to your internal class_id
        user_id: '', // Will be filled by your Supabase RLS policies or backend
        priority: 'medium', // Default priority, or try to infer from GC data
        type: 'Assignment', // Default type, or try to infer
        source: 'google-classroom',
        source_id: task.id,
        source_url: task.alternateLink,
      };
    });
    return mappedTasks;
  } catch (error) {
    console.error('Error fetching Google Classroom tasks:', error);
    throw error;
  }
};

// --- Canvas LMS Integration ---
export const initiateCanvasAuth = () => {
  // This will redirect to your backend API route that handles Canvas OAuth.
  // Your backend will then redirect to Canvas for user consent.
  // NOTE: Canvas OAuth requires the Canvas instance URL (e.g., "canvas.instructure.com")
  // You might need to pass this or have it configured on your backend.
  window.location.href = '/api/canvas/auth';
};

// export const fetchCanvasLmsTasks = async (): Promise<TaskItem[]> => {
//   try {
//     const response = await fetch('/api/canvas/tasks'); // Call your backend API route
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to fetch Canvas tasks.');
//     }
//     const data = await response.json();
//     const canvasLmsTasks = data.tasks || [];

//     // Map Canvas task structure to your TaskItem structure
//     // This is a simplified example; actual mapping will depend on Canvas's API response.
//     const mappedTasks: TaskItem[] = canvasLmsTasks.map((canvasAssignment: unknown) => {
//       const assignment = canvasAssignment as { id: string | number; name: string; due_at?: string; html_url?: string };
//       return {
//         id: assignment.id.toString(), // Canvas IDs can be numbers, ensure string
//         name: assignment.name,
//         // Canvas due_at is already ISO 8601, perfect for timestampz
//         due_date_time: assignment.due_at || null,
//         class_id: null, // You'd need a more complex mapping to link to your internal class_id
//         user_id: '', // Will be filled by your Supabase RLS policies or backend
//         priority: 'medium', // Default priority, or try to infer
//         type: 'Assignment', // Default type, or try to infer
//         source: 'canvas',
//         source_id: assignment.id.toString(),
//         source_url: assignment.html_url,
//       };
//     });
//     return mappedTasks;
//   } catch (error) {
//     console.error('Error fetching Canvas tasks:', error);
//     throw error;
//   }
// };