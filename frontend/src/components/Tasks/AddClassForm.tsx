import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ClassItem {
  id: string;
  name: string;
}

interface AddClassFormProps {
  onClassAdded: (newClass: Omit<ClassItem, 'id'>) => void;
  onCancel: () => void;
}

export default function AddClassForm({ onClassAdded, onCancel }: AddClassFormProps) {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the new class object from form state
    const newClass = {
      name: className, // Assuming `className` is your state variable
      subject: subject || null, // Use null if no subject is provided
    };

    // Pass the new class object to the parent's handler function
    onClassAdded(newClass);
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
      <h3 className="text-2xl font-bold mb-4 text-white">Add New Class</h3>
      {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="className" className="block text-gray-300 font-medium mb-1">Class Name</label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-gray-300 font-medium mb-1">Subject</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
            disabled={isLoading || !className.trim()}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Class'}
          </button>
        </div>
      </form>
    </div>
  );
};