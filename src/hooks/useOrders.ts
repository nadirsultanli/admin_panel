import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
      // Generate mock order data
      const mockOrders: Order[] = [
        {
          id: '990e8400-e29b-41d4-a716-446655440001',
          customer_id: '550e8400-e29b-41d4-a716-446655440001',
          delivery_address_id: '660e8400-e29b-41d4-a716-446655440001',
          order_date: '2024-01-15',
          scheduled_date: '2024-01-17',
          status: 'delivered',
          cylinder_size: '13kg',
          quantity: 5,
          price_kes: 2599.00,
          total_amount_kes: '12995.00',
          notes: 'Standard delivery completed successfully',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-17T15:45:00Z',
          customer: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Acme Restaurant Group',
            phone: '+254701234567',
            email: 'orders@acmerestaurants.co.ke'
          },
          delivery_address: {
            id: '660e8400-e29b-41d4-a716-446655440001',
            city: 'Nairobi',
            line1: 'Westlands Square',
            line2: 'Ground Floor',
            state: 'Nairobi'
          }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440002',
          customer_id: '550e8400-e29b-41d4-a716-446655440002',
          delivery_address_id: '660e8400-e29b-41d4-a716-446655440003',
          order_date: '2024-01-16',
          scheduled_date: '2024-01-18',
          status: 'en_route',
          cylinder_size: '6kg',
          quantity: 8,
          price_kes: 1899.00,
          total_amount_kes: '15192.00',
          notes: 'En route to customer, ETA 2PM',
          created_at: '2024-01-16T09:15:00Z',
          updated_at: '2024-01-18T11:30:00Z',
          customer: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Downtown Diner',
            phone: '+254702345678',
            email: 'manager@downtowndiner.co.ke'
          },
          delivery_address: {
            id: '660e8400-e29b-41d4-a716-446655440003',
            city: 'Nairobi',
            line1: 'Yaya Centre',
            line2: 'Level 2',
            state: 'Nairobi'
          }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440003',
          customer_id: '550e8400-e29b-41d4-a716-446655440003',
          delivery_address_id: '660e8400-e29b-41d4-a716-446655440004',
          order_date: '2024-01-17',
          scheduled_date: '2024-01-19',
          status: 'confirmed',
          cylinder_size: '13kg',
          quantity: 3,
          price_kes: 2599.00,
          total_amount_kes: '7797.00',
          notes: 'Awaiting dispatch from warehouse',
          created_at: '2024-01-17T14:20:00Z',
          updated_at: '2024-01-17T16:45:00Z',
          customer: {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'City Catering Co',
            phone: '+254703456789',
            email: 'purchasing@citycatering.co.ke'
          },
          delivery_address: {
            id: '660e8400-e29b-41d4-a716-446655440004',
            city: 'Nairobi',
            line1: 'Industrial Area',
            line2: 'Warehouse 12B',
            state: 'Nairobi'
          }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440004',
          customer_id: '550e8400-e29b-41d4-a716-446655440004',
          delivery_address_id: '660e8400-e29b-41d4-a716-446655440005',
          order_date: '2024-01-18',
          scheduled_date: null,
          status: 'pending',
          cylinder_size: '6kg',
          quantity: 10,
          price_kes: 1899.00,
          total_amount_kes: '18990.00',
          notes: 'Customer requested quote, awaiting approval',
          created_at: '2024-01-18T08:10:00Z',
          updated_at: '2024-01-18T08:10:00Z',
          customer: {
            id: '550e8400-e29b-41d4-a716-446655440004',
            name: 'Suburban Grill',
            phone: '+254704567890',
            email: 'owner@suburbangrill.co.ke'
          },
          delivery_address: {
            id: '660e8400-e29b-41d4-a716-446655440005',
            city: 'Nairobi',
            line1: 'Karen Shopping Centre',
            line2: 'Unit 8',
            state: 'Nairobi'
          }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440005',
          customer_id: '550e8400-e29b-41d4-a716-446655440005',
          delivery_address_id: '660e8400-e29b-41d4-a716-446655440006',
          order_date: '2024-01-18',
          scheduled_date: '2024-01-20',
          status: 'scheduled',
          cylinder_size: '6kg',
          quantity: 15,
          price_kes: 1899.00,
          total_amount_kes: '28485.00',
          notes: 'Large order for community kitchen',
          created_at: '2024-01-18T11:25:00Z',
          updated_at: '2024-01-18T14:30:00Z',
          customer: {
            id: '550e8400-e29b-41d4-a716-446655440005',
            name: 'Mama Njeri Kitchen',
            phone: '+254705678901',
            email: 'mama@njerikitchen.co.ke'
          },
          delivery_address: {
            id: '660e8400-e29b-41d4-a716-446655440006',
            city: 'Nairobi',
            line1: 'Kibera Drive',
            line2: 'Plot 45',
            state: 'Nairobi'
          }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440006',
          customer_id: '550e8400-e29b-41d4-a716-446655440006',
          delivery_address_id: '660e8400-e29b-41d4-a716-446655440007',
          order_date: '2024-01-19',
          scheduled_date: '2024-01-21',
          status: 'confirmed',
          cylinder_size: '13kg',
          quantity: 8,
          price_kes: 2599.00,
          total_amount_kes: '20792.00',
          notes: 'Safari lodge weekly supply',
          created_at: '2024-01-19T10:15:00Z',
          updated_at: '2024-01-19T12:30:00Z',
          customer: {
            id: '550e8400-e29b-41d4-a716-446655440006',
            name: 'Safari Lodge Catering',
            phone: '+254706789012',
            email: 'catering@safarilodge.co.ke'
          },
          delivery_address: {
            id: '660e8400-e29b-41d4-a716-446655440007',
            city: 'Nairobi',
            line1: 'Langata Road',
            line2: 'KM 15',
            state: 'Nairobi'
          }
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440007',
          customer_id: '550e8400-e29b-41d4-a716-446655440001',
          delivery_address_id: '660e8400-e29b-41d4-a716-446655440002',
          order_date: '2024-01-19',
          scheduled_date: null,
          status: 'draft',
          cylinder_size: '6kg',
          quantity: 6,
          price_kes: 1899.00,
          total_amount_kes: '11394.00',
          notes: 'Branch office monthly order - draft',
          created_at: '2024-01-19T15:45:00Z',
          updated_at: '2024-01-19T15:45:00Z',
          customer: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Acme Restaurant Group',
            phone: '+254701234567',
            email: 'orders@acmerestaurants.co.ke'
          },
          delivery_address: {
            id: '660e8400-e29b-41d4-a716-446655440002',
            city: 'Nairobi',
            line1: 'Sarit Centre',
            line2: 'Level 1',
            state: 'Nairobi'
          }
        }
      ];
      
      // Apply search filter
      let filteredOrders = [...mockOrders];
      
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(searchTerm) ||
          (order.customer?.name && order.customer.name.toLowerCase().includes(searchTerm)) ||
          (order.customer?.phone && order.customer.phone.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply status filter
      if (filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
          order.status === filters.status
        );
      }
      
      // Apply date range filter
      if (filters.dateFrom) {
        filteredOrders = filteredOrders.filter(order => 
          order.order_date >= filters.dateFrom
        );
      }
      
      if (filters.dateTo) {
        filteredOrders = filteredOrders.filter(order => 
          order.order_date <= filters.dateTo
        );
      }
      
      // Apply sorting
      filteredOrders.sort((a, b) => {
        let aValue: any = a[sortField as keyof Order];
        let bValue: any = b[sortField as keyof Order];
        
        // Handle nested properties like customer.name
        if (sortField === 'customer') {
          aValue = a.customer?.name || '';
          bValue = b.customer?.name || '';
        }
        
        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string values
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedOrders = filteredOrders.slice(from, to);
      
      setOrders(paginatedOrders);
      setTotalCount(filteredOrders.length);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string): Promise<boolean> => {
    try {
      // In a real implementation, this would update the order status in the database
      // For now, we'll simulate a successful update
      
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
  }, []);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      // In a real implementation, this would update the order status to cancelled in the database
      // For now, we'll simulate a successful cancellation
      
      // Release any reserved inventory
      console.log('Order cancelled - reserved inventory should be released');

      toast.success('Order cancelled successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (orderIds: string[], status: string): Promise<boolean> => {
    try {
      // In a real implementation, this would update multiple orders in the database
      // For now, we'll simulate a successful update
      
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
  }, []);

  const exportOrdersToCSV = useCallback(async (orderIds?: string[]): Promise<string> => {
    try {
      // In a real implementation, this would query the database for orders
      // For now, we'll generate a simple CSV with mock data
      
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

      // Create CSV rows with mock data
      const rows = [
        [
          '990e8400-e29b-41d4-a716-446655440001',
          'Acme Restaurant Group',
          '+254701234567',
          '2024-01-15',
          '2024-01-17',
          'delivered',
          '13kg',
          '5',
          '12995.00',
          'Nairobi',
          '1/15/2024'
        ],
        [
          '990e8400-e29b-41d4-a716-446655440002',
          'Downtown Diner',
          '+254702345678',
          '2024-01-16',
          '2024-01-18',
          'en_route',
          '6kg',
          '8',
          '15192.00',
          'Nairobi',
          '1/16/2024'
        ]
      ];

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
  }, []);

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