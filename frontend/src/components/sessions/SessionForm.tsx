// src/components/sessions/SessionForm.tsx

import React, { useState, useEffect } from 'react';
import { SessionItem, SessionTask } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Clock, Target, Activity, Coffee, Smile } from 'lucide-react';
import SessionTaskAssociation from './SessionTaskAssociation';

interface SessionFormProps {
  onSave: (sessionData: Partial<SessionItem>) => void;
  onCancel: () => void;
  isEditing: boolean;
  sessionItem?: SessionItem | null;
  userId: string;
}

const SessionForm: React.FC<SessionFormProps> = ({
  onSave,
  onCancel,
  isEditing,
  sessionItem,
  userId
}) => {
  const [sessionMinutes, setSessionMinutes] = useState(isEditing && sessionItem ? sessionItem.session_minutes : 25);
  const [focusMinutes, setFocusMinutes] = useState(isEditing && sessionItem ? sessionItem.focus_minutes : 20);
  const [prodLevel, setProdLevel] = useState(isEditing && sessionItem ? sessionItem.prod_level : 5);
  const [moodX, setMoodX] = useState(isEditing && sessionItem ? sessionItem.mood_x : 0);
  const [moodY, setMoodY] = useState(isEditing && sessionItem ? sessionItem.mood_y : 0);
  const [breakActivity, setBreakActivity] = useState(isEditing && sessionItem ? (sessionItem.break_activity || '') : '');
  const [breakSatisfaction, setBreakSatisfaction] = useState(isEditing && sessionItem ? (sessionItem.break_satisfaction || 5) : 5);
  const [sessionTasks, setSessionTasks] = useState<SessionTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const sessionData: Partial<SessionItem> = {
        id: isEditing && sessionItem ? sessionItem.id : undefined,
        session_minutes: sessionMinutes,
        focus_minutes: focusMinutes,
        prod_level: prodLevel,
        mood_x: moodX,
        mood_y: moodY,
        break_activity: breakActivity || null,
        break_satisfaction: breakSatisfaction,
        user_id: userId
      };

      onSave(sessionData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskTimeUpdate = (tasks: SessionTask[]) => {
    setSessionTasks(tasks);
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-white">
        {isEditing ? 'Edit Session' : 'Create New Session'}
      </h3>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Session Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              <Clock size={20} className="inline mr-2" />
              Total Session Time (minutes)
            </label>
            <input
              type="number"
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(parseInt(e.target.value))}
              min="1"
              max="480"
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              <Target size={20} className="inline mr-2" />
              Focus Time (minutes)
            </label>
            <input
              type="number"
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(parseInt(e.target.value))}
              min="1"
              max={sessionMinutes}
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Productivity Level */}
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            <Activity size={20} className="inline mr-2" />
            Productivity Level (1-10)
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={prodLevel}
              onChange={(e) => setProdLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>1 (Low)</span>
              <span className="text-white font-medium">{prodLevel}</span>
              <span>10 (High)</span>
            </div>
          </div>
        </div>

        {/* Mood Tracking */}
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            <Smile size={20} className="inline mr-2" />
            Mood (Energy vs Focus)
          </label>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Energy Level (X-axis)</label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  value={moodX}
                  onChange={(e) => setMoodX(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>-5 (Low)</span>
                  <span className="text-white font-medium">{moodX}</span>
                  <span>5 (High)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Focus Level (Y-axis)</label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  value={moodY}
                  onChange={(e) => setMoodY(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>-5 (Low)</span>
                  <span className="text-white font-medium">{moodY}</span>
                  <span>5 (High)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Break Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              <Coffee size={20} className="inline mr-2" />
              Break Activity (optional)
            </label>
            <input
              type="text"
              value={breakActivity}
              onChange={(e) => setBreakActivity(e.target.value)}
              placeholder="e.g., Walk, Coffee, Meditation"
              className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Break Satisfaction (1-10)
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="10"
                value={breakSatisfaction}
                onChange={(e) => setBreakSatisfaction(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>1 (Poor)</span>
                <span className="text-white font-medium">{breakSatisfaction}</span>
                <span>10 (Excellent)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Association */}
        <SessionTaskAssociation
          sessionId={isEditing && sessionItem ? sessionItem.id : 'temp'}
          focusMinutes={focusMinutes}
          onTaskTimeUpdate={handleTaskTimeUpdate}
          userId={userId}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || focusMinutes > sessionMinutes}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Session' : 'Create Session')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SessionForm;
