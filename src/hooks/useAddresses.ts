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
      // Generate mock address data for the given customer
      const mockAddresses: Address[] = [
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          customer_id: customerId,
          label: 'Main Location',
          line1: 'Westlands Square',
          line2: 'Ground Floor, Shop 12',
          city: 'Nairobi',
          state: 'Nairobi',
          postal_code: '00600',
          country: 'KE',
          latitude: -1.2634,
          longitude: 36.8078,
          is_primary: true,
          instructions: 'Delivery dock on north side, ring bell twice',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          customer_id: customerId,
          label: 'Branch Office',
          line1: 'Sarit Centre',
          line2: 'Level 1, Shop 45',
          city: 'Nairobi',
          state: 'Nairobi',
          postal_code: '00606',
          country: 'KE',
          latitude: -1.2634,
          longitude: 36.8078,
          is_primary: false,
          instructions: 'Ring bell at back entrance',
          created_at: '2024-01-02T00:00:00Z'
        }
      ];
      
      setAddresses(mockAddresses);
    } catch (err) {
      console.error('Error fetching addresses:', err);
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
      // In a real implementation, this would create an address in the database
      // For now, we'll simulate a successful creation
      const newAddress: Address = {
        id: `addr-${Date.now()}`,
        ...addressData,
        created_at: new Date().toISOString()
      };

      toast.success('Address created successfully');
      return newAddress;
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
      // In a real implementation, this would update an address in the database
      // For now, we'll simulate a successful update
      const updatedAddress: Address = {
        id,
        customer_id: updates.customer_id || 'default-customer-id',
        line1: 'Updated Address Line 1',
        city: 'Updated City',
        country: 'KE',
        is_primary: false,
        created_at: new Date().toISOString(),
        ...updates
      };

      toast.success('Address updated successfully');
      return updatedAddress;
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
      // In a real implementation, this would delete an address from the database
      // For now, we'll simulate a successful deletion
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