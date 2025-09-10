"use client";

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Play, Pause, Square, Clock } from 'lucide-react';

const GlobalTimer: React.FC = () => {
  const { timerState, startTimer, pauseTimer, resetTimer } = useTimer();
  const [isMinimized, setIsMinimized] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    if (timerState.currentPhase === 'focus') return 'bg-red-600';
    if (timerState.currentPhase === 'break') return 'bg-green-600';
    if (timerState.currentPhase === 'longBreak') return 'bg-blue-600';
    return 'bg-gray-600';
  };

  const getPhaseText = () => {
    if (timerState.currentPhase === 'focus') return 'Focus';
    if (timerState.currentPhase === 'break') return 'Break';
    if (timerState.currentPhase === 'longBreak') return 'Long Break';
    return 'Timer';
  };

  if (!timerState.isRunning && timerState.timeLeft === timerState.totalTime) {
    return null; // Don't show timer when it's not running and at default state
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-16 h-16' : 'w-80'
    }`}>
      <div className={`${getPhaseColor()} rounded-lg shadow-lg p-4 text-white ${
        isMinimized ? 'w-16 h-16 flex items-center justify-center' : ''
      }`}>
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center justify-center w-full h-full"
          >
            <Clock size={24} />
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{getPhaseText()}</h3>
                <p className="text-2xl font-mono font-bold">
                  {formatTime(timerState.timeLeft)}
                </p>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {timerState.isRunning ? (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                >
                  <Pause size={14} />
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => startTimer()}
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                >
                  <Play size={14} />
                  {timerState.timeLeft === 0 ? 'Restart' : 'Resume'}
                </button>
              )}
              
              <button
                onClick={resetTimer}
                className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
              >
                <Square size={14} />
                Reset
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-1000"
                style={{
                  width: `${((timerState.totalTime - timerState.timeLeft) / timerState.totalTime) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalTimer;
