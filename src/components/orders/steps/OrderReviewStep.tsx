import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  Package, 
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Edit,
  Save,
  Clock,
  CreditCard,
  Calculator
} from 'lucide-react';
import type { OrderWizardState } from '../OrderWizard';

interface OrderReviewStepProps {
  wizardState: OrderWizardState;
  onNotesChange: (notes: string) => void;
  onDeliveryDateChange: (date: string) => void;
  onSubmit: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
}

export function OrderReviewStep({
  wizardState,
  onNotesChange,
  onDeliveryDateChange,
  onSubmit,
  onEditStep,
  isSubmitting
}: OrderReviewStepProps) {
  const [isDraft, setIsDraft] = useState(false);

  // Calculate order totals
  const orderSubtotal = wizardState.orderLines.reduce((sum, line) => sum + line.subtotal, 0);
  const taxRate = 0.085; // 8.5% tax
  const taxAmount = orderSubtotal * taxRate;
  const orderTotal = orderSubtotal + taxAmount;
  const totalItems = wizardState.orderLines.reduce((sum, line) => sum + line.quantity, 0);

  const formatAddress = (address: any) => {
    const parts = [address.line1];
    if (address.line2) parts.push(address.line2);
    parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postal_code) parts.push(address.postal_code);
    return parts.join(', ');
  };

  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const formatDeliveryWindow = (start?: string, end?: string) => {
    if (!start && !end) return null;
    
    const formatTime = (time: string) => {
      try {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } catch {
        return time;
      }
    };

    if (start && end) {
      return `${formatTime(start)} - ${formatTime(end)}`;
    } else if (start) {
      return `After ${formatTime(start)}`;
    } else if (end) {
      return `Before ${formatTime(end)}`;
    }
    return null;
  };

  const handleSaveAsDraft = () => {
    setIsDraft(true);
    onSubmit();
  };

  const handlePlaceOrder = () => {
    setIsDraft(false);
    onSubmit();
  };

  // Validation checks
  const hasValidationErrors = () => {
    return (
      !wizardState.customer ||
      !wizardState.deliveryAddress ||
      wizardState.orderLines.length === 0 ||
      wizardState.orderLines.some(line => line.quantity > line.availableStock)
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Review Order Details</h3>
        <p className="text-muted-foreground">
          Please review all order information before submitting. You can edit any section by clicking the edit button.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Summary - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStep(1)}
                  className="h-8"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium text-lg">{wizardState.customer?.name}</div>
                <div className="text-sm text-muted-foreground">{wizardState.customer?.phone}</div>
                {wizardState.customer?.email && (
                  <div className="text-sm text-muted-foreground">{wizardState.customer.email}</div>
                )}
                {wizardState.customer?.tax_id && (
                  <div className="text-sm text-muted-foreground">Tax ID: {wizardState.customer.tax_id}</div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant={
                  wizardState.customer?.account_status === 'active' ? 'default' :
                  wizardState.customer?.account_status === 'credit_hold' ? 'secondary' : 'destructive'
                } className={
                  wizardState.customer?.account_status === 'active' ? 'bg-green-100 text-green-800' :
                  wizardState.customer?.account_status === 'credit_hold' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {wizardState.customer?.account_status.replace('_', ' ')}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CreditCard className="h-3 w-3" />
                  <span>{wizardState.customer?.credit_terms_days} days credit terms</span>
                </div>
              </div>

              {wizardState.customer?.account_status === 'credit_hold' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium">Credit Hold Warning</div>
                    <div>Customer account is on credit hold. Verify payment status before proceeding.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStep(2)}
                  className="h-8"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">
                  {wizardState.deliveryAddress?.label || 'Delivery Address'}
                  {wizardState.deliveryAddress?.is_primary && (
                    <Badge variant="outline\" className="ml-2 text-xs">Primary</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {wizardState.deliveryAddress && formatAddress(wizardState.deliveryAddress)}
                </div>
              </div>

              {/* Delivery Window */}
              {wizardState.deliveryAddress && formatDeliveryWindow(
                wizardState.deliveryAddress.delivery_window_start,
                wizardState.deliveryAddress.delivery_window_end
              ) && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Delivery window:</span>
                  <span className="font-medium">
                    {formatDeliveryWindow(
                      wizardState.deliveryAddress.delivery_window_start,
                      wizardState.deliveryAddress.delivery_window_end
                    )}
                  </span>
                </div>
              )}

              {wizardState.deliveryAddress?.instructions && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Special Instructions: </span>
                    <span>{wizardState.deliveryAddress.instructions}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Order Items ({totalItems} items)
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStep(3)}
                  className="h-8"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {wizardState.orderLines.map((line, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{line.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {line.product.sku} • {line.product.capacity_kg}kg
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{line.quantity}</span> × 
                        <span className="ml-1">KES {line.unitPrice.toLocaleString()}</span>
                      </div>
                      {line.quantity > line.availableStock && (
                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Exceeds available stock ({line.availableStock} available)
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">KES {line.subtotal.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {line.availableStock} available
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Date and Notes */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Delivery Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="date"
                  min={getMinDeliveryDate()}
                  value={wizardState.deliveryDate || ''}
                  onChange={(e) => onDeliveryDateChange(e.target.value)}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Preferred delivery date (minimum 1 day from today)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Special instructions or notes..."
                  value={wizardState.notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Optional notes for delivery personnel
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Total and Actions - Right Column */}
        <div className="space-y-6">
          {/* Order Total */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>KES {orderSubtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Tax (8.5%)</span>
                  <span>KES {taxAmount.toLocaleString()}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Order Total</span>
                  <span className="text-xl font-bold text-primary">
                    KES {orderTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium mb-1">Payment Terms</div>
                  <div className="text-muted-foreground">
                    {wizardState.customer?.credit_terms_days} days credit terms
                  </div>
                  {wizardState.deliveryDate && (
                    <div className="text-muted-foreground">
                      Payment due: {new Date(
                        new Date(wizardState.deliveryDate).getTime() + 
                        (wizardState.customer?.credit_terms_days || 30) * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {hasValidationErrors() && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Please fix the following:</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {!wizardState.customer && <li>• Select a customer</li>}
                    {!wizardState.deliveryAddress && <li>• Select delivery address</li>}
                    {wizardState.orderLines.length === 0 && <li>• Add at least one product</li>}
                    {wizardState.orderLines.some(line => line.quantity > line.availableStock) && 
                      <li>• Fix stock quantity issues</li>}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || hasValidationErrors()}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting && !isDraft ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting || !wizardState.customer || wizardState.orderLines.length === 0}
                  className="w-full"
                >
                  {isSubmitting && isDraft ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                      Saving Draft...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>
              </div>

              {/* Order Information */}
              <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                <div>• Orders are processed within 24 hours</div>
                <div>• Delivery confirmation will be sent via SMS</div>
                <div>• Contact support for order changes</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}