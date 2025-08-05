import React from "react";

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

const ClassCard = ({ classItem, tasks }: { classItem: ClassItem | null, tasks: TaskItem[] }) => {
  // Determine the card's title. If classItem is null, it's the "Misc Tasks" card.
  const title = classItem ? classItem.name : "Misc Tasks";

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <h2 className="text-2xl font-bold text-teal-300 mb-4 border-b border-gray-700 pb-2">{title}</h2>
      {tasks.length > 0 ? (
        // Render a list of tasks if there are any
        <ul className="space-y-3 flex-grow overflow-y-auto">
          {tasks.map((task: TaskItem) => (
            <li key={task.id} className="p-3 bg-gray-700 rounded-md flex items-center justify-between transition-all duration-200 hover:bg-gray-600">
              <div>
                <p className="text-lg text-white">{task.name}</p>
                {task.due_date && <p className="text-sm text-gray-400">Due: {task.due_date}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        // Display a message if there are no tasks
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 italic">No tasks for this class.</p>
        </div>
      )}
    </div>
  );
};

export default ClassCard;