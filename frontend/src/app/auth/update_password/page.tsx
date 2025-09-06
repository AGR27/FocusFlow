// app/update_password/page.tsx

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMessage(null); // Clear any previous success messages if component re-renders
    setError(null);   // Clear any previous error messages if component re-renders
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setLoading(true);   // Start loading state
    setError(null);     // Clear previous errors
    setMessage(null);   // Clear previous messages

    // Basic client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return; // Stop the function if validation fails
    }
    if (password.length < 6) { // Supabase usually requires at least 6 characters
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
    }

    try {
        // This is the core Supabase call to update the password for the currently signed-in user
        // The user is considered "signed-in" on this page because Supabase read the tokens from the URL
        const { error: updateError } = await supabase.auth.updateUser({ password });
        
        if (updateError) {
          setError(updateError.message); // Display Supabase error if any
        } else {
          setMessage('Your password has been updated successfully! You can now sign in with your new password.');
          setPassword(''); // Clear input fields
          setConfirmPassword(''); // Clear input fields
        }
    } catch (_err) {
        // Suppress unused parameter warning for Vercel build
        void _err;
        // Catch any unexpected JavaScript errors
        setError('An unexpected error occurred. Please try a different password or try again.');
    } finally {
        setLoading(false); // End loading state
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Set a New Password
        </h1>

        {/* Display messages or errors */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
            {/* Button to navigate back to sign-in */}
            <div className="mt-4 text-center">
                <button
                    onClick={() => router.push('/login')}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                    Go to Sign In
                </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Only show the form if there isn't a success message */}
        {!message && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
                <p className="text-center text-gray-600">
                    Enter your new password below.
                </p>
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        )}
      </div>
    </main>
  );
}