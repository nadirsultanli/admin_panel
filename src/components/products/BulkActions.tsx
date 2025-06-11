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
import { CheckSquare, X } from 'lucide-react';
import type { Product } from '@/types/product';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: Product['status']) => void;
}

export function BulkActions({ 
  selectedCount, 
  onClearSelection, 
  onBulkStatusUpdate 
}: BulkActionsProps) {
  const [selectedStatus, setSelectedStatus] = useState<Product['status'] | ''>('');
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

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'end_of_sale':
        return 'End of Sale';
      case 'obsolete':
        return 'Obsolete';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Change status to:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px] h-8 bg-white text-gray-900 border-gray-300">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="end_of_sale">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    End of Sale
                  </div>
                </SelectItem>
                <SelectItem value="obsolete">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Obsolete
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
              Update
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
              Are you sure you want to change the status of {selectedCount} product{selectedCount !== 1 ? 's' : ''} to{' '}
              <strong>{selectedStatus ? getStatusLabel(selectedStatus) : ''}</strong>?
              This action cannot be undone.
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
              Update {selectedCount} Product{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}