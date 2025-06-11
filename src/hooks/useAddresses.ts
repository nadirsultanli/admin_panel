import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/types/customer';
import { toast } from 'sonner';

interface UseAddressesReturn {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  fetchAddresses: (customerId: string) => Promise<void>;
  createAddress: (address: Omit<Address, 'id' | 'created_at'>) => Promise<Address | null>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<Address | null>;
  deleteAddress: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useAddresses(): UseAddressesReturn {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchAddresses = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      setAddresses(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch addresses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAddress = useCallback(async (
    addressData: Omit<Address, 'id' | 'created_at'>
  ): Promise<Address | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...addressData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Address created successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create address';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAddress = useCallback(async (
    id: string,
    updates: Partial<Address>
  ): Promise<Address | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Address updated successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update address';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAddress = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Address deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete address';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    clearError
  };
}