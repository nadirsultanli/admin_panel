import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { logger } from './logger';

// Environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  // Log the error for debugging
  logger.error(error, { context: 'Supabase' });
  
  // Handle different types of errors
  if (error.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

// Connection test function
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error) {
      logger.error('Supabase connection test error:', { context: 'Connection', data: error });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Supabase connection test failed:', { context: 'Connection', data: error });
    return false;
  }
};

// Get current authenticated user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error(error, { context: 'Auth' });
      return null;
    }
    
    return user;
  } catch (error) {
    logger.error('Failed to get current user', { context: 'Auth', data: error });
    return null;
  }
};

// Check if user has admin role
export const isUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Check if user has admin role in user metadata
    const isAdmin = user.user_metadata?.role === 'admin';
    
    // If not in metadata, check admin_users table
    if (!isAdmin) {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error || !data) return false;
      
      return data.role === 'admin' && data.active === true;
    }
    
    return isAdmin;
  } catch (error) {
    logger.error('Failed to check admin status', { context: 'Auth', data: error });
    return false;
  }
};