import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  Filter,
  Loader2
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockLevelData, WarehouseOverviewData } from '@/hooks/useInventoryDashboard';

interface StockLevelsTableProps {
  stockLevels: StockLevelData[];
  warehouses: WarehouseOverviewData[];
  loading: boolean;
  onRefresh: () => void;
}

export function StockLevelsTable({ stockLevels, warehouses, loading, onRefresh }: StockLevelsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'good' | 'low' | 'out'>('all');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const getStockBadge = (status: StockLevelData['stock_status']) => {
    switch (status) {
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

  const handleQuickAdjustment = (productId: string, warehouseId: string, type: 'full' | 'empty', amount: number) => {
    // This would trigger a quick adjustment
    console.log('Quick adjustment:', { productId, warehouseId, type, amount });
    // In a real implementation, this would call an API to adjust inventory
    onRefresh();
  };

  // Filter stock levels
  const filteredStockLevels = stockLevels.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         item.product_sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const TableSkeleton = () => (
    <div className="rounded-md border overflow-x-auto w-full">
      <Table className="w-full table-auto">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            {warehouses.map(warehouse => (
              <TableHead key={warehouse.id} className="text-center min-w-[120px]">
                {warehouse.name}
              </TableHead>
            ))}
            <TableHead className="text-center">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} className="animate-in fade-in-50 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              {warehouses.map(warehouse => (
                <TableCell key={warehouse.id} className="text-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16 mx-auto" />
                    <div className="flex justify-center gap-1">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>
                  </div>
                </TableCell>
              ))}
              <TableCell className="text-center">
                <div className="space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Levels
          </CardTitle>
          <CardDescription>Current inventory levels across all warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-200 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Levels
        </CardTitle>
        <CardDescription>Current inventory levels across all warehouses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-primary/20"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200 ease-in-out">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="good">Good Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-visible w-full">
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Product</TableHead>
                {warehouses.map(warehouse => (
                  <TableHead key={warehouse.id} className="text-center">
                    {warehouse.name}
                  </TableHead>
                ))}
                <TableHead className="text-center">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStockLevels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={warehouses.length + 3} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8 opacity-50" />
                      <span>No products found matching your criteria.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStockLevels.map((item, index) => (
                  <TableRow 
                    key={item.product_id} 
                    className="hover:bg-muted/50 transition-colors duration-150 animate-in fade-in-50 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 25}ms` }}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {item.product_sku}
                        </div>
                      </div>
                    </TableCell>
                    
                    {warehouses.map(warehouse => {
                      const warehouseData = item.warehouses[warehouse.id];
                      return (
                        <TableCell key={warehouse.id} className="text-center">
                          {warehouseData ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-center gap-1 text-sm">
                                <span className={`font-medium ${
                                  warehouseData.qty_full - warehouseData.qty_reserved < 10 && 
                                  warehouseData.qty_full - warehouseData.qty_reserved > 0 
                                    ? 'text-yellow-600' 
                                    : warehouseData.qty_full - warehouseData.qty_reserved === 0 
                                      ? 'text-red-600' 
                                      : 'text-green-600'
                                }`}>
                                  {warehouseData.qty_full}
                                </span>
                                <span className="text-muted-foreground">|</span>
                                <span className="text-muted-foreground">{warehouseData.qty_empty}</span>
                                {warehouseData.qty_reserved > 0 && (
                                  <>
                                    <span className="text-muted-foreground">|</span>
                                    <span className="text-orange-600">{warehouseData.qty_reserved}</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Quick adjustment buttons */}
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  onClick={() => handleQuickAdjustment(item.product_id, warehouse.id, 'full', 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  onClick={() => handleQuickAdjustment(item.product_id, warehouse.id, 'full', -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                    
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium text-lg">
                          {item.total_available}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.total_full} full | {item.total_empty} empty
                          {item.total_reserved > 0 && ` | ${item.total_reserved} reserved`}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStockBadge(item.stock_status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="text-xs text-muted-foreground space-y-1 animate-in fade-in-50 duration-500">
          <p><strong>Format:</strong> Full | Empty | Reserved</p>
          <p><strong>Colors:</strong> <span className="text-green-600">Green = Good stock</span>, <span className="text-yellow-600">Yellow = Low stock</span>, <span className="text-red-600">Red = Out of stock</span></p>
        </div>
      </CardContent>
    </Card>
  );
}