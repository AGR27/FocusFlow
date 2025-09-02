// src/utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This function creates and configures a Supabase client for use in
// Server Components, Server Actions, and Route Handlers (like your API routes).
export async function createClient() {
  const cookieStore = await cookies() // Await the cookies() function

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Crucially, use the ANON_KEY as per guide
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions, as the middleware will handle setting cookies
            // in the response.
          }
        },
      },
    }
  )
}
