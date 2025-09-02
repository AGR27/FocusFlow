// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware' // Import the core middleware logic

export async function middleware(request: NextRequest) {
  // Call the updateSession function to handle token refresh and cookie synchronization
  return await updateSession(request)
}

// Configuration for the middleware matcher
// The matcher array specifies which paths the middleware should run on.
// This is crucial for performance, as the middleware will only execute
// for requests matching these patterns.
export const config = {
  // Adjust these paths based on your application.
  // It should include any paths where you access Supabase, especially auth-related ones.
  // ':path*' matches all paths.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - The `/login` route (so users can actually reach the login page)
     * - The `/auth` route (for Supabase auth callbacks/password resets)
     * - The `/error` route (if you have a dedicated error page)
     *
     * You can add other public assets or routes that do not require session updates here.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth|error|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
