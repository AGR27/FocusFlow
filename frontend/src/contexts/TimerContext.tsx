"use client";

// src/contexts/TimerContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { SessionItem, SessionTask, TaskItem } from '@/types';

interface TimerState {
  isRunning: boolean;
  isBreak: boolean;
  timeLeft: number;
  totalTime: number;
  currentPhase: 'focus' | 'break' | 'longBreak';
  cycles: number;
  isPaused: boolean;
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (duration?: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipPhase: () => void;
  setFocusTime: (minutes: number) => void;
  setBreakTime: (minutes: number) => void;
  setLongBreakTime: (minutes: number) => void;
  setCycles: (cycles: number) => void;
  // Session data
  currentSession: Partial<SessionItem> | null;
  sessionTasks: SessionTask[];
  updateSessionData: (data: Partial<SessionItem>) => void;
  addTaskToSession: (task: TaskItem) => void;
  removeTaskFromSession: (taskId: string) => void;
  updateTaskTime: (taskId: string, time: number) => void;
  saveSession: () => Promise<void>;
  // UI state
  showSessionForm: boolean;
  setShowSessionForm: (show: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isBreak: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    currentPhase: 'focus',
    cycles: 0,
    isPaused: false,
  });

  // Session data
  const [currentSession, setCurrentSession] = useState<Partial<SessionItem> | null>(null);
  const [sessionTasks, setSessionTasks] = useState<SessionTask[]>([]);
  const [showSessionForm, setShowSessionForm] = useState(false);

  // Timer settings (stored in localStorage)
  const [focusTime, setFocusTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [cycles, setCycles] = useState(4);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedFocusTime = localStorage.getItem('pomodoro-focus-time');
    const savedBreakTime = localStorage.getItem('pomodoro-break-time');
    const savedLongBreakTime = localStorage.getItem('pomodoro-long-break-time');
    const savedCycles = localStorage.getItem('pomodoro-cycles');

    if (savedFocusTime) setFocusTime(parseInt(savedFocusTime));
    if (savedBreakTime) setBreakTime(parseInt(savedBreakTime));
    if (savedLongBreakTime) setLongBreakTime(parseInt(savedLongBreakTime));
    if (savedCycles) setCycles(parseInt(savedCycles));
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pomodoro-focus-time', focusTime.toString());
    localStorage.setItem('pomodoro-break-time', breakTime.toString());
    localStorage.setItem('pomodoro-long-break-time', longBreakTime.toString());
    localStorage.setItem('pomodoro-cycles', cycles.toString());
  }, [focusTime, breakTime, longBreakTime, cycles]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && !timerState.isPaused) {
      interval = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
            // Timer finished
            return {
              ...prev,
              isRunning: false,
              timeLeft: 0,
            };
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.isPaused]);

  // Handle timer completion
  useEffect(() => {
    if (timerState.timeLeft === 0 && timerState.isRunning) {
      handleTimerComplete();
    }
  }, [timerState.timeLeft, timerState.isRunning]);

  // Initialize session data when timer starts
  useEffect(() => {
    if (timerState.isRunning && !currentSession) {
      setCurrentSession({
        session_minutes: timerState.totalTime,
        focus_minutes: timerState.currentPhase === 'focus' ? timerState.totalTime : 0,
        prod_level: 5,
        mood_x: 0,
        mood_y: 0,
        break_activity: null,
        break_satisfaction: 5,
        user_id: user?.id || '',
      });
    }
  }, [timerState.isRunning, currentSession, timerState.totalTime, timerState.currentPhase, user?.id]);

  const handleTimerComplete = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
    }));
  };

  const startTimer = (duration?: number) => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      timeLeft: duration || prev.timeLeft,
      totalTime: duration || prev.totalTime,
    }));
  };

  const pauseTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const resetTimer = () => {
    setTimerState({
      isRunning: false,
      isBreak: false,
      timeLeft: focusTime * 60,
      totalTime: focusTime * 60,
      currentPhase: 'focus',
      cycles: 0,
      isPaused: false,
    });
    setCurrentSession(null);
    setSessionTasks([]);
  };

  const skipPhase = () => {
    handleTimerComplete();
  };

  const updateSessionData = (data: Partial<SessionItem>) => {
    setCurrentSession(prev => ({
      ...prev,
      ...data,
    }));
  };

  const addTaskToSession = async (task: TaskItem) => {
    if (!user || !currentSession) return;

    try {
      const { data, error } = await supabase
        .from('session_tasks')
        .insert({
          session_id: currentSession.id || 'temp',
          task_id: task.id!,
          user_id: user.id,
          task_time: 0
        })
        .select(`
          *,
          task:tasks(*)
        `)
        .single();

      if (error) throw error;

      setSessionTasks(prev => [...prev, data]);
    } catch (e: any) {
      console.error('Error adding task to session:', e.message);
    }
  };

  const removeTaskFromSession = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('session_tasks')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessionTasks(prev => prev.filter(st => st.task_id !== taskId));
    } catch (e: any) {
      console.error('Error removing task from session:', e.message);
    }
  };

  const updateTaskTime = async (taskId: string, time: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('session_tasks')
        .update({ task_time: time })
        .eq('task_id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessionTasks(prev => 
        prev.map(st => 
          st.task_id === taskId ? { ...st, task_time: time } : st
        )
      );
    } catch (e: any) {
      console.error('Error updating task time:', e.message);
    }
  };

  const saveSession = async () => {
    if (!user || !currentSession) return;

    try {
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          session_minutes: Math.floor((currentSession.session_minutes || 0) / 60),
          focus_minutes: Math.floor((currentSession.focus_minutes || 0) / 60),
          prod_level: currentSession.prod_level || 5,
          mood_x: currentSession.mood_x || 0,
          mood_y: currentSession.mood_y || 0,
          break_activity: currentSession.break_activity || null,
          break_satisfaction: currentSession.break_satisfaction || 5,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update session tasks with actual session ID
      if (sessionTasks.length > 0) {
        const { error: updateTasksError } = await supabase
          .from('session_tasks')
          .update({ session_id: sessionData.id })
          .eq('user_id', user.id)
          .in('id', sessionTasks.map(st => st.id));

        if (updateTasksError) throw updateTasksError;
      }

      // Reset session data
      setCurrentSession(null);
      setSessionTasks([]);
      setShowSessionForm(false);

    } catch (e: any) {
      console.error('Error saving session:', e.message);
    }
  };

  const value: TimerContextType = {
    timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    setFocusTime,
    setBreakTime,
    setLongBreakTime,
    setCycles,
    currentSession,
    sessionTasks,
    updateSessionData,
    addTaskToSession,
    removeTaskFromSession,
    updateTaskTime,
    saveSession,
    showSessionForm,
    setShowSessionForm,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
