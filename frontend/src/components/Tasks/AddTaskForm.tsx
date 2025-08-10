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
  // Format due_date for input type="date". It needs "YYYY-MM-DD"
  const [dueDate, setDueDate] = useState(
    (isEditing && taskItem && taskItem.due_date)
      ? new Date(taskItem.due_date).toISOString().split('T')[0]
      : ''
  );
  // NEW STATES for priority and task type
  const [priority, setPriority] = useState<TaskItem['priority']>(isEditing && taskItem ? taskItem.priority : 'medium');
  const [taskType, setTaskType] = useState<TaskItem['task_type']>(isEditing && taskItem ? taskItem.task_type : 'Assignment');

  const [isLoadingForm, setIsLoadingForm] = useState(false); // Renamed to avoid confusion with parent's isLoading
  const [error, setError] = useState<string | null>(null);

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

    // Construct the task data object for saving, including new attributes
    const taskDataToSave: Omit<TaskItem, 'user_id'> = {
      id: isEditing && taskItem ? taskItem.id : '', // Pass existing ID if editing, empty string for new
      name: taskName,
      class_id: classId,
      due_date: dueDate || null, // Use null if the date input is empty
      priority: priority,        // Include priority
      task_type: taskType,       // Include task type
    };

    // Call the parent's onSave handler
    onSave(taskDataToSave);
  };

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
        
        {/* Due Date Input */}
        <div>
          <label htmlFor="dueDate" className="block text-gray-300 font-medium mb-1">Due Date (optional)</label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            onChange={(e) => setTaskType(e.target.value as TaskItem['task_type'])}
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