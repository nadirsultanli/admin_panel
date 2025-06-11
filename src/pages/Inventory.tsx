import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Warehouse, 
  TrendingUp, 
  AlertTriangle, 
  Package,
  ArrowUpDown,
  Settings,
  Upload,
  RefreshCw,
  Database
} from 'lucide-react';
import { WarehouseOverview } from '@/components/inventory/WarehouseOverview';
import { StockLevelsTable } from '@/components/inventory/StockLevelsTable';
import { RecentMovements } from '@/components/inventory/RecentMovements';
import { TransferStockModal } from '@/components/inventory/TransferStockModal';
import { InventoryAdjustmentModal } from '@/components/inventory/InventoryAdjustmentModal';
import { StockSeedingButton } from '@/components/inventory/StockSeedingButton';
import { InventoryExportButton } from '@/components/inventory/InventoryExportButton';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LastUpdatedIndicator } from '@/components/common/LastUpdatedIndicator';
import { useInventoryDashboard } from '@/hooks/useInventoryDashboard';
import { useInventorySeeding } from '@/hooks/useInventorySeeding';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { toast } from 'sonner';

export function Inventory() {
  const {
    warehouses,
    stockLevels,
    movements,
    loading,
    error,
    fetchDashboardData,
    clearError
  } = useInventoryDashboard();

  const {
    hasExistingInventory,
    checkInventoryExists,
    loading: seedingLoading
  } = useInventorySeeding();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Set up real-time inventory updates
  useRealtimeInventory({
    onInventoryChange: () => {
      fetchDashboardData();
      setLastUpdated(new Date());
    },
    onStockLevelChange: (productId, level) => {
      console.log(`Stock level changed for product ${productId}: ${level}`);
    }
  });

  useEffect(() => {
    fetchDashboardData();
    checkInventoryExists();
  }, [fetchDashboardData, checkInventoryExists]);

  const handleRefresh = () => {
    fetchDashboardData();
    checkInventoryExists();
    setLastUpdated(new Date());
    toast.success('Inventory data refreshed');
  };

  const handleWarehouseClick = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    // Could navigate to warehouse detail view
  };

  const handleTransferSuccess = () => {
    fetchDashboardData(); // Refresh data after transfer
    setLastUpdated(new Date());
  };

  const handleAdjustmentSuccess = () => {
    fetchDashboardData(); // Refresh data after adjustment
    setLastUpdated(new Date());
  };

  const handleSeedingComplete = () => {
    fetchDashboardData();
    checkInventoryExists();
    setLastUpdated(new Date());
  };

  // Calculate summary stats
  const totalWarehouses = warehouses.length;
  const totalProducts = stockLevels.length;
  const lowStockItems = stockLevels.filter(item => 
    item.total_available < 10 && item.total_available > 0
  ).length;
  const outOfStockItems = stockLevels.filter(item => 
    item.total_available === 0
  ).length;

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Inventory Management"
        description="Monitor stock levels, manage transfers, and track inventory movements"
        actionLabel="Transfer Stock"
        actionIcon={ArrowUpDown}
        onAction={() => setTransferModalOpen(true)}
        secondaryActionLabel="Adjust Stock"
        secondaryActionIcon={Settings}
        onSecondaryAction={() => setAdjustmentModalOpen(true)}
      >
        {/* Show seeding button only if no inventory exists */}
        {!hasExistingInventory && !seedingLoading && (
          <StockSeedingButton onSeedingComplete={handleSeedingComplete} />
        )}
        
        <InventoryExportButton />
        
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Last Updated Indicator */}
      <div className="flex justify-end">
        <LastUpdatedIndicator 
          timestamp={lastUpdated}
          onRefresh={handleRefresh}
          autoRefresh={true}
          refreshInterval={120} // 2 minutes
        />
      </div>

      {/* Summary Stats - Full width grid */}
      <div className="grid gap-4 md:grid-cols-4 w-full">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWarehouses}</div>
            <p className="text-xs text-muted-foreground">
              Active storage locations
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Tracked</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across all warehouses
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Below 10 units
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Require restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          message={error}
          onDismiss={clearError}
          onRetry={handleRefresh}
        />
      )}

      {/* Empty State for No Inventory */}
      {!hasExistingInventory && !loading && !seedingLoading && (
        <EmptyState
          icon={Database}
          title="No Inventory Data Found"
          description="Get started by seeding your inventory with sample data including warehouses, products, and initial stock levels."
          actionLabel="Seed Initial Data"
          actionIcon={Database}
          onAction={handleSeedingComplete}
        />
      )}

      {/* Main Content - Only show if inventory exists */}
      {hasExistingInventory && (
        <>
          {/* Warehouse Overview - Full width */}
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Overview</CardTitle>
                <CardDescription>Loading warehouse data...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 flex justify-center">
                  <LoadingSpinner text="Loading warehouses..." />
                </div>
              </CardContent>
            </Card>
          ) : (
            <WarehouseOverview 
              warehouses={warehouses}
              loading={false}
              onWarehouseClick={handleWarehouseClick}
            />
          )}

          {/* Stock Levels Table - Full width */}
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
                <CardDescription>Loading inventory data...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 flex justify-center">
                  <LoadingSpinner text="Loading stock levels..." />
                </div>
              </CardContent>
            </Card>
          ) : (
            <StockLevelsTable 
              stockLevels={stockLevels}
              warehouses={warehouses}
              loading={false}
              onRefresh={fetchDashboardData}
            />
          )}

          {/* Recent Movements - Full width */}
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Movements</CardTitle>
                <CardDescription>Loading movement history...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 flex justify-center">
                  <LoadingSpinner text="Loading movement history..." />
                </div>
              </CardContent>
            </Card>
          ) : (
            <RecentMovements 
              movements={movements}
              loading={false}
            />
          )}
        </>
      )}

      {/* Modals */}
      <TransferStockModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        warehouses={warehouses}
        onSuccess={handleTransferSuccess}
      />

      <InventoryAdjustmentModal
        open={adjustmentModalOpen}
        onOpenChange={setAdjustmentModalOpen}
        warehouses={warehouses}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
}