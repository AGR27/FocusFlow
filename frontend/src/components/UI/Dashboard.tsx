// components/Dashboard.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext'; // Import AuthContext hook
import PomoTimer from '@/components/PomoTimer/PomoTimer'; // Import the PomoTimer component
import TaskCard from '@/components/tasks/TaskCard'; // Import the TaskCard component
import Modal from '@/components/UI/Modal'; // Import the Modal component for messages/confirmations
import { supabase } from '@/lib/supabaseClient'; // Corrected import path to match user's existing files
import { TaskItem, ClassItem } from "@/types";
import { useTimer } from '@/contexts/TimerContext';
import AddTaskForm from '@/components/tasks/AddTaskForm';
import { Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth(); // Get user and loading state from AuthContext
  const { timerState } = useTimer();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentModalMessage, setCurrentModalMessage] = useState<string | null>(null); // For custom modals
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

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
        // Fetch classes for the task form
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('user_id', user.id); // Filter by the current user's ID

        if (classError) throw classError;
        setClasses(classData || []);

        // Fetch tasks associated with the current user, ordered by due date_time
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id) // Filter by the current user's ID
          .order('due_date_time', { ascending: true }); // Sort by due_date_time to match Tasks page

        if (taskError) throw taskError;

        setTasks(taskData || []);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData(); // Call fetchData when user or authLoading changes
  }, [user, authLoading]);

  // Task handling functions
  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setShowAddTaskForm(true);
  };
  
  const handleDeleteTask = (taskId: string) => {
    setCurrentModalMessage(`Deleting tasks is handled on the "Tasks" page.`);
    console.log('Delete task from dashboard:', taskId);
  };

  const handleSaveTask = async (taskData: Omit<TaskItem, 'user_id'>) => {
    if (!user) return;

    try {
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({
            name: taskData.name,
            class_id: taskData.class_id,
            due_date_time: taskData.due_date_time,
            priority: taskData.priority,
            type: taskData.type,
          })
          .eq('id', editingTask.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new task
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            name: taskData.name,
            class_id: taskData.class_id,
            due_date_time: taskData.due_date_time,
            priority: taskData.priority,
            type: taskData.type,
          });

        if (error) throw error;
      }

      // Refresh tasks list
      const { data: refreshedTasks, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date_time', { ascending: true });

      if (taskError) throw taskError;
      setTasks(refreshedTasks || []);

      // Close form
      setShowAddTaskForm(false);
      setEditingTask(null);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        
        {/* Pomodoro Timer - Exact Copy */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          <PomoTimer />
        </div>

      </div>

      {/* Right Column: Upcoming Tasks & Recent Activity Placeholder */}
      <div className="md:w-1/2 space-y-8">
        {/* Upcoming Tasks Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Upcoming Tasks</h3>
              <button
                onClick={() => setShowAddTaskForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors transform hover:scale-105 shadow-md"
              >
                Add New Task
              </button>
            </div>
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
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-4">No upcoming tasks. Time to add some!</p>
              <Link href="/tasks">
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors transform hover:scale-105 shadow-md">
                  Create Your First Task
                </button>
              </Link>
            </div>
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

      {/* Add Task Modal */}
      {showAddTaskForm && (
        <Modal onClose={() => { setShowAddTaskForm(false); setEditingTask(null); }}>
          <AddTaskForm
            onSave={handleSaveTask}
            onCancel={() => { setShowAddTaskForm(false); setEditingTask(null); }}
            classes={classes}
            isEditing={!!editingTask}
            taskItem={editingTask}
          />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
