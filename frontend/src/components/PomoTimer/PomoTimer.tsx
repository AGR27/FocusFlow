"use client";

import{ useEffect, useState } from "react";

import ProductivitySlider from "@/components/PomoTimer/ProductivitySlider";
import MoodGrid from "@/components/PomoTimer/MoodGrid";

type Mode = "setup" | "focus" | "focusQuestions" | "break" | "breakQuestions" | "sessionEnd";

export default function PomoTimer() {
  //Session settings
  const [sessionDuration, setSessionDuration] = useState(30); // 30 minutes
  const [breakDuration, setBreakDuration] = useState(5); // 5 minutes

  //Timer state
  const [mode, setMode] = useState<Mode>("setup");
  const [timeLeft, setTimeLeft] = useState(0); // seconds

  const [mood, setMood] = useState<{ x: number; y: number; color: string } | null>(null);
  const [productivity, setProductivity] = useState(5); // Default productivity level

  useEffect(() => {
    // Only run the timer logic if in focus or break mode
    if (mode === "focus" || mode === "break") {
      // If timeLeft is 0 or less, transition to the next state
      if (timeLeft <= 0) {
        // Clear any existing interval immediately before setting new mode
        // (though in this structure, the cleanup will handle it)
        setMode(mode === "focus" ? "focusQuestions" : "breakQuestions");
        return; // Stop the effect from setting a new interval
      }

      // If timeLeft is greater than 0, set up the interval
      const interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      // Cleanup function to clear the interval when the component unmounts
      // or when dependencies (mode, timeLeft) change,
      // which effectively stops the previous interval before a new one might start.
      return () => clearInterval(interval);
    }
    // No return for other modes, meaning no interval is set for them.
    // When mode changes away from "focus" or "break", this useEffect's cleanup runs.
  }, [timeLeft, mode]); // Dependencies: timeLeft and mode

  {mode === "setup" && (
    <div>
      <button
        onClick={() => {
          setTimeLeft(sessionDuration * 60);
          setMode("focus");
        }}
        className="bg-green-500 px-4 py-2 text-white rounded"
      >
        Start Session
      </button>
    </div>
  )}

  

  return (
    <div className="p-4">
      {mode === "setup" && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Pomodoro Timer Setup</h1>
          <div>
            <label className="block mb-2">Session Duration (minutes):</label>
            <input
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block mb-2">Break Duration (minutes):</label>
            <input
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <button
            onClick={() => {
              setTimeLeft(sessionDuration * 60);
              setMode("focus");
            }}
            className="bg-green-500 px-4 py-2 text-white rounded"
          >
            Start Session
          </button>
        </div>
      )}

      {mode === "focus" && (
        <div>
          <h2 className="text-xl font-bold">Focus Time</h2>
          <p>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</p>
        </div>
      )}

      {mode === "focusQuestions" && (
        <div className="space-y-4">
          <MoodGrid onChange={(m) => setMood(m)} />
          <ProductivitySlider onChange={(val) => setProductivity(val)} />
          <button
            onClick={() => {
              console.log("Feedback", { mood, productivity });
              setTimeLeft(breakDuration * 60);
              setMode("break");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Submit & Start Break
          </button>
        </div>
      )}

      {mode === "break" && (
        <div>
          <h2 className="text-xl font-bold">Break Time</h2>
          <p>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</p>
        </div>
      )}

      {mode === "breakQuestions" && (
        <div>
          <h2>Break Finished</h2>
          <button
            onClick={() => {
              setMode("sessionEnd");
            }}
            className="bg-purple-500 px-4 py-2 text-white rounded"
          >
            End Session
          </button>
        </div>
      )}

      {mode === "sessionEnd" && (
        <div>
          <h2 className="text-lg font-bold">Session complete!</h2>
          <button
            onClick={() => {
              setMode("setup");
              setMood(null);
              setProductivity(5);
            }}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            New Session
          </button>
        </div>
      )}
    </div>
  );
}
  

