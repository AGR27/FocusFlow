"use client";

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

//import TaskList from '@/components/Tasks/TaskList';
import AddTaskForm from '@/components/Tasks/AddTaskForm';
import AddClassForm from '@/components/Tasks/AddClassForm';
import ClassCard from '@/components/Tasks/ClassCard';
import Modal from '@/components/UI/Modal';

// Interfaces for our data types
interface ClassItem {
  id: string;
  name: string;
}

interface TaskItem {
  id: string;
  name: string;
  due_date: string | null;
  class_id: string;
}


export default function Tasks(){
  const [view, setView] = useState('home');
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
  setError(null);
  try {
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*');
    if (classError) throw classError;

    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });
    if (taskError) throw taskError;

    setClasses(classData as ClassItem[]);
    setTasks(taskData as TaskItem[]);
    
    // --- ADD THIS LOGGING ---
    console.log("Fetched Classes:", classData);
    console.log("Fetched Tasks:", taskData);
    // --- END LOGGING ---
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedTasks = classes.reduce((acc, cls) => {
    acc[cls.id] = tasks.filter(task => task.class_id === cls.id);
    return acc;
  }, {} as { [key: string]: TaskItem[] });

  const miscTasks = tasks.filter(task => !task.class_id);

  const handleClassAdded = async (newClassData: Omit<ClassItem, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to add a class.');
      return;
    }

    const classWithUser = { ...newClassData, user_id: user.id };
  
    const { error } = await supabase
      .from('classes')
      .insert([classWithUser]);

    if (error) {
      setError(error.message);
    } else {
      setShowAddClassForm(false);
      fetchData();
    }
  };  

  const handleTaskAdded = async (newTaskData: Omit<ClassItem, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to add a class.');
      return;
    }

    const taskWithUser = { ...newTaskData, user_id: user.id };

    const { error } = await supabase
      .from('tasks')
      .insert([taskWithUser]);

    if (error) {
      setError(error.message);
    } else {
      setShowAddTaskForm(false);
      fetchData();
    }
  };

  return (
    <div className="flex flex-row p-8 bg-gray-800 min-h-screen text-white font-sans">
      {/* Sidebar */}
      <div className="flex flex-col w-96 max-w-7xl bg-blue-800 rounded-lg">
        {/* Header Section */}
        <div className="flex flex-row w-full p-6  gap-3 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-white">Classes Overview</h2>
          <nav className="flex fled-grow">
            <ul className="flex flex-col gap-4">
              <li className="mb-2">
              <button
                onClick={() => setView('home')}
                className={`w-full text-left p-3 rounded-lg flex items-center transition-colors ${view === 'home' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
              >
                Home
              </button>
            </li>
              {classes.map(cls => (
                <li key={cls.id} className="text-lg font-semibold text-white">
                  <button 
                    onClick={() => setView(cls.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${view === cls.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
                  >
                    {cls.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {/* Main Content: Class Cards */}
        <div className="flex flex-col gap-8">
          {/* Render the miscellaneous tasks card first */}
          <ClassCard classItem={null} tasks={miscTasks} />
          {/* Render cards for each class */}
          
        </div>
      </div>
        
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-teal-400">My Study Planner</h1>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => setShowAddTaskForm(true)}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-500 transition-colors transform hover:scale-105"
          >
            + Add New Task
          </button>
          <button
            onClick={() => setShowAddClassForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-500 transition-colors transform hover:scale-105"
          >
            + Add New Class
          </button>
        </div>

        {/* Conditional Rendering for Loading and Error */}
        {isLoading && <p className="text-center text-gray-400">Loading your data...</p>}
        {error && <p className="text-center text-red-400">Error: {error}</p>}

        {/* Main Content: Class Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Render the miscellaneous tasks card first */}
          <ClassCard classItem={null} tasks={miscTasks} />
          {/* Render cards for each class */}
          {classes.map(cls => (
            <ClassCard key={cls.id} classItem={cls} tasks={groupedTasks[cls.id] || []} />
          ))}
        </div>
      </div>
      
      {/* Modals for Add Forms */}
      {showAddClassForm && (
        <Modal onClose={() => setShowAddClassForm(false)}>
          <AddClassForm
            onClassAdded={handleClassAdded}
            onCancel={() => setShowAddClassForm(false)}
          />
        </Modal>
      )}

      {showAddTaskForm && (
        <Modal onClose={() => setShowAddTaskForm(false)}>
          <AddTaskForm
            onTaskAdded={handleTaskAdded}
            onCancel={() => setShowAddTaskForm(false)}
            classes={classes}
          />
        </Modal>
      )}
    </div>
  )
};