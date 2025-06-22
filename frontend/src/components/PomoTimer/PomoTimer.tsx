"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import ProductivitySlider from "@/components/PomoTimer/ProductivitySlider"; 
import MoodGrid from "@/components/PomoTimer/MoodGrid"; 

// Define the possible modes for the timer state machine
type Mode = "setup" | "focus" | "focusQuestions" | "break" | "breakQuestions" | "sessionEnd";

export default function PomoTimer() {
  // --- Session Settings State ---
  // This will store the *parsed* total session duration in minutes (used for calculations)
  const [sessionMinutes, setSessionMinutes] = useState(30); 
  // This will store the string the user types into the clock display (e.g., "25:00", "05:30").
  // This is what directly controls the <input>'s value in setup mode.
  const [displayTimeInput, setDisplayTimeInput] = useState('30:00'); 
  // State to track if the time input field is currently focused
  const [isTimeInputFocused, setIsTimeInputFocused] = useState(false);

  // Break time in minutes
  const [breakMinutes, setBreakMinutes] = useState(5); // Default to 5 minutes

  // Focus time in minutes
  const [focusMinutes, setFocusMinutes] = useState(25);

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
  // Calculate actual session duration in seconds from the parsed sessionMinutes
  const sessionDurationSeconds = sessionMinutes * 60;
  // Calculate focus duration in seconds from session and break durations
  const focusDurationSeconds = focusMinutes * 60;
  // Calculate actual break duration in seconds
  const breakDurationSeconds = sessionDurationSeconds - focusDurationSeconds;


  // --- Helper to format seconds into MM:SS ---
  // Memoized for performance
  const formatTime = useCallback((totalSeconds: number) => {
    const absSeconds = Math.max(0, totalSeconds); // Ensure non-negative display
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // --- Effect to initialize display time and update when sessionMinutes changes ---
  // This ensures that when we reset or the sessionMinutes changes, the input display updates
  useEffect(() => {
    if (mode === "setup" && !isTimeInputFocused) { // Only update if in setup mode and not actively typing
      setDisplayTimeInput(formatTime(sessionMinutes * 60));
      setTimeLeft(sessionMinutes * 60); // Keep timeLeft in sync for initial display before start
    }
  }, [sessionMinutes, mode, formatTime, isTimeInputFocused]);


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

  useEffect(() => {
  if (mode === "setup") {
    setTitle("Session Setup"); // Or "Session Time", whatever you prefer
  } else if (mode === "focus") {
    setTitle("Focus Time");
  } else if (mode === "break") {
    setTitle("Break Time");
  } else if (mode === "focusQuestions") {
    setTitle("Focus Feedback");
  } else if (mode === "breakQuestions") {
    setTitle("Break Feedback");
  } else if (mode === "sessionEnd") {
    setTitle("Session Ended");
  }
}, [mode]);

  // --- Handlers for User Interactions ---

  // Handles changes to the main clock display input field (MM:SS format)
  const handleTimeDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    setDisplayTimeInput(rawInput); // Update what the user sees immediately in the input field

    // --- Intelligent Parsing Logic ---
    let minutes = 0;
    let seconds = 0;

    // Remove any non-digit, non-colon characters
    const cleanedInput = rawInput.replace(/[^0-9:]/g, '');

    // Handle single digit inputs (e.g., "5" means 5 minutes)
    // Handle "MMSS" format (e.g., "2500" means 25 minutes)
    // Handle "M:SS" or "MM:SS" format
    
    const parts = cleanedInput.split(':');
    
    if (parts.length > 2) { // Too many colons, just take first two parts
        minutes = parseInt(parts[0] || '0', 10);
        seconds = parseInt(parts[1] || '0', 10);
    } else if (parts.length === 2) { // MM:SS or M:SS
        minutes = parseInt(parts[0] || '0', 10);
        seconds = parseInt(parts[1] || '0', 10);
    } else if (parts.length === 1) { // Single part
        const num = parseInt(parts[0] || '0', 10);
        if (num > 0 && rawInput.length > 2) { // Assume MMSS if more than 2 digits and no colon
            minutes = Math.floor(num / 100);
            seconds = num % 100;
        } else { // Assume it's just minutes if 2 or fewer digits or starts with 0
            minutes = num;
        }
    }

    // Basic validation/normalization: seconds max 59
    if (seconds > 59) {
        minutes += Math.floor(seconds / 60);
        seconds = seconds % 60;
    }

    // Update the sessionMinutes state for calculations
    setSessionMinutes(minutes + Math.floor(seconds / 60)); // Only count full minutes for sessionMinutes
  };

  // When the input loses focus, format the displayTimeInput to MM:SS
  const handleTimeInputBlur = () => {
    setIsTimeInputFocused(false);
    setDisplayTimeInput(formatTime(sessionMinutes * 60)); // Ensure proper formatting
  };

  // When the input gains focus, try to simplify the display for easier typing
  const handleTimeInputFocus = () => {
    setIsTimeInputFocused(true);
    // If the current time is exactly X:00, just show "X" for easier re-typing
    const currentTotalSeconds = sessionMinutes * 60;
    if (currentTotalSeconds > 0) {
      const minutes = Math.floor(currentTotalSeconds / 60);
      const seconds = currentTotalSeconds % 60;
      // if (seconds === 0) {
      //   setDisplayTimeInput(minutes.toString());
      // } else {
      //   // Otherwise, show M:SS but allow free typing over it
        setDisplayTimeInput(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      // }
    }
  };



  // Handles changes to the "Break Time" slider
  const handleBreakSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFocusMinutes(Number(e.target.value));
  };

  // Initiates the Pomodoro session
  const handleStartSession = () => {
    // Ensure calculated session duration is valid before starting
    if (focusDurationSeconds < 0) {
      alert("Please enter a valid session duration >= than 0.");
      return;
    }
    setTimeLeft(focusDurationSeconds); // Initialize timeLeft with the derived session duration
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
    setTimeLeft(0); // Clear timeLeft, it will be reset by duration input in setup phase
    setMood(null); // Reset feedback
    setProductivity(5); // Reset feedback
    setSessionMinutes(30); // Reset session minutes to default
    setDisplayTimeInput('30:00'); // Reset display input to default
    setBreakMinutes(5); // Reset break percentage to default
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
    setSessionMinutes(25); // Reset session minutes to default
    setDisplayTimeInput('25:00'); // Reset display input to default
    setBreakMinutes(5); // Reset break percentage to default
  };

  const [title, setTitle] = useState("Pomodoro Timer");

  const focusPercentageForSlider = sessionMinutes === 0 
  ? 0 
  : (focusMinutes / sessionMinutes) * 100;

  return (
    <div className="p-8 max-w-3xl mx-auto my-10 bg-gray-900 text-white rounded-xl shadow-2xl space-y-8 md:p-10">
      <h1 className="text-4xl font-extrabold text-center mb-6 text-blue-400">{title}</h1>

      {/* Clock Display Input (editable in setup, display-only otherwise) */}
      <div className="relative text-7xl font-mono text-center p-6 bg-gray-800 rounded-lg border-2 border-blue-600 shadow-inner">
        {mode === "setup" ? (
          <input
            type="text"
            value={isTimeInputFocused ? displayTimeInput : formatTime(sessionMinutes * 60)}
            onChange={handleTimeDisplayChange}
            onBlur={handleTimeInputBlur}
            onFocus={handleTimeInputFocus}
            className="w-full bg-transparent text-white text-center focus:outline-none focus:ring-0"
            // No maxLength, allowing flexible typing. Parsing logic handles truncation/formatting.
          />
        ) : (
          <span>{formatTime(timeLeft)}</span> // Displays countdown when active
        )}
        {(mode === "setup" || mode === "focus" || mode === "break") && (
          <span className="text-base text-gray-400 block mt-2">
            {mode === "setup" ? "Session Time" : mode === "focus" ? "Focus Time" : "Break Time"}
          </span>
        )}
      </div>

      {/* Conditional Rendering based on Mode */}
      {mode === "setup" && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <label htmlFor="break-slider" className="text-lg font-medium min-w-[150px] mb-2 sm:mb-0">
              Focus Time: {formatTime(focusMinutes)}
            </label>
            <div className="flex-1 flex items-center space-x-4">
              <input
                type="range"
                id="focus-break-slider"
                min="0"
                max={sessionMinutes}
                step="1"
                value={focusMinutes}
                onChange={handleBreakSliderChange}
                style={{
            background: `linear-gradient(to right, 
              rgb(74, 236, 52) 0%,    /* Green for Focus (starts at 0%) */
              rgb(74, 236, 52) ${focusPercentageForSlider}%, /* Green extends up to focus percentage */
              rgb(151, 21, 250) ${focusPercentageForSlider}%, /* Yellow for Break (starts where green ends) */
              rgb(151, 21, 250) 100%   /* Yellow extends to 100% */
            )`
          }}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-blue-300 font-medium">
                Break Time: {formatTime(breakDurationSeconds)}
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