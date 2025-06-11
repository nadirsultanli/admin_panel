import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Warehouse, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import type { InventoryBalance, StockLevel } from '@/types/inventory';

interface InventoryLevelsProps {
  productId: string;
  productName: string;
}

export function InventoryLevels({ productId, productName }: InventoryLevelsProps) {
  const { inventory, loading, error, fetchInventory, clearError } = useInventory();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchInventory(productId);
    setLastUpdated(new Date());
  }, [productId, fetchInventory]);

  // Set up real-time subscription
  useEffect(() => {
    const { supabase } = require('@/lib/supabase');
    
    const subscription = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_balance',
          filter: `product_id=eq.${productId}`
        },
        () => {
          fetchInventory(productId);
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [productId, fetchInventory]);

  const getStockLevel = (full: number, empty: number): StockLevel => {
    const total = full + empty;
    const fullRatio = total > 0 ? full / total : 0;

    if (full === 0) {
      return { level: 'out', color: 'text-red-600', threshold: 0 };
    } else if (fullRatio < 0.2) {
      return { level: 'low', color: 'text-yellow-600', threshold: 20 };
    } else {
      return { level: 'good', color: 'text-green-600', threshold: 80 };
    }
  };

  const getStockBadge = (level: StockLevel['level']) => {
    switch (level) {
      case 'good':
        return (
          <Badge variant="default\" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Good Stock
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Low Stock
          </Badge>
        );
      case 'out':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Out of Stock
          </Badge>
        );
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const handleRefresh = () => {
    fetchInventory(productId);
    setLastUpdated(new Date());
  };

  const totalFull = inventory.reduce((sum, inv) => sum + inv.qty_full, 0);
  const totalEmpty = inventory.reduce((sum, inv) => sum + inv.qty_empty, 0);
  const totalReserved = inventory.reduce((sum, inv) => sum + inv.qty_reserved, 0);
  const totalAvailable = totalFull - totalReserved;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Inventory Levels
            </CardTitle>
            <CardDescription>
              Current stock levels for {productName} across all warehouses
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{totalFull}</div>
              <p className="text-xs text-muted-foreground">Full Cylinders</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{totalAvailable}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{totalReserved}</div>
              <p className="text-xs text-muted-foreground">Reserved</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">{totalEmpty}</div>
              <p className="text-xs text-muted-foreground">Empty Cylinders</p>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Details */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Warehouse className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No inventory data</h3>
            <p className="text-sm">
              No inventory records found for this product across any warehouses.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-center">Full</TableHead>
                  <TableHead className="text-center">Empty</TableHead>
                  <TableHead className="text-center">Reserved</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((inv) => {
                  const stockLevel = getStockLevel(inv.qty_full, inv.qty_empty);
                  const available = inv.qty_full - inv.qty_reserved;
                  
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{inv.warehouse?.name || 'Unknown Warehouse'}</div>
                          {inv.warehouse?.address && (
                            <div className="text-sm text-muted-foreground">
                              {inv.warehouse.address.city}
                              {inv.warehouse.address.state && `, ${inv.warehouse.address.state}`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{inv.qty_full}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-muted-foreground">{inv.qty_empty}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-orange-600">{inv.qty_reserved}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${stockLevel.color}`}>
                          {available}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStockBadge(stockLevel.level)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatLastUpdated(new Date(inv.updated_at))}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}