"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import ProductivitySlider from "@/components/PomoTimer/ProductivitySlider"; 
import MoodGrid from "@/components/PomoTimer/MoodGrid"; 

// Define the possible modes for the timer state machine
type Mode = "setup" | "focus" | "focusQuestions" | "break" | "breakQuestions" | "sessionEnd";

export default function PomoTimer() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // --- Session Settings State ---
  // This will store the *parsed* total session duration in minutes (used for calculations)
  const [sessionMinutes, setSessionMinutes] = useState(30); 
  const [displayInputString, setDisplayInputString] = useState('');

  // Focus time in minutes
  const [focusMinutes, setFocusMinutes] = useState(25);

  // --- Timer Operational State ---
  const [mode, setMode] = useState<Mode>("setup"); // Current phase of the Pomodoro cycle
  const [timeLeft, setTimeLeft] = useState(0); // Time remaining in current phase, in seconds
  const [isPaused, setIsPaused] = useState(false); // Whether the timer is paused

  // --- Feedback State (for MoodGrid and ProductivitySlider) ---
  const [mood, setMood] = useState<{ x: number; y: number; color: string } | null>(null);
  const [productivity, setProductivity] = useState(5); // Default productivity level for slider
  const [breakActivity, setBreakActivity] = useState<string | null>(null); // Optional break activity
  const [breakSatisfaction, setBreakSatisfaction] = useState(0); // Optional break satisfaction rating

  // Ref to hold the setInterval ID, allowing us to clear it reliably
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref for the input element to control cursor position
  const timeInputRef = useRef<HTMLInputElement>(null);

  // --- Derived Durations (in seconds) ---
  // Calculate actual session duration in seconds from the parsed sessionMinutes
  const sessionDurationSeconds = sessionMinutes * 60;
  // Calculate focus duration in seconds from session and break durations
  const focusDurationSeconds = focusMinutes * 60;
  // Calculate actual break duration in seconds
  const breakDurationSeconds = sessionDurationSeconds - focusDurationSeconds;

  const ratioBreakToFocus = sessionDurationSeconds > 0 ? (breakDurationSeconds / sessionDurationSeconds) : 0;

  // --- Helper to format total minutes into H:MM:00 (for setup input) ---
  const formatTimeHMM00 = useCallback((totalMins: number) => {
    const absMins = Math.max(0, totalMins); 
    const hours = Math.floor(absMins / 60);
    const minutes = absMins % 60;
    // Ensure hours part is not padded with leading zero if it's a single digit
    const formattedHours = hours.toString();
    return `${formattedHours}:${minutes.toString().padStart(2, '0')}:00`; 
  }, []);

  // --- Helper to format seconds into MM:SS ---
  // Memoized for performance
  // --- Helper to format seconds into MM:SS (for countdown display) ---
  const formatTimeMMSS = useCallback((totalSeconds: number) => {
    const absSeconds = Math.max(0, totalSeconds); 
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const saveSession = async () => {
    if (!userId) {
      setSupabaseError("User ID is not available. Please sign in first.");
      return;
    }
    setIsSaving(true);
    setSaveMessage(null); // Clear previous messages
    setSupabaseError(null); // Clear previous errors
    try {
      const sessionData = {
        user_id: userId,
        session_minutes: sessionMinutes,
        focus_minutes: focusMinutes,
        prod_level: productivity, // Note: your state variable is `productivity`, the column is `prod_level`.
        mood_x: mood?.x || 0,
        mood_y: mood?.y || 0,
        break_activity: breakActivity || '',
        break_satisfaction: breakSatisfaction,
      };
      
      const { error: insertError } = await supabase
        .from('sessions')
        .insert(sessionData)
      
      if (insertError) {
        throw new Error(`Error saving session: ${insertError.message}`);
      }
      setSaveMessage("Session saved successfully!");
    }
    catch (error: any) {
      console.error("Error saving session:", error);
      setSupabaseError(error.message || "An unexpected error occurred while saving the session.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Effect to fetch user ID from Supabase ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setSupabaseError(error.message);
      }
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setSupabaseError("User is not signed in. Please sign in to save sessions.");
      }
      setIsSupabaseLoading(false);
    };
    fetchUser();
  }, []);

  // --- Effect to adjust focusMinutes when sessionMinutes changes ---
  useEffect(() => {
    if (mode === "setup") {
      setFocusMinutes(prevFocus => Math.min(Math.max(0, prevFocus), sessionMinutes));
    }
  }, [sessionMinutes, mode]); 

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
  }, [timeLeft, mode, isPaused, breakDurationSeconds]); // Dependencies: timeLeft, mode, and isPaused

  useEffect(() => {
  if (mode === "setup") {
    setTitle("Session Setup");
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

  // Handles changes to the main clock display input field (H:MM:00 format)
  const handleTimeDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Filter out non-numeric characters, but allow the colon for display
    const filteredValue = rawValue.replace(/[^0-9:]/g, '');
    setDisplayInputString(filteredValue);
    // No parsing or state updates for sessionMinutes here!
  };

  // When the input loses focus, ensure the buffer is synced with the current state
  const handleTimeInputBlur = () => {
    let hours = 0;
    let minutes = 0;

    // Split by colon to get parts
    const parts = displayInputString.split(':');

    if (parts.length === 1) {
        // Case: "123" (assume HHMM) or "5" (assume M)
        const digits = parts[0].replace(/[^0-9]/g, ''); // Ensure only digits
        if (digits.length === 0) {
            hours = 0; minutes = 0;
        } else if (digits.length <= 2) { // "5" -> 0:05, "25" -> 0:25
            minutes = parseInt(digits, 10);
        } else if (digits.length === 3) { // "123" -> 1:23
            hours = parseInt(digits.charAt(0), 10);
            minutes = parseInt(digits.substring(1, 3), 10);
        } else { // "1234" or more -> 12:34 (take last 4 digits)
            hours = parseInt(digits.substring(digits.length - 4, digits.length - 2), 10);
            minutes = parseInt(digits.substring(digits.length - 2, digits.length), 10);
        }
    } else if (parts.length >= 2) {
        // Case: "H:MM" or "H:" or ":MM" or "H:MM:SS" (take first two parts)
        hours = parseInt(parts[0].replace(/[^0-9]/g, '') || '0', 10);
        minutes = parseInt(parts[1].replace(/[^0-9]/g, '') || '0', 10);
    }

    // Normalize minutes (base 60)
    if (minutes > 59) {
        hours += Math.floor(minutes / 60);
        minutes = minutes % 60;
    }
    // Cap hours
    if (hours > 99) hours = 99; // Cap hours at 99 for display simplicity

    const newTotalMinutes = (hours * 60) + minutes;
    setSessionMinutes(newTotalMinutes); // Update the main sessionMinutes state

    // Update the displayInputString to the normalized H:MM:00 format
    setDisplayInputString(formatTimeHMM00(newTotalMinutes));

    // Force cursor to the end of minutes after blur
    requestAnimationFrame(() => {
      if (timeInputRef.current) {
        const secondColonIndex = formatTimeHMM00(newTotalMinutes).lastIndexOf(':');
        timeInputRef.current.setSelectionRange(secondColonIndex, secondColonIndex); 
      }
    });
  };

  // When the input gains focus, simplify display and set cursor
  const handleTimeInputFocus = () => {
    const currentTotalMinutes = sessionMinutes;
    const hours = Math.floor(currentTotalMinutes / 60);
    const minutes = currentTotalMinutes % 60;
    
    // Set displayInputString to H:MM (without the :00 seconds)
    setDisplayInputString(`${hours}:${minutes.toString().padStart(2, '0')}`);
    
    requestAnimationFrame(() => {
      if (timeInputRef.current) {
        // Place cursor at the end of the minutes part (after the MM in H:MM)
        const formattedHMM = `${hours}:${minutes.toString().padStart(2, '0')}`;
        timeInputRef.current.setSelectionRange(formattedHMM.length, formattedHMM.length); 
      }
    });
  };

  // Handles changes to the "Break Time" slider
  const handleFocusSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFocusMins = Number(e.target.value);
    setFocusMinutes(newFocusMins);
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
    setFocusMinutes(5); // Reset break percentage to default
    setDisplayInputString(formatTimeHMM00(30));
    setBreakActivity('');
    setBreakSatisfaction(0); // Reset break satisfaction
  };

  // Handles submission after focus questions, transitions to break
  const handleSubmitFocusFeedbackAndStartBreak = () => {
    console.log("Focus Feedback:", { mood, productivity });
    setTimeLeft(breakDurationSeconds); // Initialize timeLeft for break
    setMode("break"); // Start the break phase
    setIsPaused(false); // Ensure not paused when starting break
  };

  // Handles submission after break questions, transitions to session end
  const handleSubmitBreakFeedbackAndEndSession = async () => {
    // This is the last point before the session officially ends.
    // All feedback data is ready to be saved.
    console.log("Break Feedback Submitted:", { breakActivity, breakSatisfaction });
    await saveSession(); // NEW: Call the save function here!
    setMode("sessionEnd");
    setIsPaused(false);
};

  // Handles starting a new session from sessionEnd
  const handleNewSession = () => {
    setMode("setup");
    setIsPaused(false);
    setTimeLeft(0); // TimeLeft will be reset by duration input in setup
    setMood(null);
    setProductivity(5);
    setSessionMinutes(30); // Reset session minutes to default
    setFocusMinutes(5); // Reset break percentage to default
    setDisplayInputString(formatTimeHMM00(30));
    setBreakActivity('');
    setBreakSatisfaction(0); // Reset break satisfaction
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
            value={displayInputString}
            onChange={handleTimeDisplayChange}
            onBlur={handleTimeInputBlur}
            onFocus={handleTimeInputFocus}
            className="w-full bg-transparent text-white text-center focus:outline-none focus:ring-0"
            // No maxLength, allowing flexible typing. Parsing logic handles truncation/formatting.
          />
        ) : (
          <span>{formatTimeMMSS(timeLeft)}</span> // Displays countdown when active
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
              Focus Time: {formatTimeMMSS(focusMinutes)}
            </label>
            <div className="flex-1 flex items-center space-x-4">
              <input
                type="range"
                id="focus-break-slider"
                min="0"
                max={sessionMinutes}
                step="1"
                value={focusMinutes}
                onChange={handleFocusSliderChange}
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
                Break Time: {formatTimeMMSS(breakDurationSeconds)}
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
        
        {/* MODIFIED: Add break activity input field and the new slider */}
        <p className="text-xl">What did you do during your break?</p>
        <input
            type="text"
            value={breakActivity ?? ""}
            onChange={(e) => setBreakActivity(e.target.value)}
            placeholder="e.g., Walk, snack, watched a video..."
            className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* NEW: Break Satisfaction Slider */}
        <div className="pt-4">
            <p className="text-xl">How did you feel about the break duration?</p>
            <div className="mt-4 flex flex-col items-center">
                <span className="text-lg font-medium text-blue-300">
                    {breakSatisfaction < 0 ? `Shorter by ${Math.abs(breakSatisfaction)} min` : breakSatisfaction > 0 ? `Longer by ${breakSatisfaction} min` : 'Just Right'}
                </span>
                <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={breakSatisfaction}
                    onChange={(e) => setBreakSatisfaction(Number(e.target.value))}
                    className="w-full mt-2 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    style={{
                        background: `linear-gradient(to right, 
                            rgb(255, 69, 0) 0%, 
                            rgb(255, 69, 0) ${50 + (breakSatisfaction * 2.5)}%,
                            rgb(74, 236, 52) ${50 + (breakSatisfaction * 2.5)}%,
                            rgb(74, 236, 52) 100%
                        )`
                    }}
                />
                <div className="flex justify-between w-full text-sm mt-1 text-gray-400">
                    <span>-10 (Too Short)</span>
                    <span>+10 (Too Long)</span>
                </div>
            </div>
        </div>

        <button
            onClick={handleSubmitBreakFeedbackAndEndSession}
            disabled={isSaving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
            {isSaving ? 'Saving...' : 'End Session'}
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