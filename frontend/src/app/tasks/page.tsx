"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Home, Plus, Edit, Trash, Clock, MapPin} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClassItem, TaskItem } from "@/types"; // Import interfaces

//import TaskList from '@/components/Tasks/TaskList';
import AddTaskForm from '@/components/Tasks/AddTaskForm';
import AddClassForm from '@/components/Tasks/AddClassForm';
import ClassCard from '@/components/Tasks/ClassCard';
import TaskCard from '@/components/Tasks/TaskCard';
import Modal from '@/components/UI/Modal';


interface AddButtonDropdownProps {
  onAddClass: () => void; // A function that takes no arguments and returns void
  onAddTask: () => void;  // A function that takes no arguments and returns void
}

const AddButtonDropdown = ({ onAddClass, onAddTask }: AddButtonDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref to detect clicks outside

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-green-600 text-white text-xl font-semibold rounded-full flex items-center justify-center hover:bg-green-500 transition-colors shadow-lg"
        aria-label="Add new item"
      >
        <Plus size={24} /> {/* Using Lucide React Plus icon */}
      </button>
      {isOpen && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 bg-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
          <button
            onClick={() => { onAddClass(); setIsOpen(false); }}
            className="w-full text-left p-3 text-white hover:bg-gray-600 transition-colors"
          >
            Add Class
          </button>
          <button
            onClick={() => { onAddTask(); setIsOpen(false); }}
            className="w-full text-left p-3 text-white hover:bg-gray-600 transition-colors"
          >
            Add Task
          </button>
          {/* You can add more options here like "Add Goal" */}
        </div>
      )}
    </div>
  );
};


