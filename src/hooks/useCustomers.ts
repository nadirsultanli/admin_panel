import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin, isUserAdmin } from '@/lib/supabase';
import type { Customer, CustomerFilters } from '@/types/customer';
import { toast } from 'sonner';

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  fetchCustomers: (filters?: CustomerFilters, page?: number, limit?: number) => Promise<void>;
  createCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [lastSuccessfulData, setLastSuccessfulData] = useState<Customer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isUserAdmin();
      setIsAdmin(adminStatus);
    };
    
    checkAdminStatus();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchCustomers = useCallback(async (
    filters: CustomerFilters = { search: '', status: 'all' },
    page: number = 1,
    limit: number = 10
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      let query = client
        .from('customers')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (filters.search && filters.search.trim()) {
        query = query.or(`name.ilike.%${filters.search.trim()}%,tax_id.ilike.%${filters.search.trim()}%,phone.ilike.%${filters.search.trim()}%`);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('account_status', filters.status);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by name
      query = query.order('name', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      const newCustomers = data || [];
      const newCount = count || 0;

      // Only update state if we have data or if this is the first load
      if (newCustomers.length > 0 || lastSuccessfulData.length === 0 || !filters.search.trim()) {
        setCustomers(newCustomers);
        setLastSuccessfulData(newCustomers);
        setTotalCount(newCount);
      } else {
        // If search returns no results, keep showing last successful data briefly
        // but update the count to reflect the search results
        setTotalCount(newCount);
        
        // After a short delay, show the empty results
        setTimeout(() => {
          setCustomers(newCustomers);
        }, 150);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [lastSuccessfulData.length, isAdmin]);

  const createCustomer = useCallback(async (
    customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Customer | null> => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      const { data, error } = await client
        .from('customers')
        .insert({
          ...customerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Customer created successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const updateCustomer = useCallback(async (
    id: string,
    updates: Partial<Customer>
  ): Promise<Customer | null> => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      const { data, error } = await client
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Customer updated successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      const { error } = await client
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Customer deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  return {
    customers,
    loading,
    error,
    totalCount,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError
  };
}