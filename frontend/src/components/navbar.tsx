import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="p-4 bg-blue-700 shadow-lg">
      <div className="flex justify-end w-full items-center">
        <div className="flex items-center space-x-20">
          <Link href="/" className="text-5xl font-bold font-mono text-white">
            FocusFlow
          </Link>
          <Link
            className="text-blue-100 hover:text-white text-xl font-bold transition-colors"
            href="/timer"
          >
            Pomodoro Timer
          </Link>
          <Link
            className="text-blue-100 hover:text-white text-xl font-bold transition-colors"
            href="/tasks"
          >
          Tasks
          </Link>
        </div>
        
        <Link
          className="ml-auto rounded-full border border-solid border-transparent transition-colors flex items-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          href="/sign_in"
        >
          <span className="text-black">Sign In</span>
        </Link>
      </div>
    </nav>
  );
}