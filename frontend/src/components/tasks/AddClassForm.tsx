import { useState } from 'react';
import { ClassItem } from "@/types"; // Import interfaces

interface AddClassFormProps {
  onSave: (classData: Omit<ClassItem, 'user_id'>) => void;
  isEditing: boolean;
  classItem?: ClassItem | null;
  onCancel: () => void;
}

export default function AddClassForm({ onSave, onCancel, isEditing, classItem }: AddClassFormProps) {
  // Initialize state based on whether we're editing or adding
  const [className, setClassName] = useState(isEditing && classItem ? classItem.name : '');
  const [subject, setSubject] = useState(isEditing && classItem ? classItem.subject || '' : ''); // Initialize subject
  const [meetingTimes, setMeetingTimes] = useState(isEditing && classItem ? classItem.meeting_times || '' : ''); // New
  const [location, setLocation] = useState(isEditing && classItem ? classItem.location || '' : ''); // New

  const [isLoading, setIsLoading] = useState(false); // This `isLoading` is for the form itself
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Indicate form submission in progress
    setError(null);
    
    if (!className.trim()) {
      setError('Class name cannot be empty.');
      setIsLoading(false);
      return;
    }

    // Construct the class data object for saving
    const classDataToSave: Omit<ClassItem, 'user_id'> = {
      id: isEditing && classItem ? classItem.id : '', // Pass existing ID if editing, empty string for new
      name: className,
      subject: subject || undefined,      // Use undefined if empty, so Supabase won't store empty string if column is nullable
      meeting_times: meetingTimes || undefined, // New attribute
      location: location || undefined,        // New attribute
    };

    // Call the parent's onSave handler
    // The parent (Tasks component) will handle the Supabase call and set its own loading/error
    // This form's isLoading/error is mainly for local form validation/feedback.
    onSave(classDataToSave); // Pass the complete object

    // Reset form fields after successful submission (or let parent handle close)
    // We remove explicit setIsLoading(false) and setClassName('') here
    // because the parent's onSave will close the modal and re-fetch data,
    // which will handle resetting the form's state.
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
      <h3 className="text-2xl font-bold mb-4 text-white">{isEditing ? 'Edit Class' : 'Add New Class'}</h3>
      {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="className" className="block text-gray-300 font-medium mb-1">Class Name</label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g., Web Dev 101"
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
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
        {/* NEW INPUTS FOR MEETING TIMES AND LOCATION */}
        <div>
          <label htmlFor="meetingTimes" className="block text-gray-300 font-medium mb-1">Meeting Times (e.g., MWF 10:00 AM)</label>
          <input
            type="text"
            id="meetingTimes"
            value={meetingTimes}
            onChange={(e) => setMeetingTimes(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-gray-300 font-medium mb-1">Location</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* END NEW INPUTS */}
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
            {isLoading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Add Class')}
          </button>
        </div>
      </form>
    </div>
  );
};