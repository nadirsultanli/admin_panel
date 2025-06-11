import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { useInventorySeeding } from '@/hooks/useInventorySeeding';

export function InventoryExportButton() {
  const { exportInventory, loading } = useInventorySeeding();

  const handleExport = async () => {
    await exportInventory();
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={loading}
      className="transition-all duration-200 hover:shadow-md bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}