import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  ShoppingCart, 
  User, 
  Package, 
  CheckCircle, 
  Calendar, 
  Truck, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Info
} from 'lucide-react';
import type { ActivityItem } from '@/hooks/useRealtimeDashboard';

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading: boolean;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'order_status':
        if (activity.message.includes('delivered')) {
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (activity.message.includes('scheduled')) {
          return <Calendar className="h-4 w-4 text-orange-600" />;
        } else if (activity.message.includes('en route')) {
          return <Truck className="h-4 w-4 text-purple-600" />;
        } else {
          return <ShoppingCart className="h-4 w-4 text-blue-600" />;
        }
      case 'customer_added':
        if (activity.message.includes('updated')) {
          return <Edit className="h-4 w-4 text-blue-600" />;
        } else {
          return <User className="h-4 w-4 text-green-600" />;
        }
      case 'stock_movement':
        if (activity.message.includes('transferred')) {
          return <Truck className="h-4 w-4 text-blue-600" />;
        } else if (activity.message.includes('+')) {
          return <Plus className="h-4 w-4 text-green-600" />;
        } else {
          return <Package className="h-4 w-4 text-orange-600" />;
        }
      case 'system':
        if (activity.message.includes('alert')) {
          return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
        } else {
          return <Info className="h-4 w-4 text-blue-600" />;
        }
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'order_status':
        return <Badge variant="default\" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Order</Badge>;
      case 'customer_added':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Customer</Badge>;
      case 'stock_movement':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Inventory</Badge>;
      case 'system':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">System</Badge>;
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>Recent system activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
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
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>Recent system activities and events</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No recent activity</h3>
            <p className="text-sm">
              System activities will appear here as they occur.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted flex-shrink-0">
                  {getActivityIcon(activity)}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActivityBadge(activity)}
                      {activity.user && (
                        <span className="text-xs text-muted-foreground">by {activity.user}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{activity.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}