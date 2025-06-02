"use client";

import Link from "next/link";

import Image from "next/image";
import Timer from "@/components/Timer";
import MoodGrid from "@/components/PomoTimer/MoodGrid";
import ProductivitySlider from "@/components/PomoTimer/ProductivitySlider";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-200 text-white">
      <main className="p-8 bg-blue-700 m-4 rounded-lg shadow-lg flex flex-col items-start">
        <h1 className="text-6xl font-bold mb-2 font-mono">
          FocusFlow
        </h1>
        <p className="text-xl font-bold mb-6 ml-2 font-sans">
          A productivity assistant to help you stay focused and productive
        </p>

        <ol className="list-disc items-inside flex gap-12 ml-8 text-lg font-sans">
          <li>Pomodoro timer</li>
          <li>Task management</li>
          <li>Progress Tracking</li>
        </ol>
      </main>

      <aside className="p-8 bg-blue-500 m-4 rounded-lg shadow-lg flex flex-col items-start">
        <h1 className="text-3xl font-bold mb-2 font-mono">
          Get Started
        </h1>
      </aside>

      <nav className="flex justify-center items-center gap-4 p-4 bg-blue-600">
        <Link
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          href="/timer"
        >
          <Image
            className="dark:invert"
            src="/clock.svg"
            alt="Clock icon"
            width={20}
            height={20}
          />
          Start Timer
        </Link>
       
      </nav>

      <main className="flex-1 flex items-center justify-center">
        <Timer />
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