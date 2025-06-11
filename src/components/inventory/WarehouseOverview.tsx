import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Warehouse, 
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { WarehouseOverviewData } from '@/hooks/useInventoryDashboard';

interface WarehouseOverviewProps {
  warehouses: WarehouseOverviewData[];
  loading: boolean;
  onWarehouseClick: (warehouseId: string) => void;
}

export function WarehouseOverview({ warehouses, loading, onWarehouseClick }: WarehouseOverviewProps) {
  const getStatusBadge = (status: WarehouseOverviewData['status']) => {
    switch (status) {
      case 'good':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Good
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        );
    }
  };

  const getProgressColor = (status: WarehouseOverviewData['status']) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Overview
          </CardTitle>
          <CardDescription>Storage capacity and utilization across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (warehouses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Overview
          </CardTitle>
          <CardDescription>Storage capacity and utilization across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Warehouse className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No warehouses found</h3>
            <p className="text-sm">
              Add warehouses to start tracking inventory across multiple locations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Warehouse Overview
        </CardTitle>
        <CardDescription>Storage capacity and utilization across all locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <Card 
              key={warehouse.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onWarehouseClick(warehouse.id)}
            >
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium leading-none">{warehouse.name}</h4>
                      {warehouse.address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {warehouse.address.city}
                            {warehouse.address.state && `, ${warehouse.address.state}`}
                          </span>
                        </div>
                      )}
                    </div>
                    {getStatusBadge(warehouse.status)}
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-medium">{warehouse.utilization_percentage}%</span>
                    </div>
                    
                    <Progress 
                      value={warehouse.utilization_percentage} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{warehouse.total_cylinders.toLocaleString()} cylinders</span>
                      <span>of {warehouse.capacity_cylinders?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Click to view details</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}