// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables for Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://eecizjerukaxwqwgcker.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2l6amVydWtheHdxd2dja2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzc5OTIsImV4cCI6MjA2Njk1Mzk5Mn0.xhtN5eVrz-tJRrWijDuPOPivcfsM3hwpMbFyr3lPzKo";

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Prevent issues with URL-based session detection
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
  // Add retry logic for network issues
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Test connection on initialization with better error handling
supabase.auth.getSession().catch((error) => {
  console.warn('Supabase connection test failed:', error.message);
  console.warn('Please verify your Supabase project is active and accessible.');
  
  // If session is invalid, clear it to prevent further errors
  if (error.message?.includes('session_not_found') || error.message?.includes('JWT')) {
    console.warn('Clearing invalid session data...');
    localStorage.removeItem('sb-' + SUPABASE_URL.replace('https://', '').replace('.supabase.co', '') + '-auth-token');
    // Force a page reload to start fresh
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
});

// Add global error handler for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    // Clear any stale data
    console.log('Auth state changed, clearing potential stale data');
  }
});