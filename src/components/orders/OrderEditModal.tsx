import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Edit, 
  Calendar, 
  FileText, 
  Package,
  Plus,
  Minus,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import type { Order } from '@/types/order';

interface OrderEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  orderLines: any[];
  onConfirm: (updatedData: any) => void;
}

export function OrderEditModal({
  open,
  onOpenChange,
  order,
  orderLines,
  onConfirm
}: OrderEditModalProps) {
  const [notes, setNotes] = useState(order.notes || '');
  const [scheduledDate, setScheduledDate] = useState(order.scheduled_date || '');
  const [updatedLines, setUpdatedLines] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setNotes(order.notes || '');
      setScheduledDate(order.scheduled_date || '');
      setUpdatedLines(orderLines.map(line => ({ ...line })));
      setHasChanges(false);
    }
  }, [open, order, orderLines]);

  // Check for changes
  useEffect(() => {
    const notesChanged = notes !== (order.notes || '');
    const dateChanged = scheduledDate !== (order.scheduled_date || '');
    const linesChanged = updatedLines.some((line, index) => 
      line.quantity !== orderLines[index]?.quantity
    );
    
    setHasChanges(notesChanged || dateChanged || linesChanged);
  }, [notes, scheduledDate, updatedLines, order, orderLines]);

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const newLines = [...updatedLines];
    newLines[index] = {
      ...newLines[index],
      quantity: newQuantity,
      subtotal: newLines[index].unit_price * newQuantity
    };
    
    setUpdatedLines(newLines);
  };

  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    
    try {
      // Calculate updated totals
      const totalQuantity = updatedLines.reduce((sum, line) => sum + line.quantity, 0);
      const totalAmount = updatedLines.reduce((sum, line) => sum + parseFloat(line.subtotal), 0);
      
      // Prepare updated data
      const updatedData = {
        notes,
        scheduled_date: scheduledDate || null,
        quantity: totalQuantity,
        total_amount_kes: totalAmount
      };
      
      // In a real implementation, we would also update order lines
      
      onConfirm(updatedData);
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditQuantities = order.status === 'draft' || order.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Order #{order.id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Update order details and line items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Delivery Date
            </Label>
            <Input
              id="scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDeliveryDate()}
            />
            <p className="text-sm text-muted-foreground">
              When should this order be delivered?
            </p>
          </div>
          
          {/* Order Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Order Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Special instructions or notes for this order.
            </p>
          </div>
          
          {/* Line Items */}
          {canEditQuantities && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <Label>Order Items</Label>
              </div>
              
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium text-sm">Product</th>
                      <th className="py-3 px-4 text-center font-medium text-sm">Quantity</th>
                      <th className="py-3 px-4 text-right font-medium text-sm">Unit Price</th>
                      <th className="py-3 px-4 text-right font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updatedLines.map((line, index) => (
                      <tr key={line.id} className={index !== updatedLines.length - 1 ? 'border-b' : ''}>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="font-medium">{line.product?.name || 'Unknown Product'}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {line.product?.sku || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              onClick={() => handleQuantityChange(index, line.quantity - 1)}
                              disabled={line.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                              className="w-16 text-center h-8"
                            />
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              onClick={() => handleQuantityChange(index, line.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES'
                          }).format(line.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES'
                          }).format(line.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end">
                <div className="text-sm text-muted-foreground">
                  Total: {new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES'
                  }).format(updatedLines.reduce((sum, line) => sum + parseFloat(line.subtotal), 0))}
                </div>
              </div>
            </div>
          )}
          
          {!canEditQuantities && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Limited Editing Available</h4>
                  <p className="text-sm text-yellow-700">
                    Order quantities cannot be modified in the current status ({order.status.replace('_', ' ')}).
                    You can only update notes and scheduled date.
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
            disabled={isSubmitting || !hasChanges}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}