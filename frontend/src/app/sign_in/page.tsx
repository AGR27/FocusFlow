"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between sign in and sign up
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // For programmatic navigation
  const { signIn, user } = useAuth(); // Get signIn function and current user from AuthContext

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/timer'); // Redirect to timer page if already logged in
    }
  }, [user, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true); // Start loading state

    let authError: Error | null = null;

    if (isRegistering) {
      // For explicit registration with Supabase Auth
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      authError = error;

      if (!authError) {
        alert('Registration successful! Please check your email to confirm your account.');
        // After successful registration, if email confirmation is enabled in Supabase,
        // the user will need to verify their email before they can sign in.
      }
    } else {
      // Sign In
      const { error } = await signIn(email, password);
      authError = error;
    }

    setLoading(false); // End loading state

    if (authError) {
      setError(authError.message);
    } else if (!isRegistering && user) { // Only redirect automatically after successful sign-in, and if user object is available
      router.push('/timer'); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className={isRegistering
        ? "bg-gray-700 p-8 rounded-lg shadow-xl w-full max-w-md space-y-6"
        : "bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md space-y-6"}
      >
        <h2 className="text-3xl font-bold text-center text-blue-400">
          {isRegistering ? 'Sign Up' : 'Sign In'}
        </h2>

        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p className="text-center text-gray-400">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegistering(false)}
                className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setIsRegistering(true)}
                className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none"
              >
                Sign Up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}