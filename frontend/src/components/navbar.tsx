"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  const inactiveNavLink = "text-blue-100 hover:text-white text-xl font-bold transition-all" +
                          "hover:border-b-2 border-transparent hover:border-white " + 
                          "hover:scale-105 transform origin-left " +
                          "inline-flex items-center";
  const activeNavLink = "text-white text-xl font-bold border-b-2 border-white";

  return (
    <nav className="p-4 bg-blue-700 shadow-lg">
      <div className="flex justify-end w-full items-center">
        <div className="flex items-center space-x-20">
          <Link href="/" className="text-5xl font-bold font-mono text-white">
            FocusFlow
          </Link>
          <Link
            className={`${inactiveNavLink} ${pathname === "/timer" ? activeNavLink : ''}`}
            href="/timer"
          >
            Pomodoro Timer
          </Link>
          <Link
            className={`${inactiveNavLink} ${pathname === "/tasks" ? activeNavLink : ''}`}
            href="/tasks"
          >
          Tasks
          </Link>
          <Link
            className={`${inactiveNavLink} ${pathname === "/sessions" ? activeNavLink : ''}`}
            href="/sessions"
          >
          Sessions
          </Link>
        </div>
        
        {loading ? (
          <div className="ml-auto text-white text-lg">
            Loading...
          </div>
        ) : user ? (
          <button
            onClick={signOut}
            className="ml-auto rounded-full border border-solid border-transparent transition-colors flex items-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            <span className="text-black">Sign Out</span>
          </button>
        ) : (
          <Link
          className="ml-auto rounded-full border border-solid border-transparent transition-colors flex items-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          href="/login"
          >
            <span className="text-black">Sign In</span>
          </Link>
       )}
      </div>
    </nav>
  );
}