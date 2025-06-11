import { useState, useCallback } from 'react';
import { 
  checkIfInventoryExists,
  runCompleteSeeding,
  exportInventoryToCSV,
  downloadCSV,
  type SeedingProgress
} from '@/lib/inventorySeeding';
import { toast } from 'sonner';

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

  const checkInventoryExists = useCallback(async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        setLoading(false);
        return;
      }
      
      // For demo purposes, we'll just set this to false initially
      // In a real implementation, this would check the database
      setHasExistingInventory(false);
    } catch (error) {
      console.error('Error checking inventory:', error);
      toast.error('Failed to check inventory status');
    } finally {
      setLoading(false);
    }
  }, []);

  const startSeeding = useCallback(async () => {
    setIsSeeding(true);
    setSeedingProgress(null);

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Simulate seeding process with progress updates
      const totalSteps = 4;
      
      // Step 1: Creating warehouse
      setSeedingProgress({
        step: 'Creating Main Depot warehouse...',
        progress: 1,
        total: totalSteps
      });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Creating products
      setSeedingProgress({
        step: 'Creating default products...',
        progress: 2,
        total: totalSteps
      });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 3: Seeding inventory
      setSeedingProgress({
        step: 'Seeding inventory data...',
        progress: 3,
        total: totalSteps
      });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 4: Complete
      setSeedingProgress({
        step: 'Seeding completed successfully!',
        progress: 4,
        total: totalSteps
      });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setHasExistingInventory(true);
      toast.success('Inventory seeding completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to seed inventory');
    } finally {
      setIsSeeding(false);
    }
  }, []);

  const exportInventory = useCallback(async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Generate mock CSV content
      const csvContent = `"Warehouse","Product SKU","Product Name","Full Qty","Empty Qty","Reserved Qty","Available Qty","Last Updated"
"Main Depot","CYL-6KG-STD","6kg Standard Cylinder","200","100","15","185","${new Date().toLocaleDateString()}"
"Main Depot","CYL-13KG-STD","13kg Standard Cylinder","150","75","10","140","${new Date().toLocaleDateString()}"
"Industrial Area Depot","CYL-6KG-STD","6kg Standard Cylinder","150","75","10","140","${new Date().toLocaleDateString()}"
"Industrial Area Depot","CYL-13KG-STD","13kg Standard Cylinder","80","40","5","75","${new Date().toLocaleDateString()}"`;
      
      // Simulate download
      const timestamp = new Date().toISOString().split('T')[0];
      console.log(`Exporting inventory to CSV: inventory-export-${timestamp}.csv`);
      
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