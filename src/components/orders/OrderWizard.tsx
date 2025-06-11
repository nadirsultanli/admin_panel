import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  MapPin, 
  Package, 
  FileCheck, 
  ArrowLeft, 
  ArrowRight,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { CustomerSelectionStep } from './steps/CustomerSelectionStep';
import { AddressSelectionStep } from './steps/AddressSelectionStep';
import { ProductSelectionStep } from './steps/ProductSelectionStep';
import { OrderReviewStep } from './steps/OrderReviewStep';
import { CustomerQuickAddModal } from './CustomerQuickAddModal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Customer, Address } from '@/types/customer';
import type { Product } from '@/types/product';

// Wizard step configuration
const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Select Customer',
    description: 'Choose the customer for this order',
    icon: Users,
    component: 'customer'
  },
  {
    id: 2,
    title: 'Delivery Address',
    description: 'Select delivery location',
    icon: MapPin,
    component: 'address'
  },
  {
    id: 3,
    title: 'Add Products',
    description: 'Choose products and quantities',
    icon: Package,
    component: 'products'
  },
  {
    id: 4,
    title: 'Review & Submit',
    description: 'Review order details and submit',
    icon: FileCheck,
    component: 'review'
  }
];

// Order wizard state interface
export interface OrderWizardState {
  customer: Customer | null;
  deliveryAddress: Address | null;
  orderLines: Array<{
    product: Product;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    availableStock: number;
  }>;
  notes: string;
  deliveryDate: string | null;
}

// Initial wizard state
const initialWizardState: OrderWizardState = {
  customer: null,
  deliveryAddress: null,
  orderLines: [],
  notes: '',
  deliveryDate: null
};

