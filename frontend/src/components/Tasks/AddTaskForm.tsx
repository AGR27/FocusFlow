import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ClassItem {
  id: string;
  name: string;
}

interface AddTaskFormProps {
  onTaskAdded: (newTask: Omit<ClassItem, 'id'>) => void;
  onCancel: () => void;
  classes: ClassItem[];
}

export default function AddTaskForm({ onTaskAdded, onCancel }: AddTaskFormProps) {
  const [taskName, setTaskName] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This function fetches all the user's classes when the form loads.
    const fetchClasses = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('id, name');

      if (error) {
        setError(error.message);
      } else {
        setClasses(data);
      }
      setIsLoading(false);
    };

    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the new class object from form state
    const newTask = {
      name: taskName, // Assuming `className` is your state variable
      class_id: classId,
      due_date: dueDate || null, // Use null if no date is provided
    };

    // Pass the new class object to the parent's handler function
    onTaskAdded(newTask);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md mx-auto">
      <h3 className="text-2xl font-bold mb-4 text-white">Add New Task</h3>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Name Input */}
        <div>
          <label htmlFor="taskName" className="block text-gray-300 font-medium mb-1">Task Name</label>
          <input
            type="text"
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Class Selector */}
        <div>
          <label htmlFor="classId" className="block text-gray-300 font-medium mb-1">Class</label>
          {isLoading ? (
            <p className="text-gray-400">Loading classes...</p>
          ) : (
            <select
              id="classId"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          )}
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
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
