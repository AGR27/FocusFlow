// src/components/dashboard/TaskAnalytics.tsx

import React, { useState, useEffect } from 'react';
import { SessionTask, TaskItem } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Clock, Target, TrendingUp, Calendar, Award } from 'lucide-react';

interface TaskAnalyticsProps {
  userId: string;
  timeRange: 'week' | 'month' | 'all';
}

interface TaskTimeData {
  taskId: string;
  taskName: string;
  timeSpent: number;
  timeGoal: number;
  sessions: number;
  efficiency: number; // percentage of goal achieved
}

interface DailyTimeData {
  date: string;
  timeSpent: number;
  tasksCompleted: number;
  avgEfficiency: number;
}

const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ userId, timeRange }) => {
  const [taskTimeData, setTaskTimeData] = useState<TaskTimeData[]>([]);
  const [dailyData, setDailyData] = useState<DailyTimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        
        switch (timeRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        // Load session tasks with task details
        const { data: sessionTasks, error: sessionTasksError } = await supabase
          .from('session_tasks')
          .select(`
            *,
            task:tasks(*),
            session:sessions(created_at)
          `)
          .eq('user_id', userId)
          .gte('session.created_at', startDate.toISOString());

        if (sessionTasksError) throw sessionTasksError;

        // Process task time data
        const taskMap = new Map<string, TaskTimeData>();
        
        sessionTasks?.forEach((st: any) => {
          const taskId = st.task_id;
          const task = st.task;
          
          if (!taskMap.has(taskId)) {
            taskMap.set(taskId, {
              taskId,
              taskName: task.name,
              timeSpent: 0,
              timeGoal: task.time_goal || 0,
              sessions: 0,
              efficiency: 0
            });
          }
          
          const taskData = taskMap.get(taskId)!;
          taskData.timeSpent += st.task_time || 0;
          taskData.sessions += 1;
        });

        // Calculate efficiency for each task
        const processedTasks = Array.from(taskMap.values()).map(task => ({
          ...task,
          efficiency: task.timeGoal > 0 ? Math.round((task.timeSpent / task.timeGoal) * 100) : 0
        }));

        setTaskTimeData(processedTasks);

        // Process daily data
        const dailyMap = new Map<string, DailyTimeData>();
        
        sessionTasks?.forEach((st: any) => {
          const date = new Date(st.session.created_at).toDateString();
          
          if (!dailyMap.has(date)) {
            dailyMap.set(date, {
              date,
              timeSpent: 0,
              tasksCompleted: 0,
              avgEfficiency: 0
            });
          }
          
          const dailyData = dailyMap.get(date)!;
          dailyData.timeSpent += st.task_time || 0;
          dailyData.tasksCompleted += 1;
        });

        // Calculate average efficiency for each day
        const processedDaily = Array.from(dailyMap.values()).map(day => ({
          ...day,
          avgEfficiency: day.tasksCompleted > 0 ? Math.round(day.timeSpent / day.tasksCompleted) : 0
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setDailyData(processedDaily);

      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [userId, timeRange]);

  const getTotalTimeSpent = () => {
    return taskTimeData.reduce((sum, task) => sum + task.timeSpent, 0);
  };

  const getTotalSessions = () => {
    return taskTimeData.reduce((sum, task) => sum + task.sessions, 0);
  };

  const getAverageEfficiency = () => {
    const tasksWithGoals = taskTimeData.filter(task => task.timeGoal > 0);
    if (tasksWithGoals.length === 0) return 0;
    return Math.round(
      tasksWithGoals.reduce((sum, task) => sum + task.efficiency, 0) / tasksWithGoals.length
    );
  };

  const getTopPerformingTasks = () => {
    return taskTimeData
      .filter(task => task.timeGoal > 0)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-center">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-red-400 text-center">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Time Spent</p>
              <p className="text-2xl font-bold text-white">{getTotalTimeSpent()} min</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{getTotalSessions()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-yellow-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg Efficiency</p>
              <p className="text-2xl font-bold text-white">{getAverageEfficiency()}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Tasks Tracked</p>
              <p className="text-2xl font-bold text-white">{taskTimeData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Time Spent by Task */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Time Spent by Task</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskTimeData.slice(0, 10)}>
              <XAxis dataKey="taskName" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value) => [`${value} min`, 'Time Spent']}
              />
              <Bar dataKey="timeSpent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Efficiency Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Task Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getTopPerformingTasks()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, efficiency }) => `${name}: ${efficiency}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="efficiency"
              >
                {getTopPerformingTasks().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value) => [`${value}%`, 'Efficiency']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Daily Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value, name) => [
                `${value} ${name === 'timeSpent' ? 'min' : 'tasks'}`,
                name === 'timeSpent' ? 'Time Spent' : 'Tasks Completed'
              ]}
            />
            <Line type="monotone" dataKey="timeSpent" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="tasksCompleted" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performing Tasks Table */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Top Performing Tasks</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-300 py-2">Task</th>
                <th className="text-left text-gray-300 py-2">Time Spent</th>
                <th className="text-left text-gray-300 py-2">Time Goal</th>
                <th className="text-left text-gray-300 py-2">Efficiency</th>
                <th className="text-left text-gray-300 py-2">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {getTopPerformingTasks().map((task, index) => (
                <tr key={task.taskId} className="border-b border-gray-700/50">
                  <td className="py-3 text-white">{task.taskName}</td>
                  <td className="py-3 text-gray-300">{task.timeSpent} min</td>
                  <td className="py-3 text-gray-300">{task.timeGoal} min</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.efficiency >= 100 ? 'bg-green-900/20 text-green-400' :
                      task.efficiency >= 75 ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-red-900/20 text-red-400'
                    }`}>
                      {task.efficiency}%
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{task.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskAnalytics;
