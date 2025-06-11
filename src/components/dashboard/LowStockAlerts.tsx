import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Package, 
  ArrowRight, 
  Warehouse,
  RefreshCw
} from 'lucide-react';
import type { LowStockItem } from '@/hooks/useRealtimeDashboard';

interface LowStockAlertsProps {
  items: LowStockItem[];
  loading: boolean;
  onViewAll: () => void;
}

export function LowStockAlerts({ items, loading, onViewAll }: LowStockAlertsProps) {
  const getUrgencyBadge = (urgency: 'critical' | 'warning') => {
    switch (urgency) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Low
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Products that need restocking soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Products that need restocking soon</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No low stock items</h3>
            <p className="text-sm">
              All products are currently above threshold levels.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <Package className={`h-4 w-4 ${
                      item.urgency === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>SKU: {item.sku}</span>
                      <span>•</span>
                      <Warehouse className="h-3 w-3" />
                      <span>{item.warehouse_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getUrgencyBadge(item.urgency)}
                  <div className={`text-sm font-medium ${
                    item.urgency === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {item.current_stock} / {item.threshold}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Restock Suggestions
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          onClick={onViewAll}
        >
          View All
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}