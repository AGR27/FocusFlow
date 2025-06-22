"use client";

import Link from "next/link";
import { useState } from "react";

import Image from "next/image";
import PomoTimer from "@/components/PomoTimer/PomoTimer";
import MoodGrid from "@/components/PomoTimer/MoodGrid";
import ProductivitySlider from "@/components/PomoTimer/ProductivitySlider";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-800 text-gray-600">
      <main className="p-4 bg-white m-20 rounded-lg shadow-lg mx-30 flex flex-col items-start">
        <h1 className="text-6xl font-bold mb-4 font-sans">
          Get Started with <span className="font-mono text-blue-600">FocusFlow</span>
        </h1>
        <p className="text-2xl font-bold mb-4 font-sans">
          A productivity assistant to help you stay <span className="text-blue-600 font-semibold">focused</span> and <span className="text-blue-600 font-semibold">organized</span>
        </p>
        <ol className="list-disc items-inside flex gap-12 ml-8 mb-4 text-lg font-sans">
          <li>Pomodoro timer</li>
          <li>Task management</li>
          <li>Progress Tracking</li>
        </ol>
        <Link
          className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-xl shadow-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center min-w-[200px]"
          href="/sign_in"
        >
          Create Account
        </Link>
      </main>

      <main className="flex-1 flex-col items-center justify-center">
        <PomoTimer />
        <MoodGrid onChange={(m) => setMood(m)} /> 
        <ProductivitySlider onChange={(p) => setProductivity(p)} />
      </main>


      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}



{/* <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div> */}