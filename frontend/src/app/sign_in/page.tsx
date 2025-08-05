"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between sign in and sign up
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // For programmatic navigation
  const { signIn, signUp, user } = useAuth();

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          // IMPORTANT: Replace with your actual redirect URL after successful OAuth login.
          // This should match a URL configured in your Supabase project's Auth -> URL Configuration.
          // For local development, 'http://localhost:3000/timer' might work if your app runs on :3000
          // and /timer is where you want to land after login.
          redirectTo: `${window.location.origin}/timer`, // Example: redirects to /timer on your current domain
        },
      });

      if (error) {
        throw error;
      }
      // If successful, Supabase handles the redirect to the OAuth provider,
      // and then back to your redirectTo URL. No need for manual router.push here.
    } catch (err: any) {
      setError(`OAuth Sign-in error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email to send a password reset link.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update_password`
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setError('A password reset link has been sent to your email. Please check your inbox!');
    }
    setLoading(false);
  };

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

    if (isRegistering) {
      // For explicit registration with Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName || null, // Optional field, can be null
            dob: dob || null, // Optional field, can be null
          },
        }
      });

      if (signUpError) {
        setError(signUpError.message);
      } 
      else {
        alert('Registration successful! Please check your email to confirm your account.');
        setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setDob('');
      }
    }
    else{
      const { error: signInError } = await signIn(email, password);
      let customErrorMessage = "An unexpected error occurred. Please try again.";
      if(signInError?.message.includes("User not found") || signInError?.message.includes("User does not exist")) {
        customErrorMessage = "No account found for this email. Please register.";
      }
      else if(signInError?.message.includes("Invalid login credentials")) {
        customErrorMessage = "Incorrect password or no password set for this account.";
      }
      else {
        customErrorMessage = signInError ? `Sign-in error: ${signInError.message}` : "Sign-in error occurred.";
      }
      setError(customErrorMessage);
    }
    
    setLoading(false); // End loading state 
  };

  const action = isRegistering ? 'Sign Up' : 'Sign In';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className={isRegistering
        ? "bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md space-y-6"
        : "bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md space-y-6"}
      >
        <h2 className="text-3xl font-bold text-center text-blue-400">
          {action}
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
              //placeholder="your.email@example.com"
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
              //placeholder="••••••••"
              required
            />
          </div>

          {isRegistering && (
            <>
              <div>
                <label htmlFor="firstName" className="block text-lg font-medium text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  //placeholder="Your First Name"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-lg font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  //placeholder="Your Last Name"
                  required
                />
              </div>
            </>)}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            className="w-full text-center text-sm text-indigo-600 hover:underline transition-colors"
            disabled={loading}
          >
            {loading ? 'Sending Password Reset...' : 'Forgot password?'}
          </button>
        </form>

        <div className="flex flex-col space-y-3 mt-6">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            className="w-full bg-white hover:bg-white-100 text-black font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {/* You can use an icon here, e.g., from Font Awesome or a simple SVG */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 11v2.4h3.97c-.16 1.02-.66 1.87-1.44 2.48v3.09h4.03c2.35-2.16 3.72-5.22 3.72-9.22 0-.79-.07-1.54-.21-2.27H12v4.5z" />
              <path d="M3 12c0-1.81.48-3.5 1.34-4.93L1 4.5V4.5C.36 5.64 0 6.88 0 8.16c0 1.94.54 3.76 1.48 5.25l2.06-1.59C3.48 12.87 3 12.44 3 12z" fill="#FBBC05" />
              <path d="M23.64 12.27c0-.79-.07-1.54-.21-2.27H12v4.5h6.47c-.16 1.02-.66 1.87-1.44 2.48v3.09h4.03c2.35-2.16 3.72-5.22 3.72-9.22 0-.79-.07-1.54-.21-2.27H12v4.5z" fill="#4285F4" />
              <path d="M12 21.96c3.27 0 6.01-1.07 8.01-2.91l-4.03-3.09c-.78.61-1.28 1.46-1.44 2.48h-2.54v-4.5h-4.5v4.5h-2.54c-.16-1.02-.66-1.87-1.44-2.48l-4.03 3.09c2 1.84 4.74 2.91 8.01 2.91z" fill="#34A853" />
              <path d="M12 0c3.27 0 6.01 1.07 8.01 2.91l-4.03 3.09c-.78-.61-1.28-1.46-1.44-2.48h-2.54V0z" fill="#EA4335" />
            </svg>
            <span>{action} with Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.6.111.819-.258.819-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.542-1.373-1.322-1.734-1.322-1.734-1.087-.745.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.49.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.956-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.105 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.801 5.625-5.476 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.892-.015 3.286 0 .315.219.69.824.576C20.565 21.792 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            <span>{action} with GitHub</span>
          </button>
        </div>

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