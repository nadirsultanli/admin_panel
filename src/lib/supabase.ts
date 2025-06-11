import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { logger } from './logger';

// Environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if we have valid Supabase credentials
const hasValidCredentials = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key' &&
         supabaseUrl.includes('supabase.co') &&
         supabaseAnonKey.length > 20;
};

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
  
  // Check for invalid credentials first
  if (!hasValidCredentials()) {
    const message = 'Supabase is not configured. Please set up your Supabase project credentials in the .env file.';
    logger.warn(message, { context: 'Supabase Configuration' });
    return message;
  }
  
  // Log the error for debugging
  logger.error(error, { context: 'Supabase' });
  
  // Handle different types of errors
  if (error.message) {
    // Handle common network errors
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the database. Please check your internet connection and Supabase configuration.';
    }
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
    // First check if we have valid credentials
    if (!hasValidCredentials()) {
      logger.warn('Supabase credentials not configured', { context: 'Connection' });
      return false;
    }

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
    if (!hasValidCredentials()) {
      logger.warn('Cannot get user - Supabase not configured', { context: 'Auth' });
      return null;
    }

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
    if (!hasValidCredentials()) {
      logger.warn('Cannot check admin status - Supabase not configured', { context: 'Auth' });
      return false;
    }

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

// Export helper to check if Supabase is properly configured
export const isSupabaseConfigured = hasValidCredentials;