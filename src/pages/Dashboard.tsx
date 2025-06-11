import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Warehouse,
  Database,
  Clock,
  Calendar,
  Bell,
  ArrowUp,
  ArrowDown,
  Plus,
  FileText,
  RefreshCw,
  Activity
} from 'lucide-react';
import { supabase, supabaseAdmin, handleSupabaseError, isUserAdmin, testConnection } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';

export function Dashboard() {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { 
    metrics,
    recentOrders,
    lowStockItems,
    activities,
    loading,
    error,
    refreshDashboard
  } = useRealtimeDashboard();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isUserAdmin();
      setIsAdmin(adminStatus);
    };
    
    checkAdminStatus();
  }, []);

  // Test Supabase connection on mount
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('checking');
      
      // Test basic connection
      const result = await testConnection();
      
      if (!result) {
        console.error('Supabase connection test failed');
        setConnectionStatus('error');
        toast.error(`Connection failed: Could not connect to Supabase`);
        return;
      }
      
      setConnectionStatus('connected');
      toast.success('Supabase connection successful!');
      
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      toast.error(`Connection test failed: ${handleSupabaseError(error)}`);
    }
  };

  const handleRefresh = useCallback(() => {
    refreshDashboard();
    setLastRefreshed(new Date());
    toast.success('Dashboard refreshed');
  }, [refreshDashboard]);

  const formatLastRefreshed = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header with Welcome and Date/Time */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to your Dashboard</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Last updated: {formatLastRefreshed()}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            <Database className="h-4 w-4" />
            <span>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Checking...'}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <DashboardMetrics metrics={metrics} loading={loading} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Orders and Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <RecentOrdersTable 
            orders={recentOrders} 
            loading={loading} 
            onViewAll={() => navigate('/orders')}
            onViewOrder={(orderId) => navigate(`/orders/${orderId}`)}
          />
          
          {/* Activity Feed */}
          <ActivityFeed activities={activities} loading={loading} />
        </div>
        
        {/* Right Column - Low Stock Alerts and Quick Actions */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <LowStockAlerts 
            items={lowStockItems} 
            loading={loading} 
            onViewAll={() => navigate('/inventory')}
          />
          
          {/* Quick Actions */}
          <QuickActions 
            onCreateOrder={() => navigate('/orders')}
            onAddCustomer={() => navigate('/customers')}
            onAddProduct={() => navigate('/products')}
            onViewInventory={() => navigate('/inventory')}
          />
        </div>
      </div>
    </div>
  );
}