export function OrderWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardState, setWizardState] = useState<OrderWizardState>(initialWizardState);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate progress percentage
  const progressPercentage = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  // Get current step configuration
  const currentStepConfig = WIZARD_STEPS.find(step => step.id === currentStep);

  // Validation functions for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return wizardState.customer !== null;
      case 2:
        return wizardState.deliveryAddress !== null;
      case 3:
        return wizardState.orderLines.length > 0 && 
               wizardState.orderLines.every(line => line.quantity <= line.availableStock);
      case 4:
        return true; // Review step is always valid if we reach it
      default:
        return false;
    }
  };

  // Check if we can proceed to next step
  const canProceed = validateStep(currentStep);

  // Handle step navigation
  const handleNext = () => {
    if (canProceed && currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleCancel = () => {
    // Show confirmation if there's unsaved data
    const hasData = wizardState.customer || wizardState.orderLines.length > 0;
    
    if (hasData) {
      const confirmed = window.confirm(
        'Are you sure you want to cancel? All progress will be lost.'
      );
      if (!confirmed) return;
    }
    
    // Navigate back to orders page
    navigate('/orders');
  };

  // Update wizard state
  const updateWizardState = (updates: Partial<OrderWizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  };

  // Handle customer quick add success
  const handleQuickAddSuccess = (customer: Customer) => {
    updateWizardState({ customer });
    setQuickAddModalOpen(false);
  };

  // Calculate order totals
  const orderSubtotal = wizardState.orderLines.reduce((sum, line) => sum + line.subtotal, 0);
  const taxRate = 0.085; // 8.5% tax
  const taxAmount = orderSubtotal * taxRate;
  const orderTotal = orderSubtotal + taxAmount;

  // Generate order confirmation number
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  // Reserve inventory for order items
  const reserveInventory = async (orderLines: any[]) => {
    try {
      for (const line of orderLines) {
        // In a real implementation, this would update inventory_balance
        // For now, we'll just log the reservation
        console.log(`Reserving ${line.quantity} units of ${line.product.sku}`);
      }
      return true;
    } catch (error) {
      console.error('Error reserving inventory:', error);
      return false;
    }
  };

  // Handle order submission
  const handleSubmitOrder = async (isDraft: boolean = false) => {
    setIsSubmitting(true);
    
    try {
      // Validate one more time
      if (!wizardState.customer || !wizardState.deliveryAddress || wizardState.orderLines.length === 0) {
        throw new Error('Missing required order information');
      }

      // Check stock availability one more time
      const stockIssues = wizardState.orderLines.filter(line => line.quantity > line.availableStock);
      if (stockIssues.length > 0 && !isDraft) {
        throw new Error('Some items exceed available stock. Please adjust quantities.');
      }

      const orderNumber = generateOrderNumber();
      const orderDate = new Date().toISOString().split('T')[0];
      const deliveryDate = wizardState.deliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: wizardState.customer.id,
          delivery_address_id: wizardState.deliveryAddress.id,
          order_date: orderDate,
          scheduled_date: deliveryDate,
          status: isDraft ? 'draft' : 'pending',
          cylinder_size: wizardState.orderLines[0]?.product.capacity_kg ? `${wizardState.orderLines[0].product.capacity_kg}kg` : '20kg',
          quantity: wizardState.orderLines.reduce((sum, line) => sum + line.quantity, 0),
          price_kes: wizardState.orderLines[0]?.unitPrice || 0,
          total_amount_kes: orderTotal,
          notes: wizardState.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order line items
      const orderLinesData = wizardState.orderLines.map(line => ({
        order_id: order.id,
        product_id: line.product.id,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        subtotal: line.subtotal
      }));

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLinesData);

      if (linesError) throw linesError;

      // Reserve inventory if not a draft
      if (!isDraft) {
        const reservationSuccess = await reserveInventory(wizardState.orderLines);
        if (!reservationSuccess) {
          console.warn('Inventory reservation failed, but order was created');
        }
      }

      // Show success message
      const message = isDraft 
        ? `Draft order ${orderNumber} saved successfully!`
        : `Order ${orderNumber} created successfully!`;
      
      toast.success(message);

      // Navigate to orders list with success message
      navigate('/orders', { 
        state: { 
          message: `${isDraft ? 'Draft order' : 'Order'} ${orderNumber} ${isDraft ? 'saved' : 'created'} successfully!`,
          type: 'success',
          orderNumber
        }
      });

    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerSelectionStep
            selectedCustomer={wizardState.customer}
            onCustomerSelect={(customer) => updateWizardState({ customer })}
            onQuickAdd={() => setQuickAddModalOpen(true)}
          />
        );
      case 2:
        return (
          <AddressSelectionStep
            customer={wizardState.customer!}
            selectedAddress={wizardState.deliveryAddress}
            onAddressSelect={(address) => updateWizardState({ deliveryAddress: address })}
          />
        );
      case 3:
        return (
          <ProductSelectionStep
            orderLines={wizardState.orderLines}
            onOrderLinesChange={(orderLines) => updateWizardState({ orderLines })}
          />
        );
      case 4:
        return (
          <OrderReviewStep
            wizardState={wizardState}
            onNotesChange={(notes) => updateWizardState({ notes })}
            onDeliveryDateChange={(deliveryDate) => updateWizardState({ deliveryDate })}
            onSubmit={() => handleSubmitOrder(false)}
            onEditStep={handleEditStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
          <p className="text-muted-foreground">
            Follow the steps below to create a new customer order
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleCancel} 
          disabled={isSubmitting}
          className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Progress Stepper */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Step {currentStep} of {WIZARD_STEPS.length}</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isValid = validateStep(step.id);
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                        disabled={step.id >= currentStep}
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                          ${isCompleted 
                            ? 'bg-green-500 border-green-500 text-white cursor-pointer hover:bg-green-600' 
                            : isActive 
                              ? isValid 
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-yellow-500 border-yellow-500 text-white'
                              : 'bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isActive && !isValid ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </button>
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-muted-foreground hidden sm:block">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={`
                        flex-1 h-0.5 mx-4 transition-colors duration-200
                        ${step.id < currentStep ? 'bg-green-500' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card className="w-full min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStepConfig && (
              <>
                <currentStepConfig.icon className="h-5 w-5" />
                {currentStepConfig.title}
              </>
            )}
          </CardTitle>
          <CardDescription>
            {currentStepConfig?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Order Summary Sidebar (for steps 2+) */}
      {currentStep > 1 && currentStep < 4 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            {wizardState.customer && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Customer</span>
                </div>
                <div className="ml-6 text-sm">
                  <div className="font-medium">{wizardState.customer.name}</div>
                  <div className="text-muted-foreground">{wizardState.customer.phone}</div>
                  <Badge variant={
                    wizardState.customer.account_status === 'active' ? 'default' :
                    wizardState.customer.account_status === 'credit_hold' ? 'secondary' : 'destructive'
                  } className="mt-1">
                    {wizardState.customer.account_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            {wizardState.deliveryAddress && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Delivery Address</span>
                  </div>
                  <div className="ml-6 text-sm">
                    <div className="font-medium">
                      {wizardState.deliveryAddress.label || 'Delivery Address'}
                    </div>
                    <div className="text-muted-foreground">
                      {wizardState.deliveryAddress.line1}
                      {wizardState.deliveryAddress.line2 && `, ${wizardState.deliveryAddress.line2}`}
                    </div>
                    <div className="text-muted-foreground">
                      {wizardState.deliveryAddress.city}
                      {wizardState.deliveryAddress.state && `, ${wizardState.deliveryAddress.state}`}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Order Items */}
            {wizardState.orderLines.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Items ({wizardState.orderLines.length})</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    {wizardState.orderLines.map((line, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div>
                          <div className="font-medium">{line.product.name}</div>
                          <div className="text-muted-foreground">
                            {line.quantity} × KES {line.unitPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="font-medium">
                          KES {line.subtotal.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>KES {orderTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="min-w-[100px] bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="min-w-[100px] bg-blue-600 text-white hover:bg-blue-700"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Customer Quick Add Modal */}
      <CustomerQuickAddModal
        open={quickAddModalOpen}
        onOpenChange={setQuickAddModalOpen}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}