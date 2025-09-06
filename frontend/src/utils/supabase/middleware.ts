// src/utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create a Supabase client for the server environment.
  // It uses the request's cookies to manage the session.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // When Supabase needs to set a cookie (e.g., after token refresh),
        // it calls setAll. We update both the request and the response cookies.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Recreate the response object with the updated request,
          // then set cookies on this response to send them back to the client.
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE supabase.auth.getUser()
  // This call revalidates the Auth token with the Supabase Auth server,
  // ensuring the session is valid and fresh. It also triggers the cookie
  // updates via the `setAll` function above if a token refresh occurs.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Example: Redirect unauthenticated users from protected routes
  // You'll need to adjust these paths based on your application's routing.
  // This logic checks if there's no user AND the user is not trying to access
  // login/auth/error pages.
  const protectedRoutes = ['/dashboard', '/settings']; // Add your protected routes here

  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // If there's no user and the current path is a protected route (and not already login/auth/error)
  if (!user && isProtectedRoute && 
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/error')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login' // Redirect to your login page
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // This ensures the updated cookies are sent back to the browser.
  return supabaseResponse
}
