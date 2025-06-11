import { useState, useCallback, useEffect } from 'react';
import { 
  checkIfInventoryExists,
  runCompleteSeeding,
  exportInventoryToCSV,
  downloadCSV,
  type SeedingProgress
} from '@/lib/inventorySeeding';
import { toast } from 'sonner';
import { isUserAdmin } from '@/lib/supabase';

interface UseInventorySeedingReturn {
  isSeeding: boolean;
  seedingProgress: SeedingProgress | null;
  hasExistingInventory: boolean;
  checkInventoryExists: () => Promise<void>;
  startSeeding: () => Promise<void>;
  exportInventory: () => Promise<void>;
  loading: boolean;
}

export function useInventorySeeding(): UseInventorySeedingReturn {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState<SeedingProgress | null>(null);
  const [hasExistingInventory, setHasExistingInventory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isUserAdmin();
      setIsAdmin(adminStatus);
    };
    
    checkAdminStatus();
  }, []);

  const checkInventoryExists = useCallback(async () => {
    setLoading(true);
    try {
      const exists = await checkIfInventoryExists();
      setHasExistingInventory(exists);
    } catch (error) {
      console.error('Error checking inventory:', error);
      toast.error('Failed to check inventory status');
    } finally {
      setLoading(false);
    }
  }, []);

  const startSeeding = useCallback(async () => {
    if (!isAdmin) {
      toast.error('Only admin users can seed inventory data');
      return;
    }
    
    setIsSeeding(true);
    setSeedingProgress(null);

    try {
      await runCompleteSeeding((progress) => {
        setSeedingProgress(progress);
      });

      toast.success('Inventory seeding completed successfully!');
      setHasExistingInventory(true);
    } catch (error) {
      console.error('Error during seeding:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to seed inventory');
    } finally {
      setIsSeeding(false);
      setSeedingProgress(null);
    }
  }, [isAdmin]);

  const exportInventory = useCallback(async () => {
    setLoading(true);
    try {
      const csvContent = await exportInventoryToCSV();
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csvContent, `inventory-export-${timestamp}.csv`);
      toast.success('Inventory exported successfully!');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      toast.error('Failed to export inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSeeding,
    seedingProgress,
    hasExistingInventory,
    checkInventoryExists,
    startSeeding,
    exportInventory,
    loading
  };
}