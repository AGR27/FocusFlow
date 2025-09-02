// src/utils/supabase/client.ts
// This client is for Client Components, which run in the browser.
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Ensure environment variables are loaded for the browser client.
  // These must be exposed with the NEXT_PUBLIC_ prefix.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
