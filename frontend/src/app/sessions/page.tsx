"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { SessionItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

// Data format for the bar chart
interface DailyData {
  name: string;
  minutes: number;
}

// Define the type for the two possible views
type ViewMode = 'weekly' | 'all';

// Component to display a single session card
const SessionCard: React.FC<{ session: SessionItem }> = ({ session }) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center">
    <div className="flex-1">
      <p className="text-lg font-semibold text-white">
        Session on {new Date(session.created_at || '').toLocaleDateString()}
      </p>
      {/* {session.task && (
        <p className="text-sm text-gray-400 mt-1">
          Task: <span className="text-blue-300 font-medium">{session.task}</span>
        </p>
      )}
      {session.class && (
        <p className="text-sm text-gray-400">
          Class: <span className="text-purple-300 font-medium">{session.class}</span>
        </p>
      )} */}
    </div>
    <div className="mt-2 sm:mt-0 sm:ml-4 text-right">
      <p className="text-sm text-gray-400">
        Duration: <span className="text-white font-medium">{session.session_minutes} min</span>
      </p>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-block ${
          session.prod_level >= 7 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}
      >
        {session.prod_level >= 7 ? 'Productive' : 'Distracted'}
      </span>
    </div>
  </div>
);

const Sessions: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  // State for calculated analytics
  const [totalWeeklyMinutes, setTotalWeeklyMinutes] = useState(0);
  const [averageDailyMinutes, setAverageDailyMinutes] = useState(0);
  const [productivityPercentage, setProductivityPercentage] = useState(0);
  const [dailyChartData, setDailyChartData] = useState<DailyData[]>([]);
  const [taskBreakdown, setTaskBreakdown] = useState<{ name: string; minutes: number }[]>([]);
  const [classBreakdown, setClassBreakdown] = useState<{ name: string; minutes: number }[]>([]);

  useEffect(() => {
    const fetchAndProcessSessions = async () => {
      if (authLoading || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sessionError) throw sessionError;

        setSessions(sessionData || []);
        
        // Data Processing for Analytics
        if (sessionData && sessionData.length > 0) {
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const recentSessions = sessionData.filter(session => new Date(session.created_at) > oneWeekAgo);

          // Calculate total minutes for the last week
          const weeklyMinutes = recentSessions.reduce((sum, session) => sum + session.session_minutes, 0);
          setTotalWeeklyMinutes(weeklyMinutes);

          // Calculate productivity percentage
          const productiveSessions = recentSessions.filter(session => session.prod_level >= 7);
          const productivityPercent = recentSessions.length > 0 ? (productiveSessions.length / recentSessions.length) * 100 : 0;
          setProductivityPercentage(Math.round(productivityPercent));

          // Calculate data for the daily bar chart
          const dailyTotals: { [key: string]: number } = {};
          for (let i = 0; i < 7; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            dailyTotals[date.toDateString()] = 0;
          }
          recentSessions.forEach(session => {
            const dateString = new Date(session.created_at).toDateString();
            dailyTotals[dateString] = (dailyTotals[dateString] || 0) + session.session_minutes;
          });
          const chartData = Object.keys(dailyTotals).map(dateString => ({
            name: new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' }),
            minutes: dailyTotals[dateString],
          }));
          setDailyChartData(chartData.reverse());
          
          const uniqueDays = new Set(recentSessions.map(session => new Date(session.created_at).toDateString()));
          const avgMinutes = uniqueDays.size > 0 ? weeklyMinutes / uniqueDays.size : 0;
          setAverageDailyMinutes(Math.round(avgMinutes));

          // Calculate task and class breakdowns
          const taskMap: { [key: string]: number } = {};
          const classMap: { [key: string]: number } = {};
          recentSessions.forEach(session => {
            if (session.task) {
              taskMap[session.task] = (taskMap[session.task] || 0) + session.duration_minutes;
            }
            if (session.class) {
              classMap[session.class] = (classMap[session.class] || 0) + session.duration_minutes;
            }
          });
          
          const sortedTasks = Object.keys(taskMap).sort((a, b) => taskMap[b] - taskMap[a]);
          const topTasks = sortedTasks.slice(0, 5).map(name => ({ name, minutes: taskMap[name] }));
          const otherTaskMinutes = sortedTasks.slice(5).reduce((sum, name) => sum + taskMap[name], 0);
          if (otherTaskMinutes > 0) {
            topTasks.push({ name: 'Other', minutes: otherTaskMinutes });
          }
          setTaskBreakdown(topTasks);

          const sortedClasses = Object.keys(classMap).sort((a, b) => classMap[b] - classMap[a]);
          const topClasses = sortedClasses.slice(0, 5).map(name => ({ name, minutes: classMap[name] }));
          const otherClassMinutes = sortedClasses.slice(5).reduce((sum, name) => sum + classMap[name], 0);
          if (otherClassMinutes > 0) {
            topClasses.push({ name: 'Other', minutes: otherClassMinutes });
          }
          setClassBreakdown(topClasses);

        }

      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessSessions();
  }, [user, authLoading]);

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen bg-gray-900 text-white font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-3xl font-extrabold text-blue-400 mb-4 sm:mb-0">Session History</h2>
        <div className="flex gap-2 p-1 bg-gray-800 rounded-full border border-gray-700">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              viewMode === 'weekly' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-300 hover:bg-gray-700'
            }`}
          >
            Weekly Summary
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              viewMode === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Sessions
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center">Loading session data...</p>
      ) : error ? (
        <p className="text-red-400 text-center">Error: {error}</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-400 text-center">You haven&apos;t completed any sessions yet. Get to work!</p>
      ) : (
        <>
          {viewMode === 'weekly' && (
            <div className="flex flex-col gap-8">
              {/* Top-level Analytics */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400 uppercase tracking-widest">Total Minutes This Week</p>
                  <p className="text-4xl font-bold text-white mt-2">{totalWeeklyMinutes}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 uppercase tracking-widest">Avg. Minutes/Day</p>
                  <p className="text-4xl font-bold text-white mt-2">{averageDailyMinutes}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 uppercase tracking-widest">Productivity Rate</p>
                  <p className="text-4xl font-bold text-white mt-2">{productivityPercentage}%</p>
                </div>
              </div>

              {/* Bar Graph */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Time Spent per Day (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyChartData}>
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      formatter={(value) => [`${value} min`, 'Duration']}
                    />
                    <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="minutes" position="top" style={{ fill: '#ffffff' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown by Task and Class */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">Time by Task</h3>
                  <div className="space-y-2">
                    {taskBreakdown.length > 0 ? (
                      taskBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-gray-300">
                          <span className="font-medium text-white">{item.name}</span>
                          <span className="text-sm">{item.minutes} min</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No tasks recorded this week.</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">Time by Class</h3>
                  <div className="space-y-2">
                    {classBreakdown.length > 0 ? (
                      classBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-gray-300">
                          <span className="font-medium text-white">{item.name}</span>
                          <span className="text-sm">{item.minutes} min</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No classes recorded this week.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'all' && (
            <div className="flex flex-col gap-8">
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-4">Complete Session Log</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {sessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Sessions;