import { useState, useCallback, useEffect } from 'react';
import { supabase, supabaseAdmin, isUserAdmin } from '@/lib/supabase';
import type { InventoryBalance, InventoryAdjustment, ProductUsageAnalytics } from '@/types/inventory';
import { toast } from 'sonner';

interface UseInventoryReturn {
  inventory: InventoryBalance[];
  adjustments: InventoryAdjustment[];
  analytics: ProductUsageAnalytics | null;
  loading: boolean;
  error: string | null;
  fetchInventory: (productId: string) => Promise<void>;
  fetchAdjustments: (productId: string) => Promise<void>;
  fetchAnalytics: (productId: string) => Promise<void>;
  adjustInventory: (adjustment: Omit<InventoryAdjustment, 'id' | 'created_at'>) => Promise<boolean>;
  clearError: () => void;
}

export function useInventory(): UseInventoryReturn {
  const [inventory, setInventory] = useState<InventoryBalance[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [analytics, setAnalytics] = useState<ProductUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchInventory = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      const { data, error } = await client
        .from('inventory_balance')
        .select(`
          *,
          warehouse:warehouses(
            id,
            name,
            address:addresses(city, state)
          )
        `)
        .eq('product_id', productId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setInventory(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchAdjustments = useCallback(async (productId: string) => {
    try {
      // Note: This would require an inventory_adjustments table in production
      // For now, we'll simulate with empty data
      setAdjustments([]);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async (productId: string) => {
    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      // Calculate analytics from orders data
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get delivered orders for this product this month
      const { data: monthlyOrders, error: monthlyError } = await client
        .from('order_lines')
        .select(`
          quantity,
          order:orders!inner(
            status,
            order_date,
            delivery_date
          )
        `)
        .eq('product_id', productId)
        .eq('order.status', 'delivered')
        .gte('order.order_date', `${currentMonth}-01`);

      if (monthlyError) throw monthlyError;

      // Get usage trend for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: trendData, error: trendError } = await client
        .from('order_lines')
        .select(`
          quantity,
          order:orders!inner(
            status,
            delivery_date
          )
        `)
        .eq('product_id', productId)
        .eq('order.status', 'delivered')
        .gte('order.delivery_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (trendError) throw trendError;

      // Calculate metrics
      const totalDelivered = monthlyOrders?.reduce((sum, order) => sum + order.quantity, 0) || 0;
      const daysInMonth = new Date().getDate();
      const averageDaily = daysInMonth > 0 ? totalDelivered / daysInMonth : 0;

      // Group trend data by date
      const trendMap = new Map<string, number>();
      trendData?.forEach(order => {
        const date = order.order?.delivery_date;
        if (date) {
          const existing = trendMap.get(date) || 0;
          trendMap.set(date, existing + order.quantity);
        }
      });

      const usageTrend = Array.from(trendMap.entries())
        .map(([date, quantity]) => ({ date, quantity }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setAnalytics({
        total_delivered_month: totalDelivered,
        average_daily_usage: averageDaily,
        usage_trend: usageTrend
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalytics({
        total_delivered_month: 0,
        average_daily_usage: 0,
        usage_trend: []
      });
    }
  }, [isAdmin]);

  const adjustInventory = useCallback(async (
    adjustmentData: Omit<InventoryAdjustment, 'id' | 'created_at'>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      // In a real implementation, this would be handled by a stored procedure
      // or edge function to ensure atomicity
      
      // First, get current inventory
      const { data: currentInventory, error: fetchError } = await client
        .from('inventory_balance')
        .select('*')
        .eq('warehouse_id', adjustmentData.warehouse_id)
        .eq('product_id', adjustmentData.product_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      // Calculate new quantities
      const current = currentInventory || {
        qty_full: 0,
        qty_empty: 0,
        qty_reserved: 0
      };

      const newQuantities = { ...current };
      
      switch (adjustmentData.adjustment_type) {
        case 'full':
          newQuantities.qty_full = Math.max(0, current.qty_full + adjustmentData.quantity_change);
          break;
        case 'empty':
          newQuantities.qty_empty = Math.max(0, current.qty_empty + adjustmentData.quantity_change);
          break;
        case 'reserved':
          newQuantities.qty_reserved = Math.max(0, current.qty_reserved + adjustmentData.quantity_change);
          break;
      }

      // Update or insert inventory record
      if (currentInventory) {
        const { error: updateError } = await client
          .from('inventory_balance')
          .update({
            ...newQuantities,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentInventory.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await client
          .from('inventory_balance')
          .insert({
            warehouse_id: adjustmentData.warehouse_id,
            product_id: adjustmentData.product_id,
            ...newQuantities,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      toast.success('Inventory adjusted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust inventory';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  return {
    inventory,
    adjustments,
    analytics,
    loading,
    error,
    fetchInventory,
    fetchAdjustments,
    fetchAnalytics,
    adjustInventory,
    clearError
  };
}