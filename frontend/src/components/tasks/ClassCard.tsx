import React from "react";
import { Clock, MapPin } from 'lucide-react'; // Import icons for new attributes
import { ClassItem, TaskItem } from "@/types"; // Import interfaces
import TaskCard from "./TaskCard"; // Import the new TaskCard component

// Define the props for this component
interface ClassCardProps {
  classItem: ClassItem | null; // The class item to display (or null for Misc tasks)
  tasks: TaskItem[];         // The list of tasks associated with this class
  onEditTask: (task: TaskItem) => void;   // A function to handle editing a task
  onDeleteTask: (taskId: string) => void; // A function to handle deleting a task
}

const ClassCard = ({ classItem, tasks, onEditTask, onDeleteTask }: ClassCardProps) => {
  // Determine the card's title. If classItem is null, it's the "Misc Tasks" card.
  const title = classItem ? classItem.name : "Miscellaneous Tasks";

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      {/* Card Header with Title */}
      <h2 className="text-2xl font-bold text-teal-300 mb-4 border-b border-gray-700 pb-2">{title}</h2>

      {/* New: Display class attributes if a class item exists */}
      {classItem && (
        <div className="text-sm text-gray-400 mb-4">
          {classItem.meeting_times && (
            <p className="flex items-center"><Clock size={16} className="mr-2" /> {classItem.meeting_times}</p>
          )}
          {classItem.location && (
            <p className="flex items-center"><MapPin size={16} className="mr-2" /> {classItem.location}</p>
          )}
        </div>
      )}

      {/* Render a list of tasks */}
      {tasks.length > 0 ? (
        <ul className="space-y-3 flex-grow overflow-y-auto">
          {tasks.map((task: TaskItem) => (
            <li key={task.id}>
              {/* This is the key change: we now render the full TaskCard component */}
              <TaskCard 
                task={task} 
                onEdit={onEditTask} 
                onDelete={onDeleteTask} 
              />
            </li>
          ))}
        </ul>
      ) : (
        // Display a message if there are no tasks
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 italic">No tasks for this {classItem ? 'class' : 'category'}.</p>
        </div>
      )}
    </div>
  );
};

export default ClassCard;