export default function Tasks(){
  const [view, setView] = useState('home');
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [currentModalMessage, setCurrentModalMessage] = useState<string | null>(null);
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

  
  // Helper function for priority color (re-used here for master timeline)
  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  // Function to sort tasks by due date
  const sortedTasks = (taskArray: TaskItem[]) => {
    return [...taskArray].sort((a, b) => { // Use spread to avoid mutating original array
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1; // Null due dates last
      if (!b.due_date) return -1; // Null due dates last
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  };

  const handleDeleteClass = async (classId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setCurrentModalMessage('Authentication required to delete classes.');
      return;
    }

    // IMPORTANT: Confirm deletion with the user
    if (!window.confirm("Are you sure you want to delete this class? This will also delete its associated tasks.")) {
      return; // User cancelled
    }

    try {
      // Optional: First, delete associated tasks if your database doesn't handle cascading deletes.
      // If you have CASCADE DELETE set up in your Supabase foreign key constraint,
      // deleting the class will automatically delete its tasks, and you can skip this step.
      // However, it's safer to explicitly delete them if unsure or for specific logic.
      const { error: deleteTasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('class_id', classId)
        .eq('user_id', user.id); // Ensure user owns these tasks

      if (deleteTasksError) {
        throw new Error(`Failed to delete associated tasks: ${deleteTasksError.message}`);
      }

      // Now, delete the class itself
      const { error: deleteClassError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('user_id', user.id); // Ensure user owns the class being deleted

      if (deleteClassError) {
        throw new Error(`Failed to delete class: ${deleteClassError.message}`);
      }

      setCurrentModalMessage('Class and associated tasks deleted successfully!');
      fetchData(); // Re-fetch all data to update the UI
      // If the deleted class was the currently viewed class, navigate to home
      if (view === classId) {
        setView('home');
      }
    } catch (e: any) {
      setCurrentModalMessage(`Error deleting class: ${e.message}`);
    }
  };

  const handleSaveClass = async (classData: Omit<ClassItem, 'user_id'>) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setCurrentModalMessage('Authentication required to save classes.');
      return;
    }

    try {
      if (classData.id) {
        // Logic for EDITING an existing class
        const { error: updateError } = await supabase
          .from('classes')
          .update({
            name: classData.name,
            meeting_times: classData.meeting_times, // Include these new fields
            location: classData.location,           // Include these new fields
          })
          .eq('id', classData.id)
          .eq('user_id', user.id); // Ensure user owns the class they are trying to update

        if (updateError) {
          throw new Error(`Failed to update class: ${updateError.message}`);
        }
        setCurrentModalMessage('Class updated successfully!');
      } else {
        // Logic for ADDING a new class
        const { error: insertError } = await supabase
          .from('classes')
          .insert({
            name: classData.name,
            user_id: user.id, // Assign the current user's ID
            meeting_times: classData.meeting_times, // Include these new fields
            location: classData.location,           // Include these new fields
          });

        if (insertError) {
          throw new Error(`Failed to add class: ${insertError.message}`);
        }
        setCurrentModalMessage('Class added successfully!');
      }

      setShowAddClassForm(false); // Close the modal
      setEditingClass(null); // Clear any editing state
      fetchData(); // Re-fetch all data to update the UI
    } catch (e: any) {
      setCurrentModalMessage(`Error saving class: ${e.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setCurrentModalMessage('Authentication required to delete tasks.');
      return;
    }

    // IMPORTANT: Confirm deletion with the user
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return; // User cancelled the confirmation
    }

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId) // Identify the specific task by its ID
        .eq('user_id', user.id); // Crucial for RLS: ensure user owns the task they are deleting

      if (deleteError) {
        throw new Error(`Failed to delete task: ${deleteError.message}`);
      }

      setCurrentModalMessage('Task deleted successfully!');
      fetchData(); // Re-fetch all data to update the UI
    } catch (e: any) {
      setCurrentModalMessage(`Error deleting task: ${e.message}`);
    }
  };

  const handleSaveTask = async (taskData: Omit<TaskItem, 'user_id'>) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setCurrentModalMessage('Authentication required to save tasks.');
      return;
    }

    try {
      if (taskData.id) {
        // Logic for EDITING an existing task
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            name: taskData.name,
            due_date: taskData.due_date,
            class_id: taskData.class_id,
            priority: taskData.priority,
            task_type: taskData.task_type,
          })
          .eq('id', taskData.id)
          .eq('user_id', user.id); // Crucial for RLS: ensure user owns the task they are updating

        if (updateError) {
          throw new Error(`Failed to update task: ${updateError.message}`);
        }
        setCurrentModalMessage('Task updated successfully!');
      } else {
        // Logic for ADDING a new task
        const { error: insertError } = await supabase
          .from('tasks')
          .insert({
            name: taskData.name,
            due_date: taskData.due_date,
            class_id: taskData.class_id,
            priority: taskData.priority,
            task_type: taskData.task_type,
            user_id: user.id, // Crucial for RLS: assign the current user's ID to the new task
          });

        if (insertError) {
          throw new Error(`Failed to add task: ${insertError.message}`);
        }
        setCurrentModalMessage('Task added successfully!');
      }

      setShowAddTaskForm(false); // Close the task modal
      setEditingTask(null); // Clear any task being edited state
      fetchData(); // Re-fetch all data to update the UI
    } catch (e: any) {
      setCurrentModalMessage(`Error saving task: ${e.message}`);
    }
  };

  return (
    <div className="flex flex-row bg-gray-800 text-white p-3 font-sans">
      {/* Sidebar */}
      <div className="flex flex-col w-64 max-w-7xl bg-blue-800 p-5 m-2 rounded-lg">
        <nav className="flex-grow">
          <ul className="flex flex-col gap-4">
            <li className="mb-2">
              <div className="flex flex-row gap-10 m-2">
                <button
                  onClick={() => setView('home')}
                  className={`flex-grow text-left p-2 rounded-lg font-semibold text-2xl transition-colors h-12 flex items-center ${view === 'home' ? 'bg-white text-black' : 'hover:bg-gray-700'}`}
                >
                  Home
                </button>
                <AddButtonDropdown
                  onAddClass={() => setShowAddClassForm(true)}
                  onAddTask={() => setShowAddTaskForm(true)}
                />
              </div>
            </li>
            {classes.map(cls => (
              <li key={cls.id} className="text-lg font-semibold text-white">
                <button 
                  onClick={() => setView(cls.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${view === cls.id ? 'bg-white text-black' : 'hover:bg-gray-700'}`}
                >
                  {cls.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto"> {/* Main content panel */}
        <div className="max-w-7xl mx-auto"> {/* Content max-width wrapper */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold">
              {view === 'home' ? 'Dashboard' : (classes.find(c => c.id === view)?.name || 'Class Details')}
            </h1>
          </header>

          {/* Global Loading and Error States (remain here) */}
          {isLoading && <p className="text-center text-gray-400">Loading your data...</p>}
          {error && <p className="text-center text-red-400">Error: {error}</p>}
          {currentModalMessage && (
            <Modal onClose={() => setCurrentModalMessage(null)}>
              <p className="text-white text-center">{currentModalMessage}</p>
            </Modal>
          )}

          {/* Conditional Rendering for Home or Class View */}
          {!isLoading && !error && (
            <div className="space-y-12">
              {/* Home View Content */}
              {view === 'home' && (
                <>
                  <section>
                    <h2 className="text-3xl font-bold mb-6 text-teal-400">Master Timeline</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                      {sortedTasks(tasks).length > 0 ? (
                        <ul className="space-y-3">
                          {sortedTasks(tasks).map(task => (
                            <li key={task.id} className="flex items-center text-lg">
                              <span className={`w-3 h-3 rounded-full mr-3 ${getPriorityColor(task.priority)}`}></span>
                              {task.name} - {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                              {task.class_id && (
                                <span className="ml-2 text-sm text-gray-400">
                                  ({classes.find(cls => cls.id === task.class_id)?.name || 'Unknown Class'})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No tasks yet. Add one to see your timeline!</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-3xl font-bold mb-6 text-teal-400">Class Overviews</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Render Miscellaneous Tasks Card */}
                      {miscTasks.length > 0 && (
                        <ClassCard
                          classItem={null}
                          tasks={miscTasks}
                          onEditTask={(t) => { setEditingTask(t); setShowAddTaskForm(true); }}
                          onDeleteTask={handleDeleteTask}
                        />
                      )}

                      {/* Render Class Cards */}
                      {classes.map(cls => (
                        <ClassCard
                          key={cls.id}
                          classItem={cls}
                          tasks={sortedTasks(groupedTasks[cls.id] || []).slice(0, 3)}
                          onEditTask={(t) => { setEditingTask(t); setShowAddTaskForm(true); }}
                          onDeleteTask={handleDeleteTask}
                        />
                      ))}

                      {classes.length === 0 && miscTasks.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 mt-12">
                          <p>No classes or tasks yet. Click "Add New" in the sidebar to get started!</p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Class Detail View Content */}
              {view !== 'home' && (
                <>
                  {/* Display specific Class details at the top of its page */}
                  {classes.find(c => c.id === view) && (
                    <section className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border-l-4 border-indigo-500">
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-3xl font-bold text-indigo-300">
                          {classes.find(c => c.id === view)?.name}
                        </h2>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { setEditingClass(classes.find(c => c.id === view) || null); setShowAddClassForm(true); }}
                            className="text-gray-400 hover:text-indigo-400 transition-colors p-1 rounded-full hover:bg-gray-700"
                            title="Edit Class"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(view as string)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-700"
                            title="Delete Class"
                          >
                            <Trash size={20} />
                          </button>
                        </div>
                      </div>
                      {classes.find(c => c.id === view)?.meeting_times && (
                        <p className="flex items-center text-gray-400 text-md mb-1"><Clock size={18} className="mr-2" /> {classes.find(c => c.id === view)?.meeting_times}</p>
                      )}
                      {classes.find(c => c.id === view)?.location && (
                        <p className="flex items-center text-gray-400 text-md"><MapPin size={18} className="mr-2" /> {classes.find(c => c.id === view)?.location}</p>
                      )}
                    </section>
                  )}

                  <section>
                    <h2 className="text-3xl font-bold mb-6 text-teal-400">Class Timeline</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                      {sortedTasks(groupedTasks[view] || []).length > 0 ? (
                        <ul className="space-y-3">
                          {sortedTasks(groupedTasks[view] || []).map(task => (
                            <li key={task.id} className="flex items-center text-lg">
                              <span className={`w-3 h-3 rounded-full mr-3 ${getPriorityColor(task.priority)}`}></span>
                              {task.name} - {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'} ({task.task_type})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No tasks for this class yet. Add one!</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-3xl font-bold mb-6 text-teal-400">All Tasks for This Class</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {sortedTasks(groupedTasks[view] || []).length > 0 ? (
                        sortedTasks(groupedTasks[view] || []).map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={(t) => { setEditingTask(t); setShowAddTaskForm(true); }}
                            onDelete={handleDeleteTask}
                          />
                        ))
                      ) : (
                        <div className="col-span-full text-center text-gray-500 mt-6">
                          <p>No tasks found for this class.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals for Add/Edit Forms - Placed at the very end of the main return to ensure they render on top */}
      {showAddClassForm && (
        <Modal onClose={() => { setShowAddClassForm(false); setEditingClass(null); }}>
          <AddClassForm
            onSave={handleSaveClass}
            onCancel={() => { setShowAddClassForm(false); setEditingClass(null); }}
            isEditing={!!editingClass}
            classItem={editingClass}
          />
        </Modal>
      )}

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
  )};