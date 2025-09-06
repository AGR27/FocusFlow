"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { SessionItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import TaskAnalytics from '@/components/dashboard/TaskAnalytics';
import { Clock, Target, TrendingUp, Activity } from 'lucide-react';

// Data format for the bar chart
interface DailyData {
  name: string;
  minutes: number;
}

// Define the type for the two possible views
type ViewMode = 'overview' | 'tasks' | 'sessions';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // State for calculated analytics
  const [totalWeeklyMinutes, setTotalWeeklyMinutes] = useState(0);
  const [averageDailyMinutes, setAverageDailyMinutes] = useState(0);
  const [productivityPercentage, setProductivityPercentage] = useState(0);
  const [dailyChartData, setDailyChartData] = useState<DailyData[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  // const [avgSessionLength, setAvgSessionLength] = useState(0);

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

          // Calculate total sessions and average session length
          setTotalSessions(sessionData.length);
          const avgLength = sessionData.reduce((sum, session) => sum + session.session_minutes, 0) / sessionData.length;
          // setAvgSessionLength(Math.round(avgLength));
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
        <h1 className="text-4xl font-extrabold text-blue-400 mb-4 sm:mb-0">Dashboard</h1>
        <div className="flex gap-2">
          <div className="flex gap-2 p-1 bg-gray-800 rounded-full border border-gray-700">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                viewMode === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-300 hover:bg-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                viewMode === 'tasks' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-300 hover:bg-gray-700'
              }`}
            >
              Task Analytics
            </button>
            <button
              onClick={() => setViewMode('sessions')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                viewMode === 'sessions' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-300 hover:bg-gray-700'
              }`}
            >
              Sessions
            </button>
          </div>
        </div>
      </div>

      {authLoading ? (
        <p className="text-gray-400 text-center">Loading authentication...</p>
      ) : !user ? (
        <p className="text-red-400 text-center">Please log in to access the dashboard.</p>
      ) : isLoading ? (
        <p className="text-gray-400 text-center">Loading dashboard data...</p>
      ) : error ? (
        <p className="text-red-400 text-center">Error: {error}</p>
      ) : (
        <>
          {viewMode === 'overview' && (
            <div className="flex flex-col gap-8">
              {/* Top-level Analytics */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 border border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-8 w-8 text-blue-400 mr-2" />
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Total Minutes This Week</p>
                  </div>
                  <p className="text-4xl font-bold text-white mt-2">{totalWeeklyMinutes}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-8 w-8 text-green-400 mr-2" />
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Avg. Minutes/Day</p>
                  </div>
                  <p className="text-4xl font-bold text-white mt-2">{averageDailyMinutes}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-yellow-400 mr-2" />
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Productivity Rate</p>
                  </div>
                  <p className="text-4xl font-bold text-white mt-2">{productivityPercentage}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="h-8 w-8 text-purple-400 mr-2" />
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Total Sessions</p>
                  </div>
                  <p className="text-4xl font-bold text-white mt-2">{totalSessions}</p>
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
                      formatter={(value, name) => [`${value} min`, 'Duration']}
                    />
                    <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="minutes" position="top" style={{ fill: '#ffffff' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Sessions */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">
                          Session on {new Date(session.created_at || '').toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {session.session_minutes} min • Productivity: {session.prod_level}/10
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          session.prod_level >= 7 ? 'bg-green-500 text-white' : 
                          session.prod_level >= 5 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {session.prod_level >= 7 ? 'High' : session.prod_level >= 5 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'tasks' && user && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Task Analytics</h2>
                <div className="flex gap-2">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
                    className="px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
              <TaskAnalytics userId={user.id} timeRange={timeRange} />
            </div>
          )}

          {viewMode === 'sessions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Session History</h2>
              <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                <div className="space-y-4">
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <div key={session.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-white">
                            Session on {new Date(session.created_at || '').toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>Duration: {session.session_minutes} min</span>
                            <span>Focus: {session.focus_minutes} min</span>
                            <span>Productivity: {session.prod_level}/10</span>
                            <span>Mood: ({session.mood_x}, {session.mood_y})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            session.prod_level >= 7 ? 'bg-green-500 text-white' : 
                            session.prod_level >= 5 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {session.prod_level >= 7 ? 'High' : session.prod_level >= 5 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">No sessions recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
