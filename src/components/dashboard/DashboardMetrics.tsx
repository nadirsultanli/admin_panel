import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  Users 
} from 'lucide-react';
import type { DashboardMetrics } from '@/hooks/useRealtimeDashboard';

interface DashboardMetricsProps {
  metrics: DashboardMetrics;
  loading: boolean;
}

export function DashboardMetrics({ metrics, loading }: DashboardMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getTrendText = (trend: number, isInverted: boolean = false) => {
    // For some metrics like "low stock items", a negative trend is actually good
    const adjustedTrend = isInverted ? -trend : trend;
    const color = adjustedTrend > 0 ? 'text-green-600' : adjustedTrend < 0 ? 'text-red-600' : 'text-gray-500';
    
    return (
      <span className={color}>
        {adjustedTrend > 0 ? '+' : ''}{trend}% from yesterday
      </span>
    );
  };

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
      {/* Today's Orders */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{metrics.todayOrders.count}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {getTrendIcon(metrics.todayOrders.trend)}
                {getTrendText(metrics.todayOrders.trend)}
              </div>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(metrics.todayOrders.value)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Deliveries */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pendingDeliveries.count}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {getTrendIcon(metrics.pendingDeliveries.trend)}
            {getTrendText(metrics.pendingDeliveries.trend)}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Items */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{metrics.lowStockItems.count}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {getTrendIcon(metrics.lowStockItems.trend)}
            {/* For low stock, a negative trend is good */}
            {getTrendText(metrics.lowStockItems.trend, true)}
          </div>
        </CardContent>
      </Card>

      {/* Active Customers */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeCustomers.count}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {getTrendIcon(metrics.activeCustomers.trend)}
            {getTrendText(metrics.activeCustomers.trend)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}