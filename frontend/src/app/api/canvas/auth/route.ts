// src/app/api/canvas/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
// NEW: Import the asynchronous server-side Supabase client from utils
import { createClient } from '@/utils/supabase/server'; 

// --- Environment Variables Configuration ---
const CANVAS_CLIENT_ID = process.env.CANVAS_CLIENT_ID;
const CANVAS_CLIENT_SECRET = process.env.CANVAS_CLIENT_SECRET;
const CANVAS_REDIRECT_URI = process.env.CANVAS_REDIRECT_URI;
const CANVAS_BASE_URL = process.env.CANVAS_BASE_URL;

// Validate environment variables at startup
if (!CANVAS_CLIENT_ID || !CANVAS_CLIENT_SECRET || !CANVAS_REDIRECT_URI || !CANVAS_BASE_URL) {
  throw new Error('Missing Canvas LMS API environment variables. Please check your .env.local file.');
}

// --- GET Handler: Initiates Canvas OAuth Flow OR Handles Callback ---
export async function GET(request: NextRequest) {
  // Use the consistent asynchronous Supabase client creation
  const supabase = await createClient(); 
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  // --- Part 1: Handle Canvas OAuth Callback (if 'code' or 'error' param is present) ---
  if (code || error) {
    if (error) {
      console.error('Canvas LMS OAuth error:', error);
      return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('Canvas LMS authorization failed.'), request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('No authorization code received from Canvas.'), request.url));
    }

    try {
      // Ensure Supabase user is authenticated before exchanging tokens
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('User session lost during Canvas connection. Please log in again.'), request.url));
      }

      // Exchange the authorization code for an access token
      const tokenResponse = await fetch(`${CANVAS_BASE_URL}/login/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: CANVAS_CLIENT_ID,
          client_secret: CANVAS_CLIENT_SECRET,
          redirect_uri: CANVAS_REDIRECT_URI,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Error exchanging Canvas code:', errorData);
        throw new Error(errorData.error_description || 'Failed to get Canvas access token.');
      }

      const tokens = await tokenResponse.json();
      const access_token = tokens.access_token;
      const refresh_token = tokens.refresh_token; 
      const expires_in = tokens.expires_in; 
      const expiry_date = expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null;

      // Upsert the Canvas LMS tokens into your 'integration_tokens' table
      const { error: dbError } = await supabase
        .from('integration_tokens')
        .upsert(
          {
            user_id: user.id,
            provider: 'canvas_lms', 
            access_token: access_token,
            refresh_token: refresh_token || null, 
            expires_at: expiry_date,
            provider_data: { canvas_base_url: CANVAS_BASE_URL }, 
          },
          { onConflict: 'user_id,provider' } 
        );

      if (dbError) {
        console.error('Error saving Canvas LMS tokens to DB:', dbError);
        return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('Failed to save Canvas LMS tokens.'), request.url));
      }

      // Redirect to a success page or your main tasks dashboard
      return NextResponse.redirect(new URL('/tasks?success=' + encodeURIComponent('Canvas LMS connected successfully!'), request.url));

    } catch (err: any) {
      console.error('Error in Canvas OAuth callback:', err.message);
      return NextResponse.redirect(new URL('/tasks?error=' + encodeURIComponent('Canvas LMS connection failed: ' + err.message), request.url));
    }
  }

  // --- Part 2: Initiate Canvas OAuth Flow (if no 'code' or 'error' param) ---
  // If we reach here, it means this GET request is to start the OAuth process.
  // Use the consistent asynchronous Supabase client creation
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign_in?message=' + encodeURIComponent('Please sign in to connect Canvas LMS.'), request.url));
  }

  // Define the scopes required for Canvas LMS
  const CANVAS_SCOPES = [
    'url:GET|/api/v1/courses',
    'url:GET|/api/v1/courses/:id/assignments',
    'url:GET|/api/v1/courses/:id/enrollments',
    'url:GET|/api/v1/users/:id/todo',
  ].join(' '); 

  // Generate the Canvas authorization URL
  const authUrl = `${CANVAS_BASE_URL}/login/oauth2/auth?` + new URLSearchParams({
    client_id: CANVAS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: CANVAS_REDIRECT_URI,
    scope: CANVAS_SCOPES,
    state: user.id, 
  }).toString();

  // Redirect the user to Canvas's authorization page
  return NextResponse.redirect(authUrl);
}
