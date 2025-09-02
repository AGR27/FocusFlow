// src/lib/supabaseClient.ts
// This file centralizes the creation of the Supabase client for client-side usage.
// It imports the utility function from utils/supabase/client.ts.

import { createClient } from '@/utils/supabase/client';

// Create a single client instance for reuse across all client components.
export const supabase = createClient();
