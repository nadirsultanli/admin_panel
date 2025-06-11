import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  Edit, 
  Printer, 
  X,
  AlertTriangle,
  ShoppingCart,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';
import type { Order } from '@/types/order';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  selectedOrders: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onCancelOrder: (orderId: string) => void;
  onViewOrder: (order: Order) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

// Status transition rules
const STATUS_TRANSITIONS = {
  draft: ['confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['scheduled', 'cancelled'],
  scheduled: ['en_route', 'cancelled'],
  en_route: ['delivered'],
  delivered: [], // Final state
  cancelled: [] // Final state
};

export function OrdersTable({
  orders,
  loading,
  selectedOrders,
  onSelectionChange,
  onStatusChange,
  onCancelOrder,
  onViewOrder,
  sortField,
  sortDirection,
  onSort
}: OrdersTableProps) {
  const navigate = useNavigate();
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    orderId: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline\" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmed</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Scheduled</Badge>;
      case 'en_route':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">En Route</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getValidNextStatuses = (currentStatus: string): string[] => {
    return STATUS_TRANSITIONS[currentStatus as keyof typeof STATUS_TRANSITIONS] || [];
  };

  const canCancelOrder = (status: string): boolean => {
    return ['draft', 'pending', 'confirmed', 'scheduled'].includes(status);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(orders.map(order => order.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedOrders, orderId]);
    } else {
      onSelectionChange(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleStatusChangeClick = (orderId: string, currentStatus: string, newStatus: string) => {
    setStatusChangeDialog({ orderId, currentStatus, newStatus });
  };

  const confirmStatusChange = () => {
    if (statusChangeDialog) {
      onStatusChange(statusChangeDialog.orderId, statusChangeDialog.newStatus);
      setStatusChangeDialog(null);
    }
  };

  const handleCancelClick = (orderId: string) => {
    setCancelOrderId(orderId);
  };

  const confirmCancelOrder = () => {
    if (cancelOrderId) {
      onCancelOrder(cancelOrderId);
      setCancelOrderId(null);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return (
      <ArrowUpDown 
        className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''} transition-transform`} 
      />
    );
  };

  const isAllSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const isPartiallySelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const TableSkeleton = () => (
    <div className="rounded-md border w-full">
      <Table className="w-full table-auto">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox disabled />
            </TableHead>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Delivery Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} className="animate-in fade-in-50 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
              <TableCell>
                <Skeleton className="h-4 w-4 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return <TableSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-md border animate-in fade-in-50 duration-300 w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Delivery Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center space-y-3">
                  <ShoppingCart className="h-12 w-12 opacity-50" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">No orders found</h3>
                    <p className="text-sm">
                      Try adjusting your search criteria or create a new order to get started.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border animate-in fade-in-50 duration-300 w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('id')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-gray-900"
                >
                  Order #
                  {getSortIcon('id')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('customer')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-gray-900"
                >
                  Customer
                  {getSortIcon('customer')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('order_date')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-gray-900"
                >
                  Order Date
                  {getSortIcon('order_date')}
                </Button>
              </TableHead>
              <TableHead>Delivery Address</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('status')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-gray-900"
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('total_amount_kes')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-gray-900"
                >
                  Total
                  {getSortIcon('total_amount_kes')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => {
              const validNextStatuses = getValidNextStatuses(order.status);
              
              return (
                <TableRow 
                  key={order.id} 
                  className="hover:bg-muted/50 transition-colors duration-150 animate-in fade-in-50 slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    />
                  </TableCell>
                  
                  <TableCell className="font-mono">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      #{order.id.slice(-8)}
                    </code>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer?.name || 'Unknown Customer'}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.quantity}x {order.cylinder_size} Cylinders
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(order.order_date)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {order.delivery_address?.city || 'No address'}
                      {order.scheduled_date && (
                        <div className="text-xs text-muted-foreground">
                          Delivery: {formatDate(order.scheduled_date)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      {validNextStatuses.length > 0 && (
                        <Select onValueChange={(newStatus) => handleStatusChangeClick(order.id, order.status, newStatus)}>
                          <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-muted">
                            <MoreHorizontal className="h-3 w-3" />
                          </SelectTrigger>
                          <SelectContent>
                            {validNextStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(status)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    {formatCurrency(order.total_amount_kes)}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewOrder(order)}
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => console.log('Print order:', order.id)}
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        title="Print/Email"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                      
                      {canCancelOrder(order.status) && (
                        <Button
                          size="sm"
                          onClick={() => handleCancelClick(order.id)}
                          className="bg-red-600 text-white hover:bg-red-700"
                          title="Cancel Order"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeDialog} onOpenChange={() => setStatusChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the order status from{' '}
              <strong>{statusChangeDialog?.currentStatus.replace('_', ' ')}</strong> to{' '}
              <strong>{statusChangeDialog?.newStatus.replace('_', ' ')}</strong>?
              
              {statusChangeDialog?.newStatus === 'delivered' && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> Marking as delivered will automatically deduct inventory and update stock levels.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              Any reserved inventory will be released back to available stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelOrder}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}