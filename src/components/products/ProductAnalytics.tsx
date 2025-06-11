import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  BarChart3, 
  Calendar,
  Package
} from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';

interface ProductAnalyticsProps {
  productId: string;
  productName: string;
}

export function ProductAnalytics({ productId, productName }: ProductAnalyticsProps) {
  const { analytics, loading, fetchAnalytics } = useInventory();

  useEffect(() => {
    fetchAnalytics(productId);
  }, [productId, fetchAnalytics]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Analytics
        </CardTitle>
        <CardDescription>
          Delivery trends and usage patterns for {productName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(analytics?.total_delivered_month || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Delivered This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(analytics?.average_daily_usage || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Average Daily Usage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics?.usage_trend?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Active Days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Trend Chart */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Usage Trend (Last 30 Days)</h4>
              
              {analytics?.usage_trend && analytics.usage_trend.length > 0 ? (
                <div className="space-y-2">
                  {/* Simple bar chart representation */}
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="text-center text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="h-32 bg-muted/20 rounded-lg p-4 flex items-end justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Usage trend visualization</p>
                      <p className="text-xs">Chart implementation would go here</p>
                    </div>
                  </div>
                  
                  {/* Recent activity list */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-muted-foreground">Recent Activity</h5>
                    {analytics.usage_trend.slice(-5).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span className="font-medium">{item.quantity} delivered</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No usage data</h3>
                  <p className="text-sm">
                    No delivery data found for this product in the last 30 days.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}