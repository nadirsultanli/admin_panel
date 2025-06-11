import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
      // Generate mock customer data
      const mockCustomers: Customer[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          external_id: 'CUST001',
          name: 'Acme Restaurant Group',
          tax_id: '12-3456789',
          phone: '+254701234567',
          email: 'orders@acmerestaurants.co.ke',
          account_status: 'active',
          credit_terms_days: 30,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          external_id: 'CUST002',
          name: 'Downtown Diner',
          tax_id: '98-7654321',
          phone: '+254702345678',
          email: 'manager@downtowndiner.co.ke',
          account_status: 'active',
          credit_terms_days: 15,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          external_id: 'CUST003',
          name: 'City Catering Co',
          tax_id: '11-2233445',
          phone: '+254703456789',
          email: 'purchasing@citycatering.co.ke',
          account_status: 'credit_hold',
          credit_terms_days: 45,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          external_id: 'CUST004',
          name: 'Suburban Grill',
          tax_id: '55-6677889',
          phone: '+254704567890',
          email: 'owner@suburbangrill.co.ke',
          account_status: 'active',
          credit_terms_days: 30,
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          external_id: 'CUST005',
          name: 'Mama Njeri Kitchen',
          tax_id: 'P051234571E',
          phone: '+254705678901',
          email: 'mama@njerikitchen.co.ke',
          account_status: 'active',
          credit_terms_days: 30,
          created_at: '2024-01-05T00:00:00Z',
          updated_at: '2024-01-05T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440006',
          external_id: 'CUST006',
          name: 'Safari Lodge Catering',
          tax_id: 'P051234572F',
          phone: '+254706789012',
          email: 'catering@safarilodge.co.ke',
          account_status: 'active',
          credit_terms_days: 45,
          created_at: '2024-01-06T00:00:00Z',
          updated_at: '2024-01-06T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440007',
          external_id: 'CUST007',
          name: 'Nairobi Hospital Cafeteria',
          tax_id: 'P051234573G',
          phone: '+254707890123',
          email: 'cafeteria@nairobihospital.co.ke',
          account_status: 'active',
          credit_terms_days: 30,
          created_at: '2024-01-07T00:00:00Z',
          updated_at: '2024-01-07T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440008',
          external_id: 'CUST008',
          name: 'University Dining Hall',
          tax_id: 'P051234574H',
          phone: '+254708901234',
          email: 'dining@university.ac.ke',
          account_status: 'active',
          credit_terms_days: 60,
          created_at: '2024-01-08T00:00:00Z',
          updated_at: '2024-01-08T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440009',
          external_id: 'CUST009',
          name: 'Westlands Food Court',
          tax_id: 'P051234575I',
          phone: '+254709012345',
          email: 'manager@westlandsfoodcourt.co.ke',
          account_status: 'credit_hold',
          credit_terms_days: 15,
          created_at: '2024-01-09T00:00:00Z',
          updated_at: '2024-01-09T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          external_id: 'CUST010',
          name: 'Karen Country Club',
          tax_id: 'P051234576J',
          phone: '+254710123456',
          email: 'kitchen@karencountryclub.co.ke',
          account_status: 'active',
          credit_terms_days: 30,
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z'
        }
      ];
      
      // Apply search filter
      let filteredCustomers = [...mockCustomers];
      
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.name.toLowerCase().includes(searchTerm) ||
          (customer.tax_id && customer.tax_id.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply status filter
      if (filters.status !== 'all') {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.account_status === filters.status
        );
      }
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedCustomers = filteredCustomers.slice(from, to);
      
      setCustomers(paginatedCustomers);
      setTotalCount(filteredCustomers.length);
      setLastSuccessfulData(paginatedCustomers);
      
    } catch (err) {
      console.error('Error fetching customers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (
    customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Customer | null> => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would create a customer in the database
      // For now, we'll simulate a successful creation
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      toast.success('Customer created successfully');
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(async (
    id: string,
    updates: Partial<Customer>
  ): Promise<Customer | null> => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would update a customer in the database
      // For now, we'll simulate a successful update
      const updatedCustomer: Customer = {
        id,
        name: 'Updated Customer',
        phone: '+254700000000',
        account_status: 'active',
        credit_terms_days: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...updates
      };

      toast.success('Customer updated successfully');
      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would delete a customer from the database
      // For now, we'll simulate a successful deletion
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
  }, []);

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