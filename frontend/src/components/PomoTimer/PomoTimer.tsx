"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import ProductivitySlider from "@/components/PomoTimer/ProductivitySlider"; 
import MoodGrid from "@/components/PomoTimer/MoodGrid"; 

// Define the possible modes for the timer state machine
type Mode = "setup" | "focus" | "focusQuestions" | "break" | "breakQuestions" | "sessionEnd";

export default function PomoTimer() {
  // --- Session Settings State ---
  // Input for total session time (string to allow partial input like '2')
  const [totalMinutesInput, setTotalMinutesInput] = useState('25'); // Default to 25 minutes
  // Break time as a percentage of the total session duration
  const [breakPercentage, setBreakPercentage] = useState(20); // Default to 20%

  // --- Timer Operational State ---
  const [mode, setMode] = useState<Mode>("setup"); // Current phase of the Pomodoro cycle
  const [timeLeft, setTimeLeft] = useState(0); // Time remaining in current phase, in seconds
  const [isPaused, setIsPaused] = useState(false); // Whether the timer is paused

  // --- Feedback State (for MoodGrid and ProductivitySlider) ---
  const [mood, setMood] = useState<{ x: number; y: number; color: string } | null>(null);
  const [productivity, setProductivity] = useState(5); // Default productivity level for slider

  // Ref to hold the setInterval ID, allowing us to clear it reliably
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Derived Durations (in seconds) ---
  // Memoize these calculations to only re-run when inputs change
  const sessionDurationSeconds = parseInt(totalMinutesInput, 10) * 60 || 0;
  const breakDurationSeconds = Math.floor(sessionDurationSeconds * (breakPercentage / 100));

  // --- Helper to format seconds into MM:SS ---
  const formatTime = useCallback((totalSeconds: number) => {
    const absSeconds = Math.max(0, totalSeconds); // Ensure non-negative display
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // --- Main Timer Logic useEffect ---
  useEffect(() => {
    // Clear any existing interval to prevent multiple timers running
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only run timer logic if in focus or break mode AND not paused
    if ((mode === "focus" || mode === "break") && !isPaused) {
      // If time runs out, transition to the next phase
      if (timeLeft <= 0) {
        if (mode === "focus") {
          setMode("focusQuestions"); // Session ended, ask questions
        } else { // mode === "break"
          setMode("breakQuestions"); // Break ended, ask questions
        }
        // No new interval set here; the timer logic is handled by the mode transition
        return;
      }

      // If timeLeft is greater than 0, set up the countdown interval
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    // Cleanup function: Clear the interval when the component unmounts,
    // or when dependencies change (stopping the previous interval before a new one might start)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, mode, isPaused]); // Dependencies: timeLeft, mode, and isPaused

  // --- Handlers for User Interactions ---

  // Handles changes to the "Total Session Time" input field
  const handleTotalTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or only digits
    if (value === '' || /^\d+$/.test(value)) {
      setTotalMinutesInput(value);
    }
  };

  // Handles changes to the "Break Time" slider
  const handleBreakSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBreakPercentage(Number(e.target.value));
  };

  // Initiates the Pomodoro session
  const handleStartSession = () => {
    // Ensure input is valid before starting
    if (isNaN(parseInt(totalMinutesInput, 10)) || parseInt(totalMinutesInput, 10) <= 0) {
      alert("Please enter a valid session duration greater than 0 minutes.");
      return;
    }
    setTimeLeft(sessionDurationSeconds); // Initialize timeLeft with calculated session duration
    setMode("focus"); // Start the focus phase
    setIsPaused(false); // Ensure not paused when starting
  };

  // Pauses the current countdown
  const handlePause = () => {
    setIsPaused(true);
  };

  // Resumes the countdown from where it left off
  const handleResume = () => {
    setIsPaused(false);
  };

  // Resets the timer to its initial setup state
  const handleReset = () => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    setMode("setup");
    setIsPaused(false);
    setTimeLeft(0); // Clear timeLeft, it will be reset by duration input
    setMood(null); // Reset feedback
    setProductivity(5); // Reset feedback
    setTotalMinutesInput('25'); // Reset input to default
    setBreakPercentage(20); // Reset break percentage to default
  };

  // Handles submission after focus questions, transitions to break
  const handleSubmitFocusFeedbackAndStartBreak = () => {
    console.log("Focus Feedback:", { mood, productivity });
    setTimeLeft(breakDurationSeconds); // Initialize timeLeft for break
    setMode("break"); // Start the break phase
    setIsPaused(false); // Ensure not paused when starting break
  };

  // Handles submission after break questions, transitions to session end
  const handleSubmitBreakFeedbackAndEndSession = () => {
    console.log("Break Feedback Submitted (if any)"); // No explicit feedback for break end in UI
    setMode("sessionEnd"); // Transition to session end
    setIsPaused(false); // Ensure not paused
  };

  // Handles starting a new session from sessionEnd
  const handleNewSession = () => {
    setMode("setup");
    setIsPaused(false);
    setTimeLeft(0); // TimeLeft will be reset by duration input in setup
    setMood(null);
    setProductivity(5);
    setTotalMinutesInput('25'); // Reset input to default
    setBreakPercentage(20); // Reset break percentage to default
  };

  // --- Render Logic ---
  const currentDisplayTime = mode === "setup" ? formatTime(sessionDurationSeconds) : formatTime(timeLeft);

  return (
    <div className="p-8 max-w-lg mx-auto my-10 bg-gray-900 text-white rounded-xl shadow-2xl space-y-8 md:p-10">
      <h1 className="text-4xl font-extrabold text-center mb-6 text-blue-400">Pomodoro Timer</h1>

      {/* Clock Display */}
      <div className="text-7xl font-mono text-center p-6 bg-gray-800 rounded-lg border-2 border-blue-600 shadow-inner">
        {currentDisplayTime}
        {(mode === "focus" || mode === "break") && <span className="text-base text-gray-400 block mt-2">{mode === "focus" ? "Focus Time" : "Break Time"}</span>}
      </div>

      {/* Conditional Rendering based on Mode */}
      {mode === "setup" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <label htmlFor="total-time" className="text-lg font-medium min-w-[150px] mb-2 sm:mb-0">
              Total Session (mins):
            </label>
            <input
              type="text" // Use text to allow partial numbers, handle parsing in logic
              id="total-time"
              value={totalMinutesInput}
              onChange={handleTotalTimeInputChange}
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl text-center"
              placeholder="e.g., 25"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <label htmlFor="break-slider" className="text-lg font-medium min-w-[150px] mb-2 sm:mb-0">
              Break Time ({breakPercentage}%):
            </label>
            <div className="flex-1 flex items-center space-x-4">
              <input
                type="range"
                id="break-slider"
                min="0"
                max="50"
                step="5"
                value={breakPercentage}
                onChange={handleBreakSliderChange}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-blue-300 font-medium">
                ({formatTime(breakDurationSeconds)})
              </span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sessionDurationSeconds <= 0} // Disable if input is invalid or 0
          >
            Start Session
          </button>
        </div>
      )}

      {/* Focus / Break Active Timer Display */}
      {(mode === "focus" || mode === "break") && (
        <div className="flex justify-center space-x-4 mt-8">
          {isPaused ? (
            <button
              onClick={handleResume}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
        </div>
      )}

      {/* Focus Questions Phase */}
      {mode === "focusQuestions" && (
        <div className="space-y-6 text-center">
          <h2 className="text-3xl font-bold text-green-400">Focus Session Ended!</h2>
          <p className="text-xl">How was your focus during this session?</p>
          {/* Removed initialMood prop as per your MoodGrid definition */}
          <MoodGrid onChange={(m) => setMood(m)} /> 
          <ProductivitySlider onChange={(val) => setProductivity(val)} initialValue={productivity} />
          <button
            onClick={handleSubmitFocusFeedbackAndStartBreak}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit & Start Break
          </button>
        </div>
      )}

      {/* Break Questions Phase */}
      {mode === "breakQuestions" && (
        <div className="space-y-6 text-center">
          <h2 className="text-3xl font-bold text-yellow-400">Break Time Ended!</h2>
          <p className="text-xl">Time to get back to focus!</p>
          {/* Optionally add break feedback here, e.g., how restorative was the break */}
          <button
            onClick={handleSubmitBreakFeedbackAndEndSession}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            End Session
          </button>
        </div>
      )}

      {/* Session End Phase */}
      {mode === "sessionEnd" && (
        <div className="space-y-6 text-center">
          <h2 className="text-3xl font-bold text-gray-400">Session Complete!</h2>
          <p className="text-xl">Ready for a new productive cycle?</p>
          <button
            onClick={handleNewSession}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
}
