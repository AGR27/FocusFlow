// app/api/google-classroom/auth/route.ts
// This API route handles both the initiation of Google Classroom OAuth
// and the callback from Google after user authorization.

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis'; // Import the googleapis library
import { createClient } from '@/utils/supabase/server'; // Import the server-side Supabase client

// --- Environment Variables Configuration ---
// These MUST be set in your .env.local file and match your Google Cloud Console settings.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// This REDIRECT_URI MUST EXACTLY match what's configured in Google Cloud Console's
// "Authorized redirect URIs" for your OAuth 2.0 Client ID.
// Example for local development: http://localhost:3000/api/google-classroom/auth
// Or if you removed the port: http://localhost/api/google-classroom/auth
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; 

// Validate environment variables at startup
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  // Use console.error for server-side errors
  console.error('Missing Google Classroom API environment variables. Please check your .env.local file.');
  // In a production environment, you might want to prevent the app from starting or throw an error immediately.
  // For now, we'll allow it to proceed but subsequent API calls will fail.
}

// Initialize Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Define the scopes required for Google Classroom
const CLASSROOM_SPECIFIC_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  // Add other necessary scopes as per your application's needs
];

export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Get the server-side Supabase client
  const requestUrl = new URL(request.url); // Get the full URL object

  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  // --- Part 1: Handle Google's OAuth Callback (if 'code' or 'error' param is present) ---
  if (code || error) {
    if (error) {
      console.error('Google Classroom OAuth error:', error);
      return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('Google Classroom authorization failed.'), request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('No authorization code received from Google.'), request.url));
    }

    try {
      // Ensure Supabase user is authenticated before exchanging tokens
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('User session lost during Google Classroom connection. Please log in again.'), request.url));
      }

      // Exchange the authorization code for access and refresh tokens
      const { tokens } = await oauth2Client.getToken(code);
      const { access_token, refresh_token, expiry_date } = tokens;

      // Upsert the Google Classroom tokens into your 'integration_tokens' table
      const { error: dbError } = await supabase
        .from('integration_tokens')
        .upsert(
          {
            user_id: user.id,
            provider: 'google_classroom', // Identifier for this integration
            access_token: access_token!, // Non-null assertion as it's expected
            refresh_token: refresh_token, // Can be null if access_type was 'online' or not granted
            expires_at: expiry_date ? new Date(expiry_date).toISOString() : null, // Store as ISO string
          },
          { onConflict: 'user_id,provider' } 
        );

      if (dbError) {
        console.error('Error saving Google Classroom tokens to DB:', dbError);
        return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('Failed to save Google Classroom tokens.'), request.url));
      }

      // Redirect to a success page or your main tasks dashboard
      return NextResponse.redirect(new URL('/tasks?success=' + encodeURIComponent('Google Classroom connected successfully!'), request.url));

    } catch (err: any) {
      console.error('Error exchanging Google Classroom code:', err.message);
      return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('Google Classroom connection failed: ' + err.message), request.url));
    }
  }

  // --- Part 2: Initiate Google Classroom OAuth Flow (if no 'code' or 'error' param) ---
  // If we reach here, it means this GET request is to start the OAuth process.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign_in?message=' + encodeURIComponent('Please sign in to connect Google Classroom.'), request.url));
  }

  // Generate the Google authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request a refresh token for long-term access
    scope: CLASSROOM_SPECIFIC_SCOPES.join(' '), // Join scopes with a space
    prompt: 'consent', // Ensure consent screen is shown, especially for refresh token
  });

  // Redirect the user to Google's authorization page
  return NextResponse.redirect(authUrl);
}

// Removed the POST handler as Google typically uses GET for callbacks.
// If you specifically need a POST handler for other reasons, ensure it's not
// conflicting with the Google OAuth callback.
