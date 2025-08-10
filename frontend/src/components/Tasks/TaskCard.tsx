// src/components/Tasks/TaskCard.tsx

import React from "react";
import { Edit, Trash2, CalendarDays, AlertTriangle } from 'lucide-react'; // Importing icons
import { TaskItem } from "@/types"; // Importing TaskItem interface

// Define the props for the TaskCard component
interface TaskCardProps {
  task: TaskItem; // The individual task item to display
  onEdit: (task: TaskItem) => void; // Callback function when the edit button is clicked
  onDelete: (taskId: string) => void; // Callback function when the delete button is clicked
}

// Helper function to get color based on priority
const getPriorityColor = (priority: TaskItem['priority']) => {
  switch (priority) {
    case 'high': return 'bg-red-500'; // Using Tailwind background colors
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col transition-transform duration-200 hover:scale-[1.01] hover:shadow-xl">
      <div className="flex items-start justify-between mb-3">
        {/* Task Name and Type */}
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-white mb-1">{task.name}</h3>
          <p className="text-sm text-gray-400">Type: {task.task_type}</p>
        </div>

        {/* Priority Indicator (a small colored circle) */}
        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`}
             title={`Priority: ${task.priority}`}>
        </div>
      </div>

      {/* Due Date */}
      <div className="flex items-center text-gray-400 text-sm mb-4">
        <CalendarDays size={16} className="mr-2 flex-shrink-0" />
        <span>Due: {task.due_date ? task.due_date : 'No Due Date'}</span>
      </div>

      {/* Action Buttons (Edit and Delete) */}
      <div className="flex justify-end space-x-3 mt-auto pt-3 border-t border-gray-700"> {/* mt-auto pushes actions to bottom */}
        <button
          onClick={() => onEdit(task)}
          className="text-indigo-400 hover:text-indigo-300 transition-colors p-2 rounded-md hover:bg-gray-700 flex items-center"
          title="Edit Task"
        >
          <Edit size={18} className="mr-1" /> Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-gray-700 flex items-center"
          title="Delete Task"
        >
          <Trash2 size={18} className="mr-1" /> Delete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
