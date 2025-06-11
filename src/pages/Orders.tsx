import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  ShoppingCart, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { OrderWizard } from '@/components/orders/OrderWizard';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderFiltersComponent } from '@/components/orders/OrderFilters';
import { BulkOrderActions } from '@/components/orders/BulkOrderActions';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useOrders } from '@/hooks/useOrders';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import type { Order, OrderFilters } from '@/types/order';

const PAGE_SIZE = 20;

export function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const debouncedFilters = useDebounce(filters, 400);

  const {
    orders,
    loading,
    error,
    totalCount,
    fetchOrders,
    updateOrderStatus,
    cancelOrder,
    bulkUpdateStatus,
    exportOrdersToCSV,
    clearError
  } = useOrders();

  // Show success message if navigated from wizard
  useEffect(() => {
    if (location.state?.message) {
      if (location.state.type === 'success') {
        toast.success(location.state.message);
      } else {
        toast.error(location.state.message);
      }
      // Clear the state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  // Load orders when filters, page, or sort changes
  useEffect(() => {
    fetchOrders(debouncedFilters, currentPage, PAGE_SIZE, sortField, sortDirection);
  }, [fetchOrders, debouncedFilters, currentPage, sortField, sortDirection]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedFilters]);

  const handleCreateOrder = () => {
    setShowWizard(true);
  };

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      fetchOrders(debouncedFilters, currentPage, PAGE_SIZE, sortField, sortDirection);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const success = await cancelOrder(orderId);
    if (success) {
      fetchOrders(debouncedFilters, currentPage, PAGE_SIZE, sortField, sortDirection);
    }
  };

  const handleViewOrder = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    const success = await bulkUpdateStatus(selectedOrders, status);
    if (success) {
      setSelectedOrders([]);
      fetchOrders(debouncedFilters, currentPage, PAGE_SIZE, sortField, sortDirection);
    }
  };

  const handleBulkExport = async () => {
    try {
      const csvContent = await exportOrdersToCSV(selectedOrders.length > 0 ? selectedOrders : undefined);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('Orders exported successfully!');
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  // Calculate stats
  const totalOrders = totalCount;
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'scheduled'].includes(o.status)).length;
  const deliveredToday = orders.filter(o => 
    o.status === 'delivered' && 
    new Date(o.scheduled_date || o.order_date).toDateString() === new Date().toDateString()
  ).length;
  const todayRevenue = orders
    .filter(o => 
      o.status === 'delivered' && 
      new Date(o.scheduled_date || o.order_date).toDateString() === new Date().toDateString()
    )
    .reduce((sum, o) => sum + parseFloat(o.total_amount_kes), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (showWizard) {
    return <OrderWizard />;
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      <PageHeader
        title="Order Management"
        description="Track and manage customer orders and deliveries"
        actionLabel="Create Order"
        actionIcon={Plus}
        onAction={handleCreateOrder}
      >
        <Button variant="outline" onClick={handleBulkExport}>
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 w-full">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayRevenue * 30)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalOrders > 0 ? (todayRevenue * 30) / totalOrders : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          message={error}
          onDismiss={clearError}
          onRetry={() => fetchOrders(filters, currentPage, PAGE_SIZE, sortField, sortDirection)}
        />
      )}

      {/* Main Content */}
      <Card className="w-full transition-all duration-200">
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
          <CardDescription>
            View and manage all customer orders with advanced filtering and bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <OrderFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />

          {/* Bulk Actions */}
          <BulkOrderActions
            selectedCount={selectedOrders.length}
            onClearSelection={() => setSelectedOrders([])}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkExport={handleBulkExport}
          />

          {/* Orders Table */}
          <div className="w-full overflow-hidden">
            {loading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner text="Loading orders..." />
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No orders found"
                description={Object.values(filters).some(v => v !== '' && v !== 'all') 
                  ? "Try adjusting your search criteria or filters"
                  : "Get started by creating your first order"}
                actionLabel="Create Order"
                actionIcon={Plus}
                onAction={handleCreateOrder}
              />
            ) : (
              <OrdersTable
                orders={orders}
                loading={false}
                selectedOrders={selectedOrders}
                onSelectionChange={setSelectedOrders}
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                onViewOrder={handleViewOrder}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            )}
          </div>

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} orders
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  &lt;
                </Button>
                <span className="flex items-center">Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / PAGE_SIZE)))}
                  disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
                  className="h-8 w-8 p-0"
                >
                  &gt;
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}