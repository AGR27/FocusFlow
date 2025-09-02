// src/components/Tasks/AddTaskForm.tsx

import React, { useState, useEffect } from 'react';
import { ClassItem, TaskItem } from "@/types"; // Import TaskItem and ClassItem interfaces from your shared types

// Define the correct props for AddTaskForm
interface AddTaskFormProps {
  onSave: (taskData: Omit<TaskItem, 'user_id'>) => void;
  onCancel: () => void;
  classes: ClassItem[]; // Classes are PASSED IN, not fetched by this component
  isEditing: boolean;         // NEW: Indicates if the form is for editing
  taskItem?: TaskItem | null; // NEW: The task data if in editing mode
}

export default function AddTaskForm({ onSave, onCancel, classes, isEditing, taskItem }: AddTaskFormProps) {
  // Initialize state based on whether we're editing or adding an existing task
  const [taskName, setTaskName] = useState(isEditing && taskItem ? taskItem.name : '');
  const [classId, setClassId] = useState(isEditing && taskItem ? (taskItem.class_id || '') : ''); // Ensure it's a string, default to empty
  // Format due_date_time for input type="date". It needs "YYYY-MM-DD"
  const [dueDate, setDueDate] = useState(''); // YYYY-MM-DD
  const [dueTime, setDueTime] = useState(''); // HH:MM
  // NEW STATES for priority and task type
  const [priority, setPriority] = useState<TaskItem['priority']>(isEditing && taskItem ? taskItem.priority : 'medium');
  const [taskType, setTaskType] = useState<TaskItem['type']>(isEditing && taskItem ? taskItem.type : 'Assignment');

  const [isLoadingForm, setIsLoadingForm] = useState(false); // Renamed to avoid confusion with parent's isLoading
  const [error, setError] = useState<string | null>(null);

  // Effect to update dueDate and dueTime when taskItem changes (for editing)
  useEffect(() => {
    if (isEditing && taskItem && taskItem.due_date_time) {
      try {
        const dt = new Date(taskItem.due_date_time);
        
        // Format date part for input type="date" (YYYY-MM-DD)
        const year = dt.getFullYear();
        const month = (dt.getMonth() + 1).toString().padStart(2, '0');
        const day = dt.getDate().toString().padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);

        // Format time part for input type="time" (HH:MM)
        const hours = dt.getHours().toString().padStart(2, '0');
        const minutes = dt.getMinutes().toString().padStart(2, '0');
        setDueTime(`${hours}:${minutes}`);
      } catch (e) {
        console.error("Error parsing due_date_time for editing:", e, taskItem.due_date_time);
        setError("Invalid due date format in existing task. Please re-enter.");
        setDueDate('');
        setDueTime('');
      }
    } else {
      // For new tasks or if no due_date_time, ensure fields are empty
      setDueDate('');
      setDueTime('');
    }
  }, [isEditing, taskItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true); // Indicate form submission in progress
    setError(null);
    
    // Basic form validation
    if (!taskName.trim()) {
      setError('Task name cannot be empty.');
      setIsLoadingForm(false);
      return;
    }
    if (!classId) {
      setError('Please select a class for the task.');
      setIsLoadingForm(false);
      return;
    }

    // --- CRITICAL FIX: Combine date and time into a single ISO string for timestampz ---
    let fullDueDateISO: string | null = null;
    if (dueDate) { // If a date has been entered
      // Create a full date-time string. If no time, default to midnight.
      const combinedDateTimeString = `${dueDate}${dueTime ? `T${dueTime}:00` : 'T00:00:00'}`;
      try {
        // Create a Date object from the combined string.
        // This will correctly interpret it based on the client's local timezone
        // and then toISOString() will convert it to UTC for database storage.
        const dateObj = new Date(combinedDateTimeString);
        if (isNaN(dateObj.getTime())) { // Check if the date object is invalid
          throw new Error('Invalid date or time entered.');
        }
        fullDueDateISO = dateObj.toISOString(); // This produces the "YYYY-MM-DDTHH:MM:SS.sssZ" format
      } catch (e: any) {
        setError(`Date/Time error: ${e.message}. Please enter a valid date and time.`);
        setIsLoadingForm(false);
        return;
      }
      const taskDataToSave: Omit<TaskItem, 'user_id'> = {
        id: isEditing && taskItem ? taskItem.id : '', // Pass existing ID if editing, empty string for new
        name: taskName,
        class_id: classId,
        due_date_time: fullDueDateISO, // Use the correctly formatted ISO string for due_date_time
        priority: priority,
        type: taskType,
      };

      // Call the parent's onSave handler
      onSave(taskDataToSave);
    }
  }; // Pass the complete object

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md"> {/* Added w-full max-w-md for better sizing */}
      <h3 className="text-2xl font-bold mb-4 text-white">{isEditing ? 'Edit Task' : 'Add New Task'}</h3>
      {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Name Input */}
        <div>
          <label htmlFor="taskName" className="block text-gray-300 font-medium mb-1">Task Name</label>
          <input
            type="text"
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="e.g., Complete Chapter 3 exercises"
            required
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Class Selector */}
        <div>
          <label htmlFor="classId" className="block text-gray-300 font-medium mb-1">Class</label>
          {/* Always render select, it gets 'classes' prop from parent */}
          <select
            id="classId"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Select a class</option>
            {/* Ensure 'classes' prop is available and mapped */}
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        
        {/* Due Date & Time Inputs - Now side-by-side using flex */}
        <div className="flex space-x-2">
          <div className="flex-1"> {/* Date input */}
            <label htmlFor="dueDate" className="block text-gray-300 font-medium mb-1">Due Date (optional)</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1"> {/* Time input */}
            <label htmlFor="dueTime" className="block text-gray-300 font-medium mb-1">Time (optional)</label>
            <input
              type="time"
              id="dueTime"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* NEW: Priority Selector */}
        <div>
          <label htmlFor="priority" className="block text-gray-300 font-medium mb-1">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskItem['priority'])}
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* NEW: Task Type Selector */}
        <div>
          <label htmlFor="taskType" className="block text-gray-300 font-medium mb-1">Task Type</label>
          <select
            id="taskType"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskItem['type'])}
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Assignment">Assignment</option>
            <option value="Quiz">Quiz</option>
            <option value="Exam">Exam</option>
            <option value="Project">Project</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoadingForm || !taskName.trim() || !classId} // Disable if no task name or class selected
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isLoadingForm ? 'Processing...' : (isEditing ? 'Save Changes' : 'Add Task')}
          </button>
        </div>
      </form>
    </div>
  );
}