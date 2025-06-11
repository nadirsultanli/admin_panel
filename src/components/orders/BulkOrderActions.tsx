import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CheckSquare, X, Download, FileText } from 'lucide-react';

interface BulkOrderActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkExport: () => void;
}

export function BulkOrderActions({ 
  selectedCount, 
  onClearSelection, 
  onBulkStatusUpdate,
  onBulkExport
}: BulkOrderActionsProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  if (selectedCount === 0) return null;

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmUpdate = () => {
    if (selectedStatus) {
      onBulkStatusUpdate(selectedStatus);
      setSelectedStatus('');
      setConfirmDialogOpen(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'scheduled':
        return 'Scheduled';
      case 'en_route':
        return 'En Route';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg animate-in fade-in-50 duration-300">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Bulk actions:</span>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px] h-8 bg-white text-gray-900 border-gray-300">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Confirmed
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Scheduled
                  </div>
                </SelectItem>
                <SelectItem value="en_route">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    En Route
                  </div>
                </SelectItem>
                <SelectItem value="delivered">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Delivered
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Cancelled
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              size="sm" 
              onClick={handleStatusUpdate}
              disabled={!selectedStatus}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Update Status
            </Button>

            <Button 
              size="sm" 
              variant="outline"
              onClick={onBulkExport}
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Selection
        </Button>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of {selectedCount} order{selectedCount !== 1 ? 's' : ''} to{' '}
              <strong>{selectedStatus ? getStatusLabel(selectedStatus) : ''}</strong>?
              
              {selectedStatus === 'delivered' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> Orders marked as delivered will automatically deduct inventory and update stock levels.
                  </div>
                </div>
              )}
              
              {selectedStatus === 'cancelled' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Cancelled orders will release any reserved inventory back to available stock.
                  </div>
                </div>
              )}
              
              <div className="mt-3 text-sm text-muted-foreground">
                This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmUpdate}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Update {selectedCount} Order{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}