"use client";

import{ useEffect, useState } from "react";

import ProductivityQuestion from "@/components/ProductivityQuestion";
import MoodGridQuestion from "@/components/MoodGridQuestion";

type Mode = "setup" | "focus" | "focusQuestions" | "break" | "breakQuestions" | "sessionEnd";

export default function PomoTimer() {
  //Session settings
  const [sessionDuration, setSessionDuration] = useState(30); // 30 minutes
  const [breakDuration, setBreakDuration] = useState(5); // 5 minutes

  //Timer state
  const [mode, setMode] = useState<Mode>("setup");
  const [timeLeft, setTimeLeft] = useState(0); // seconds

  

