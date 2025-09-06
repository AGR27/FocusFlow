// src/components/sessions/SessionTaskAssociation.tsx

import React, { useState, useEffect } from 'react';
import { TaskItem, SessionTask } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Clock, Plus, X, CheckCircle } from 'lucide-react';

interface SessionTaskAssociationProps {
  sessionId: string;
  focusMinutes: number;
  onTaskTimeUpdate: (sessionTasks: SessionTask[]) => void;
  userId: string;
}

const SessionTaskAssociation: React.FC<SessionTaskAssociationProps> = ({
  sessionId,
  focusMinutes,
  onTaskTimeUpdate,
  userId
}) => {
  const [availableTasks, setAvailableTasks] = useState<TaskItem[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<SessionTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available tasks and existing session tasks
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load available tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['pending', 'in_progress']);

        if (tasksError) throw tasksError;

        // Load existing session tasks
        const { data: sessionTasks, error: sessionTasksError } = await supabase
          .from('session_tasks')
          .select(`
            *,
            task:tasks(*)
          `)
          .eq('session_id', sessionId)
          .eq('user_id', userId);

        if (sessionTasksError) throw sessionTasksError;

        setAvailableTasks(tasks || []);
        setSelectedTasks(sessionTasks || []);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sessionId, userId]);

  const addTaskToSession = async (task: TaskItem) => {
    try {
      const { data, error } = await supabase
        .from('session_tasks')
        .insert({
          session_id: sessionId,
          task_id: task.id!,
          user_id: userId,
          task_time: 0
        })
        .select(`
          *,
          task:tasks(*)
        `)
        .single();

      if (error) throw error;

      setSelectedTasks(prev => [...prev, data]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const removeTaskFromSession = async (sessionTaskId: string) => {
    try {
      const { error } = await supabase
        .from('session_tasks')
        .delete()
        .eq('id', sessionTaskId)
        .eq('user_id', userId);

      if (error) throw error;

      setSelectedTasks(prev => prev.filter(st => st.id !== sessionTaskId));
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const updateTaskTime = async (sessionTaskId: string, time: number) => {
    try {
      const { error } = await supabase
        .from('session_tasks')
        .update({ task_time: time })
        .eq('id', sessionTaskId)
        .eq('user_id', userId);

      if (error) throw error;

      setSelectedTasks(prev => 
        prev.map(st => 
          st.id === sessionTaskId ? { ...st, task_time: time } : st
        )
      );

      // Notify parent component
      onTaskTimeUpdate(selectedTasks);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const getTotalAllocatedTime = () => {
    return selectedTasks.reduce((sum, st) => sum + (st.task_time || 0), 0);
  };

  const getRemainingTime = () => {
    return Math.max(0, focusMinutes - getTotalAllocatedTime());
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-center">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Task Time Allocation</h3>
        <div className="text-sm text-gray-400">
          <Clock size={16} className="inline mr-1" />
          Focus Time: {focusMinutes} min | Allocated: {getTotalAllocatedTime()} min | Remaining: {getRemainingTime()} min
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Available Tasks */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Available Tasks</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableTasks
            .filter(task => !selectedTasks.some(st => st.task_id === task.id))
            .map(task => (
              <div key={task.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">{task.name}</p>
                  <p className="text-sm text-gray-400">{task.type}</p>
                  {/* {task.time_goal && (
                    <p className="text-xs text-blue-400">Goal: {task.time_goal} min</p>
                  )} */}
                </div>
                <button
                  onClick={() => addTaskToSession(task)}
                  className="text-green-400 hover:text-green-300 p-1 rounded"
                  title="Add to session"
                >
                  <Plus size={20} />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Selected Tasks with Time Sliders */}
      {selectedTasks.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Session Tasks</h4>
          <div className="space-y-4">
            {selectedTasks.map(sessionTask => (
              <div key={sessionTask.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-white font-medium">{sessionTask.task?.name}</p>
                    <p className="text-sm text-gray-400">{sessionTask.task?.type}</p>
                    {/* {sessionTask.task?.time_goal && (
                      <p className="text-xs text-blue-400">Goal: {sessionTask.task.time_goal} min</p>
                    )} */}
                  </div>
                  <button
                    onClick={() => removeTaskFromSession(sessionTask.id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded"
                    title="Remove from session"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Time spent (minutes)</label>
                    <span className="text-sm text-white font-medium">
                      {sessionTask.task_time || 0} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={focusMinutes}
                    value={sessionTask.task_time || 0}
                    onChange={(e) => updateTaskTime(sessionTask.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((sessionTask.task_time || 0) / focusMinutes) * 100}%, #374151 ${((sessionTask.task_time || 0) / focusMinutes) * 100}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0 min</span>
                    <span>{focusMinutes} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTasks.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-gray-500 mb-2" />
          <p className="text-gray-400">No tasks selected for this session</p>
          <p className="text-sm text-gray-500">Add tasks above to track time spent on each</p>
        </div>
      )}
    </div>
  );
};

export default SessionTaskAssociation;
