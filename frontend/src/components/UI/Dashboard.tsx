// components/Dashboard.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext'; // Import AuthContext hook
import PomoTimer from '@/components/PomoTimer/PomoTimer'; // Import the PomoTimer component
import TaskCard from '@/components/tasks/TaskCard'; // Import the TaskCard component
import Modal from '@/components/UI/Modal'; // Import the Modal component for messages/confirmations
import { supabase } from '@/lib/supabaseClient'; // Corrected import path to match user's existing files
import { ClassItem, TaskItem } from "@/types";

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth(); // Get user and loading state from AuthContext
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]); // Added for potential future use or context
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentModalMessage, setCurrentModalMessage] = useState<string | null>(null); // For custom modals

  useEffect(() => {
    const fetchData = async () => {
      // If auth is still loading, do nothing
      if (authLoading) return;

      // If no user is logged in after auth loading, set loading to false and exit
      if (!user) {
        setIsLoading(false);
        setError("Please sign in to view your dashboard.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Fetch classes (even if not displayed, good to have consistent data fetching)
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('user_id', user.id); // Filter by the current user's ID

        if (classError) throw classError;
        setClasses(classData || []); // Store classes if needed for future features

        // Fetch tasks associated with the current user, ordered by due date_time
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id) // Filter by the current user's ID
          .order('due_date_time', { ascending: true }); // Sort by due_date_time to match Tasks page

        if (taskError) throw taskError;

        setTasks(taskData || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData(); // Call fetchData when user or authLoading changes
  }, [user, authLoading]);

  // Placeholder for task/class actions on the dashboard
  // These will just log for now, as full edit/delete modals are on the Tasks page
  const handleEditTask = (task: TaskItem) => {
    setCurrentModalMessage(`Editing task "${task.name}" is handled on the "Tasks" page.`);
    console.log('Edit task from dashboard:', task);
  };
  const handleDeleteTask = (taskId: string) => {
    setCurrentModalMessage(`Deleting tasks is handled on the "Tasks" page.`);
    console.log('Delete task from dashboard:', taskId);
  };

  // Filter tasks to show only a few upcoming ones for the dashboard
  const upcomingTasks = tasks.filter(task => {
    // Only show tasks that have a due_date_time and are in the future
    if (!task.due_date_time) return false;
    const dueDate = new Date(task.due_date_time);
    return dueDate > new Date(); // Compare with current date
  }).slice(0, 3); // Show top 3 upcoming tasks for a concise dashboard

  return (
    <div className="flex flex-col md:flex-row gap-8 p-8 min-h-screen bg-gray-900 text-white font-sans">
      {/* Modal for general messages/confirmation */}
      {currentModalMessage && (
        <Modal onClose={() => setCurrentModalMessage(null)}>
          <p className="text-white text-center text-lg">{currentModalMessage}</p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentModalMessage(null)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
            >
              OK
            </button>
          </div>
        </Modal>
      )}

      {/* Left Column: Welcome, Timer & Quick Actions */}
      <div className="md:w-1/2 space-y-8">
        <h2 className="text-3xl font-extrabold text-blue-400 mb-4">
          Welcome back, {user?.user_metadata?.name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'User')}!
        </h2>
        
        {/* Pomodoro Timer Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-white">Your Focus Session</h3>
            {/* Embedding the Pomodoro Timer component directly */}
            <PomoTimer />
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 border border-gray-700">
          <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
          <Link href="/tasks">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 shadow-md">
              Add New Task
            </button>
          </Link>
          <Link href="/tasks">
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105 shadow-md">
              View All Tasks
            </button>
          </Link>
          {/* Add more quick actions as your app grows, e.g., "View Calendar" */}
        </div>
      </div>

      {/* Right Column: Upcoming Tasks & Recent Activity Placeholder */}
      <div className="md:w-1/2 space-y-8">
        {/* Upcoming Tasks Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-4">Upcoming Tasks</h3>
          {isLoading ? (
            <p className="text-gray-400 text-lg">Loading tasks...</p>
          ) : error ? (
            <p className="text-red-400 text-lg">Error: {error}</p>
          ) : upcomingTasks.length > 0 ? (
            <div className="space-y-4">
              {upcomingTasks.map(task => (
                // Render a TaskCard for each upcoming task
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleEditTask} 
                  onDelete={handleDeleteTask} 
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-lg">No upcoming tasks. Time to add some!</p>
          )}
        </div>

        {/* Recent Activity & Mood Trends Placeholder Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-4">Recent Activity & Mood Trends</h3>
          <p className="text-gray-400 text-lg">
            This section will show summaries of your past focus sessions, productivity, and mood over time. (Coming Soon!)
          </p>
          {/* This area is reserved for future calendar integration or productivity graphs */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
