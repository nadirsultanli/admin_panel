import { useState, useCallback, useEffect } from 'react';
import { supabase, supabaseAdmin, isUserAdmin } from '@/lib/supabase';
import type { Order, OrderFilters } from '@/types/order';
import { toast } from 'sonner';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  fetchOrders: (filters?: OrderFilters, page?: number, limit?: number, sortField?: string, sortDirection?: 'asc' | 'desc') => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  bulkUpdateStatus: (orderIds: string[], status: string) => Promise<boolean>;
  exportOrdersToCSV: (orderIds?: string[]) => Promise<string>;
  clearError: () => void;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
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

  const fetchOrders = useCallback(async (
    filters: OrderFilters = { search: '', status: 'all', dateFrom: '', dateTo: '' },
    page: number = 1,
    limit: number = 20,
    sortField: string = 'created_at',
    sortDirection: 'asc' | 'desc' = 'desc'
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      let query = client
        .from('orders')
        .select(`
          *,
          customer:customers(id, name, phone, email),
          delivery_address:addresses(id, city, line1, line2, state)
        `, { count: 'exact' });

      // Apply search filter
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`
          id.ilike.%${searchTerm}%,
          customer.name.ilike.%${searchTerm}%,
          customer.phone.ilike.%${searchTerm}%
        `);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply date range filter
      if (filters.dateFrom) {
        query = query.gte('order_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('order_date', filters.dateTo);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string): Promise<boolean> => {
    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      const { error } = await client
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // If marking as delivered, handle inventory deduction
      if (newStatus === 'delivered') {
        // In a real implementation, this would trigger inventory updates
        console.log('Order delivered - inventory should be deducted');
      }

      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      toast.error(errorMessage);
      return false;
    }
  }, [isAdmin]);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      const { error } = await client
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Release any reserved inventory
      console.log('Order cancelled - reserved inventory should be released');

      toast.success('Order cancelled successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
      toast.error(errorMessage);
      return false;
    }
  }, [isAdmin]);

  const bulkUpdateStatus = useCallback(async (orderIds: string[], status: string): Promise<boolean> => {
    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      const { error } = await client
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds);

      if (error) throw error;

      // Handle inventory updates for delivered orders
      if (status === 'delivered') {
        console.log('Bulk orders delivered - inventory should be deducted');
      }

      // Handle inventory release for cancelled orders
      if (status === 'cancelled') {
        console.log('Bulk orders cancelled - reserved inventory should be released');
      }

      toast.success(`${orderIds.length} order(s) updated to ${status.replace('_', ' ')}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update orders';
      toast.error(errorMessage);
      return false;
    }
  }, [isAdmin]);

  const exportOrdersToCSV = useCallback(async (orderIds?: string[]): Promise<string> => {
    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      let query = client
        .from('orders')
        .select(`
          *,
          customer:customers(name, phone, email),
          delivery_address:addresses(city, line1, line2, state)
        `);

      if (orderIds && orderIds.length > 0) {
        query = query.in('id', orderIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Create CSV headers
      const headers = [
        'Order ID',
        'Customer Name',
        'Customer Phone',
        'Order Date',
        'Delivery Date',
        'Status',
        'Cylinder Size',
        'Quantity',
        'Total Amount (KES)',
        'Delivery City',
        'Created At'
      ];

      // Create CSV rows
      const rows = (data || []).map(order => [
        order.id,
        order.customer?.name || 'Unknown',
        order.customer?.phone || '',
        order.order_date,
        order.scheduled_date || '',
        order.status,
        order.cylinder_size,
        order.quantity.toString(),
        order.total_amount_kes,
        order.delivery_address?.city || '',
        new Date(order.created_at).toLocaleDateString()
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export orders';
      toast.error(errorMessage);
      throw err;
    }
  }, [isAdmin]);

  return {
    orders,
    loading,
    error,
    totalCount,
    fetchOrders,
    updateOrderStatus,
    cancelOrder,
    bulkUpdateStatus,
    exportOrdersToCSV,
    clearError
  };
}