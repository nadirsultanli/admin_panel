import { 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertTriangle, 
  X, 
  Truck, 
  Calendar, 
  ShoppingCart 
} from 'lucide-react';

interface StatusHistoryItem {
  id: string;
  status: string;
  timestamp: string;
  user: string;
  notes?: string;
}

interface OrderStatusTimelineProps {
  history: StatusHistoryItem[];
  currentStatus: string;
}

export function OrderStatusTimeline({ history, currentStatus }: OrderStatusTimelineProps) {
  // Sort history by timestamp (oldest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <ShoppingCart className="h-5 w-5 text-gray-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'en_route':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'border-gray-300 bg-gray-50';
      case 'pending':
        return 'border-yellow-300 bg-yellow-50';
      case 'confirmed':
        return 'border-blue-300 bg-blue-50';
      case 'scheduled':
        return 'border-orange-300 bg-orange-50';
      case 'en_route':
        return 'border-purple-300 bg-purple-50';
      case 'delivered':
        return 'border-green-300 bg-green-50';
      case 'cancelled':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Order Created';
      case 'pending':
        return 'Order Pending';
      case 'confirmed':
        return 'Order Confirmed';
      case 'scheduled':
        return 'Delivery Scheduled';
      case 'en_route':
        return 'Out for Delivery';
      case 'delivered':
        return 'Order Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (sortedHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No status history available</h3>
        <p className="text-sm">
          Status changes will be recorded and displayed here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line connecting timeline items */}
      <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-muted" />
      
      <div className="space-y-8">
        {sortedHistory.map((item, index) => (
          <div key={item.id} className="relative">
            <div className="flex items-start gap-4">
              {/* Status icon */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStatusColor(item.status)} z-10`}>
                {getStatusIcon(item.status)}
              </div>
              
              {/* Status content */}
              <div className="flex-1 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h4 className="font-medium">{getStatusTitle(item.status)}</h4>
                  <span className="text-sm text-muted-foreground">{formatTimestamp(item.timestamp)}</span>
                </div>
                
                <div className="mt-1 text-sm">
                  <span className="text-muted-foreground">Updated by:</span> {item.user}
                </div>
                
                {item.notes && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Current status indicator if not in history */}
        {!sortedHistory.some(item => item.status === currentStatus) && (
          <div className="relative">
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStatusColor(currentStatus)} z-10`}>
                {getStatusIcon(currentStatus)}
              </div>
              
              <div className="flex-1 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h4 className="font-medium">{getStatusTitle(currentStatus)}</h4>
                  <span className="text-sm text-muted-foreground">Current Status</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}