import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  CheckCircle, 
  Truck, 
  Calendar, 
  Camera, 
  Upload,
  Loader2
} from 'lucide-react';

interface OrderStatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  targetStatus: string | null;
  onConfirm: (notes: string, photoUrl?: string) => void;
}

export function OrderStatusChangeModal({
  open,
  onOpenChange,
  currentStatus,
  targetStatus,
  onConfirm
}: OrderStatusChangeModalProps) {
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'en_route':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusTitle = (status: string | null) => {
    if (!status) return '';
    
    switch (status) {
      case 'confirmed':
        return 'Confirm Order';
      case 'scheduled':
        return 'Schedule Delivery';
      case 'en_route':
        return 'Mark as En Route';
      case 'delivered':
        return 'Mark as Delivered';
      case 'cancelled':
        return 'Cancel Order';
      default:
        return `Change Status to ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    }
  };

  const getStatusDescription = (currentStatus: string, targetStatus: string | null) => {
    if (!targetStatus) return '';
    
    switch (targetStatus) {
      case 'confirmed':
        return 'This will confirm the order and reserve inventory for delivery.';
      case 'scheduled':
        return 'This will schedule the order for delivery on the specified date.';
      case 'en_route':
        return 'This will mark the order as out for delivery.';
      case 'delivered':
        return 'This will mark the order as delivered and deduct inventory.';
      case 'cancelled':
        return 'This will cancel the order and release any reserved inventory.';
      default:
        return `Change status from ${currentStatus} to ${targetStatus}.`;
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would upload the photo to storage
      let photoUrl;
      if (photoFile) {
        // Mock photo upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        photoUrl = URL.createObjectURL(photoFile);
      }
      
      onConfirm(notes, photoUrl);
    } catch (error) {
      console.error('Error processing status change:', error);
    } finally {
      setIsSubmitting(false);
      setNotes('');
      setPhotoFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const isIrreversibleAction = targetStatus === 'delivered' || targetStatus === 'cancelled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(targetStatus)}
            {getStatusTitle(targetStatus)}
          </DialogTitle>
          <DialogDescription>
            {getStatusDescription(currentStatus, targetStatus)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes {isIrreversibleAction && '(Required)'}</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          {/* Photo Upload for Delivery */}
          {targetStatus === 'delivered' && (
            <div className="space-y-2">
              <Label htmlFor="photo">Delivery Photo (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {photoFile ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{photoFile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(photoFile.size / 1024).toFixed(1)} KB
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPhotoFile(null)}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground mb-2">
                      Upload a photo of the delivered order
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Select Photo
                      </label>
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Warning for Irreversible Actions */}
          {isIrreversibleAction && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Warning: This action cannot be undone</h4>
                  <p className="text-sm text-yellow-700">
                    {targetStatus === 'delivered' 
                      ? 'Marking as delivered will deduct inventory and cannot be reversed. Please verify all details before confirming.'
                      : 'Cancelling this order will release any reserved inventory and cannot be undone.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || (isIrreversibleAction && !notes)}
            className={
              targetStatus === 'cancelled'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}