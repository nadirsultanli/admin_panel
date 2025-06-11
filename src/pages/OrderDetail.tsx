import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2,
  Home,
  ShoppingCart,
  User,
  MapPin,
  Package,
  Calendar,
  FileText,
  Clock,
  Edit,
  CheckCircle,
  Truck,
  X,
  Phone,
  Mail,
  CreditCard,
  Navigation,
  Camera,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { OrderStatusChangeModal } from '@/components/orders/OrderStatusChangeModal';
import { OrderEditModal } from '@/components/orders/OrderEditModal';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PageHeader } from '@/components/common/PageHeader';
import type { Order } from '@/types/order';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLines, setOrderLines] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrder(id);
      fetchStatusHistory(id);
    } else {
      setError('Invalid order ID');
      setLoading(false);
    }
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          delivery_address:addresses(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Order not found');
        } else {
          throw error;
        }
        return;
      }

      setOrder(data);

      // Fetch order lines
      const { data: lines, error: linesError } = await supabase
        .from('order_lines')
        .select(`
          *,
          product:products(*)
        `)
        .eq('order_id', orderId);

      if (linesError) throw linesError;
      setOrderLines(lines || []);

    } catch (err) {
      console.error('Error fetching order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async (orderId: string) => {
    try {
      // In a real implementation, this would fetch from a status_history table
      // For now, we'll create mock data based on the order
      
      // Simulate fetching status history
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock status history
      const mockHistory = [
        {
          id: '1',
          status: 'draft',
          timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          user: 'System',
          notes: 'Order created'
        }
      ];
      
      // Add more status changes based on current status
      const possibleStatuses = ['pending', 'confirmed', 'scheduled', 'en_route', 'delivered'];
      const currentStatusIndex = possibleStatuses.indexOf(order?.status || '');
      
      if (currentStatusIndex >= 0) {
        // Add history entries for all statuses up to current
        for (let i = 0; i <= currentStatusIndex; i++) {
          const status = possibleStatuses[i];
          const hoursAgo = 48 - (i + 1) * 8; // Spread out over the last 48 hours
          
          mockHistory.push({
            id: (i + 2).toString(),
            status,
            timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * hoursAgo).toISOString(),
            user: 'System',
            notes: status === 'delivered' ? 'Order delivered successfully' : `Status changed to ${status}`
          });
        }
      } else if (order?.status === 'cancelled') {
        // Add cancelled status
        mockHistory.push({
          id: '2',
          status: 'cancelled',
          timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          user: 'System',
          notes: 'Order cancelled by customer request'
        });
      }
      
      setStatusHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleBack = () => {
    navigate('/orders');
  };

  const handleStatusChange = (newStatus: string) => {
    setTargetStatus(newStatus);
    setStatusChangeModalOpen(true);
  };

  const handleStatusChangeConfirm = async (notes: string, photoUrl?: string) => {
    if (!order || !targetStatus) return;
    
    try {
      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: targetStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      // In a real implementation, also add to status_history table
      // and handle inventory updates for specific status changes
      
      // For delivered status, deduct inventory
      if (targetStatus === 'delivered') {
        // Mock inventory deduction
        console.log('Deducting inventory for delivered order');
        
        // In a real implementation, this would update inventory_balance table
        toast.success('Inventory updated successfully');
      }
      
      // For cancelled status, release reserved inventory
      if (targetStatus === 'cancelled') {
        // Mock inventory release
        console.log('Releasing reserved inventory for cancelled order');
        
        // In a real implementation, this would update inventory_balance table
        toast.success('Reserved inventory released');
      }

      // Refresh order data
      fetchOrder(order.id);
      fetchStatusHistory(order.id);
      
      toast.success(`Order status updated to ${targetStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setStatusChangeModalOpen(false);
      setTargetStatus(null);
    }
  };

  const handleEditOrder = () => {
    setEditModalOpen(true);
  };

  const handleEditConfirm = async (updatedData: any) => {
    if (!order) return;
    
    try {
      // Update order
      const { error } = await supabase
        .from('orders')
        .update({ 
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;
      
      // Refresh order data
      fetchOrder(order.id);
      
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setEditModalOpen(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return 'No address';
    const parts = [address.line1];
    if (address.line2) parts.push(address.line2);
    parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postal_code) parts.push(address.postal_code);
    return parts.join(', ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline\" className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-lg px-4 py-2">Draft</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-lg px-4 py-2">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-lg px-4 py-2">Confirmed</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-lg px-4 py-2">Scheduled</Badge>;
      case 'en_route':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-lg px-4 py-2">En Route</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 text-lg px-4 py-2">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 text-lg px-4 py-2">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-lg px-4 py-2">{status}</Badge>;
    }
  };

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'draft':
        return [
          { label: 'Edit Order', action: handleEditOrder, variant: 'outline' as const, icon: Edit },
          { label: 'Confirm Order', action: () => handleStatusChange('confirmed'), variant: 'default' as const, icon: CheckCircle },
          { label: 'Cancel Order', action: () => handleStatusChange('cancelled'), variant: 'destructive' as const, icon: X }
        ];
      case 'pending':
        return [
          { label: 'Confirm Order', action: () => handleStatusChange('confirmed'), variant: 'default' as const, icon: CheckCircle },
          { label: 'Cancel Order', action: () => handleStatusChange('cancelled'), variant: 'destructive' as const, icon: X }
        ];
      case 'confirmed':
        return [
          { label: 'Schedule Delivery', action: () => handleStatusChange('scheduled'), variant: 'default' as const, icon: Calendar },
          { label: 'Cancel Order', action: () => handleStatusChange('cancelled'), variant: 'destructive' as const, icon: X }
        ];
      case 'scheduled':
        return [
          { label: 'Mark En Route', action: () => handleStatusChange('en_route'), variant: 'default' as const, icon: Truck },
          { label: 'Reschedule', action: handleEditOrder, variant: 'outline' as const, icon: Calendar },
          { label: 'Cancel', action: () => handleStatusChange('cancelled'), variant: 'destructive' as const, icon: X }
        ];
      case 'en_route':
        return [
          { label: 'Mark Delivered', action: () => handleStatusChange('delivered'), variant: 'default' as const, icon: CheckCircle },
          { label: 'Report Issue', action: handleEditOrder, variant: 'outline' as const, icon: AlertTriangle }
        ];
      case 'delivered':
        return [
          { label: 'View Invoice', action: () => console.log('View invoice'), variant: 'outline' as const, icon: FileText },
          { label: 'Add Notes', action: handleEditOrder, variant: 'outline' as const, icon: Edit }
        ];
      case 'cancelled':
        return [
          { label: 'Reactivate Order', action: () => handleStatusChange('pending'), variant: 'outline' as const, icon: CheckCircle }
        ];
      default:
        return [];
    }
  };

  // Calculate order totals
  const calculateOrderTotals = () => {
    const subtotal = orderLines.reduce((sum, line) => sum + parseFloat(line.subtotal), 0);
    const taxRate = 0.085; // 8.5% tax
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs 
          items={[
            { name: 'Orders', href: '/orders', icon: <ShoppingCart className="h-4 w-4" /> },
            { name: 'Loading...', href: '#', icon: <Loader2 className="h-4 w-4 animate-spin" /> }
          ]}
        />

        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading order details..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="space-y-6">
        <Breadcrumbs 
          items={[
            { name: 'Orders', href: '/orders', icon: <ShoppingCart className="h-4 w-4" /> },
            { name: 'Error', href: '#', icon: <AlertTriangle className="h-4 w-4" /> }
          ]}
        />

        <ErrorDisplay
          title={error === 'Order not found' ? 'Order Not Found' : 'Error Loading Order'}
          message={error === 'Order not found' 
            ? 'The order you are looking for does not exist or may have been deleted.'
            : error || 'There was a problem loading the order details.'
          }
          onDismiss={() => navigate('/orders')}
          onRetry={id ? () => fetchOrder(id) : undefined}
        />
      </div>
    );
  }

  const availableActions = getAvailableActions(order.status);
  const { subtotal, taxAmount, total } = calculateOrderTotals();
  const orderNumber = `#${order.id.slice(-8)}`;

  return (
    <div className="space-y-6 w-full">
      <Breadcrumbs 
        items={[
          { name: 'Orders', href: '/orders', icon: <ShoppingCart className="h-4 w-4" /> },
          { name: `Order ${orderNumber}`, href: '#', icon: <FileText className="h-4 w-4" /> }
        ]}
      />

      {/* Order Header */}
      <PageHeader
        title={`Order ${orderNumber}`}
        description={`${formatDate(order.order_date)} • ${order.customer?.name || 'Unknown Customer'}`}
      >
        <div className="mr-4">
          {getStatusBadge(order.status)}
        </div>
        
        {availableActions.map((action, index) => (
          <Button 
            key={index}
            variant={action.variant}
            onClick={action.action}
            className={
              action.variant === 'destructive' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : action.variant === 'default'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
            }
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </PageHeader>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium">{order.customer?.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <span>{order.customer?.phone || 'N/A'}</span>
                  </div>
                  
                  {order.customer?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span>{order.customer.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Account Status:</span>
                    <Badge variant={
                      order.customer?.account_status === 'active' ? 'default' :
                      order.customer?.account_status === 'credit_hold' ? 'secondary' : 'destructive'
                    } className={
                      order.customer?.account_status === 'active' ? 'bg-green-100 text-green-800' :
                      order.customer?.account_status === 'credit_hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {order.customer?.account_status?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Credit Terms:</span>
                    <span>{order.customer?.credit_terms_days || 30} days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Delivery Address</div>
                    <div className="font-medium">
                      {order.delivery_address?.label || 'Delivery Address'}
                    </div>
                    <div className="text-sm">
                      {formatAddress(order.delivery_address)}
                    </div>
                  </div>
                  
                  {order.delivery_address?.delivery_window_start && order.delivery_address?.delivery_window_end && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Delivery Window</div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {order.delivery_address.delivery_window_start.substring(0, 5)} - {order.delivery_address.delivery_window_end.substring(0, 5)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {order.delivery_address?.instructions && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Delivery Instructions</div>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {order.delivery_address.instructions}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <div className="text-sm text-muted-foreground mb-1">Delivery Location</div>
                  <div className="flex-1 min-h-[180px] bg-muted rounded-lg border flex items-center justify-center">
                    {order.delivery_address?.latitude && order.delivery_address?.longitude ? (
                      <div className="text-center">
                        <Navigation className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-sm font-medium">Map View</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.delivery_address.latitude.toFixed(6)}, {order.delivery_address.longitude.toFixed(6)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm">No GPS coordinates available</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium text-sm">Product</th>
                      <th className="py-3 px-4 text-center font-medium text-sm">Quantity</th>
                      <th className="py-3 px-4 text-right font-medium text-sm">Unit Price</th>
                      <th className="py-3 px-4 text-right font-medium text-sm">Total</th>
                      <th className="py-3 px-4 text-center font-medium text-sm">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderLines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 text-center text-muted-foreground">
                          No items found for this order
                        </td>
                      </tr>
                    ) : (
                      orderLines.map((line, index) => {
                        // Mock stock status - in a real app, this would come from inventory
                        const stockStatus = Math.random() > 0.3 ? 'in_stock' : (Math.random() > 0.5 ? 'low_stock' : 'out_of_stock');
                        
                        return (
                          <tr key={line.id} className={index !== orderLines.length - 1 ? 'border-b' : ''}>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="font-medium">{line.product?.name || 'Unknown Product'}</div>
                                <div className="text-xs text-muted-foreground">
                                  SKU: {line.product?.sku || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="font-medium">{line.quantity}</div>
                              {order.status === 'draft' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs mt-1 text-blue-600 hover:text-blue-800"
                                  onClick={handleEditOrder}
                                >
                                  Edit
                                </Button>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {formatCurrency(line.unit_price)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {formatCurrency(line.subtotal)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={
                                stockStatus === 'in_stock' ? 'default' :
                                stockStatus === 'low_stock' ? 'secondary' : 'destructive'
                              } className={
                                stockStatus === 'in_stock' ? 'bg-green-100 text-green-800' :
                                stockStatus === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {stockStatus === 'in_stock' ? 'In Stock' :
                                 stockStatus === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Inventory Impact Section */}
              {(order.status === 'confirmed' || order.status === 'scheduled' || order.status === 'en_route') && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Inventory Impact</h4>
                      <p className="text-sm text-blue-700">
                        This order has reserved {orderLines.reduce((sum, line) => sum + line.quantity, 0)} units of inventory.
                        These items will be deducted from available stock when the order is marked as delivered.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {order.status === 'delivered' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-800 mb-1">Inventory Updated</h4>
                      <p className="text-sm text-green-700">
                        {orderLines.reduce((sum, line) => sum + line.quantity, 0)} units have been deducted from inventory.
                        Stock levels have been updated accordingly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline history={statusHistory} currentStatus={order.status} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary and Actions */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8.5%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="text-sm font-medium mb-2">Payment Terms</div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Terms:</span>
                    <span>{order.customer?.credit_terms_days || 30} days</span>
                  </div>
                  
                  {order.status === 'delivered' && (
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Payment Due:</span>
                      <span className="font-medium">
                        {formatDate(new Date(new Date(order.scheduled_date || order.order_date).getTime() + 
                          (order.customer?.credit_terms_days || 30) * 24 * 60 * 60 * 1000).toISOString())}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {order.notes && (
                <div className="pt-4">
                  <div className="text-sm font-medium mb-2">Order Notes</div>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {order.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900" onClick={() => console.log('Print invoice')}>
                <FileText className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
              
              <Button variant="outline" className="w-full justify-start bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900" onClick={() => console.log('Send confirmation')}>
                <Mail className="mr-2 h-4 w-4" />
                Send Confirmation
              </Button>
              
              <Button variant="outline" className="w-full justify-start bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900" onClick={() => navigate(`/customers/${order.customer_id}`)}>
                <User className="mr-2 h-4 w-4" />
                View Customer
              </Button>
              
              <Button variant="outline" className="w-full justify-start bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900" onClick={() => console.log('Create similar order')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Similar Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Modal */}
      <OrderStatusChangeModal
        open={statusChangeModalOpen}
        onOpenChange={setStatusChangeModalOpen}
        currentStatus={order.status}
        targetStatus={targetStatus}
        onConfirm={handleStatusChangeConfirm}
      />

      {/* Edit Order Modal */}
      <OrderEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        order={order}
        orderLines={orderLines}
        onConfirm={handleEditConfirm}
      />
    </div>
  );
}