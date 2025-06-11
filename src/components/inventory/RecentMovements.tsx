import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  History, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Truck,
  Package,
  Calendar,
  Filter
} from 'lucide-react';
import type { MovementData } from '@/hooks/useInventoryDashboard';

interface RecentMovementsProps {
  movements: MovementData[];
  loading: boolean;
}

export function RecentMovements({ movements, loading }: RecentMovementsProps) {
  const [dateFilter, setDateFilter] = useState('7'); // Last 7 days
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getMovementIcon = (type: MovementData['movement_type']) => {
    switch (type) {
      case 'transfer_in':
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      case 'transfer_out':
        return <ArrowUp className="h-4 w-4 text-blue-600" />;
      case 'adjustment':
        return <Settings className="h-4 w-4 text-purple-600" />;
      case 'delivery':
        return <Truck className="h-4 w-4 text-orange-600" />;
      case 'receipt':
        return <Package className="h-4 w-4 text-green-600" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementBadge = (type: MovementData['movement_type']) => {
    switch (type) {
      case 'transfer_in':
        return <Badge variant="default\" className="bg-green-100 text-green-800 hover:bg-green-100">Transfer In</Badge>;
      case 'transfer_out':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Transfer Out</Badge>;
      case 'adjustment':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Adjustment</Badge>;
      case 'delivery':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Delivery</Badge>;
      case 'receipt':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Receipt</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatQuantity = (quantity: number, type: MovementData['movement_type']) => {
    const absQuantity = Math.abs(quantity);
    const sign = quantity >= 0 ? '+' : '-';
    const color = quantity >= 0 ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`font-medium ${color}`}>
        {sign}{absQuantity}
      </span>
    );
  };

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter;
    
    // Date filtering
    const movementDate = new Date(movement.timestamp);
    const daysAgo = parseInt(dateFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const matchesDate = movementDate >= cutoffDate;
    
    return matchesType && matchesDate;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Movements
          </CardTitle>
          <CardDescription>Latest inventory changes and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Movements
        </CardTitle>
        <CardDescription>Latest inventory changes and transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white text-gray-900 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white text-gray-900 border-gray-300">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transfer_in">Transfer In</SelectItem>
              <SelectItem value="transfer_out">Transfer Out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="receipt">Receipt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Movements Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center space-y-2">
                      <History className="h-8 w-8 opacity-50" />
                      <span>No movements found for the selected period.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            {formatTimestamp(movement.timestamp)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(movement.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {movement.product_sku}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{movement.warehouse_name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        {getMovementBadge(movement.movement_type)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {formatQuantity(movement.quantity, movement.movement_type)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {movement.reason && (
                          <div className="text-muted-foreground">{movement.reason}</div>
                        )}
                        {movement.reference && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {movement.reference}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {filteredMovements.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredMovements.length} movement{filteredMovements.length !== 1 ? 's' : ''} 
            {dateFilter !== 'all' && ` from the last ${dateFilter} day${dateFilter !== '1' ? 's' : ''}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}