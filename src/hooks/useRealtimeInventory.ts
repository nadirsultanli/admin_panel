import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseRealtimeInventoryProps {
  onInventoryChange?: () => void;
  onStockLevelChange?: (productId: string, newLevel: 'good' | 'low' | 'out') => void;
}

export function useRealtimeInventory({
  onInventoryChange,
  onStockLevelChange
}: UseRealtimeInventoryProps = {}) {
  
  const handleInventoryUpdate = useCallback((payload: any) => {
    console.log('Inventory updated:', payload);
    
    // Calculate available stock for notifications
    if (payload.new && onStockLevelChange) {
      const available = payload.new.qty_full - payload.new.qty_reserved;
      let level: 'good' | 'low' | 'out' = 'good';
      
      if (available === 0) {
        level = 'out';
        toast.warning('Product is now out of stock!');
      } else if (available < 10) {
        level = 'low';
        toast.warning(`Low stock alert: Only ${available} units remaining`);
      }
      
      onStockLevelChange(payload.new.product_id, level);
    }
    
    // Trigger general inventory refresh
    onInventoryChange?.();
  }, [onInventoryChange, onStockLevelChange]);

  useEffect(() => {
    // Subscribe to inventory_balance changes
    const inventorySubscription = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_balance'
        },
        handleInventoryUpdate
      )
      .subscribe();

    // Subscribe to warehouse changes
    const warehouseSubscription = supabase
      .channel('warehouse_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'warehouses'
        },
        () => {
          console.log('Warehouse updated');
          onInventoryChange?.();
        }
      )
      .subscribe();

    // Subscribe to product changes
    const productSubscription = supabase
      .channel('product_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          console.log('Product updated');
          onInventoryChange?.();
        }
      )
      .subscribe();

    return () => {
      inventorySubscription.unsubscribe();
      warehouseSubscription.unsubscribe();
      productSubscription.unsubscribe();
    };
  }, [handleInventoryUpdate, onInventoryChange]);

  return {
    // Could return subscription status or other utilities if needed
  };
}