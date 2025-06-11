import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Star, 
  Clock, 
  Navigation,
  Plus,
  AlertTriangle,
  Check,
  Building,
  Globe,
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { useAddresses } from '@/hooks/useAddresses';
import { AddressFormModal } from '@/components/customers/AddressFormModal';
import type { Customer, Address } from '@/types/customer';

interface AddressSelectionStepProps {
  customer: Customer;
  selectedAddress: Address | null;
  onAddressSelect: (address: Address) => void;
}

export function AddressSelectionStep({
  customer,
  selectedAddress,
  onAddressSelect
}: AddressSelectionStepProps) {
  const { addresses, loading, fetchAddresses } = useAddresses();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    instructions: ''
  });

  useEffect(() => {
    if (customer?.id) {
      fetchAddresses(customer.id);
    }
  }, [customer?.id, fetchAddresses]);

  // Auto-select primary address if it's the only one
  useEffect(() => {
    if (addresses.length === 1 && !selectedAddress) {
      onAddressSelect(addresses[0]);
    }
  }, [addresses, selectedAddress, onAddressSelect]);

  const formatAddress = (address: Address) => {
    const parts = [address.line1];
    if (address.line2) parts.push(address.line2);
    parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postal_code) parts.push(address.postal_code);
    return parts.join(', ');
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

  const handleQuickAddSubmit = async () => {
    if (!quickAddData.line1.trim() || !quickAddData.city.trim()) {
      return;
    }

    setIsSubmittingQuickAdd(true);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: newAddress, error } = await supabase
        .from('addresses')
        .insert({
          customer_id: customer.id,
          label: quickAddData.label.trim() || null,
          line1: quickAddData.line1.trim(),
          line2: quickAddData.line2.trim() || null,
          city: quickAddData.city.trim(),
          state: quickAddData.state.trim() || null,
          postal_code: quickAddData.postal_code.trim() || null,
          country: 'KE',
          instructions: quickAddData.instructions.trim() || null,
          is_primary: addresses.length === 0, // Make primary if it's the first address
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh addresses and auto-select the new one
      await fetchAddresses(customer.id);
      onAddressSelect(newAddress);
      
      // Reset form
      setQuickAddData({
        label: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        instructions: ''
      });
      setShowQuickAdd(false);
      
      const { toast } = await import('sonner');
      toast.success('Address added successfully');
    } catch (error: any) {
      console.error('Error adding address:', error);
      const { toast } = await import('sonner');
      toast.error(error.message || 'Failed to add address');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  const handleAddressFormSuccess = () => {
    fetchAddresses(customer.id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading delivery addresses...</p>
        </div>
      </div>
    );
  }

  // No addresses state
  if (addresses.length === 0 && !showQuickAdd) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Delivery Addresses</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {customer.name} doesn't have any delivery addresses set up. 
                  Add an address to continue with the order.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowQuickAdd(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Quick Add Address
                </Button>
                <Button variant="outline" onClick={() => setAddressFormOpen(true)}>
                  <Building className="mr-2 h-4 w-4" />
                  Full Address Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <AddressFormModal
          open={addressFormOpen}
          onOpenChange={setAddressFormOpen}
          customerId={customer.id}
          onSuccess={handleAddressFormSuccess}
        />
      </div>
    );
  }

  // Separate primary and secondary addresses
  const primaryAddress = addresses.find(addr => addr.is_primary);
  const secondaryAddresses = addresses.filter(addr => !addr.is_primary);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Select Delivery Address</h3>
            <p className="text-muted-foreground">
              Choose where to deliver the order for {customer.name}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {showQuickAdd ? 'Cancel' : 'Quick Add'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAddressFormOpen(true)}
            >
              <Building className="mr-2 h-4 w-4" />
              Full Form
            </Button>
          </div>
        </div>

        {/* Quick Add Form */}
        {showQuickAdd && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Quick Add New Address</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickAdd(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Address label (optional)"
                    value={quickAddData.label}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, label: e.target.value }))}
                  />
                  <Input
                    placeholder="Street address *"
                    value={quickAddData.line1}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, line1: e.target.value }))}
                  />
                  <Input
                    placeholder="Apartment, suite, etc."
                    value={quickAddData.line2}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, line2: e.target.value }))}
                  />
                  <Input
                    placeholder="City *"
                    value={quickAddData.city}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    placeholder="State/County"
                    value={quickAddData.state}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, state: e.target.value }))}
                  />
                  <Input
                    placeholder="Postal code"
                    value={quickAddData.postal_code}
                    onChange={(e) => setQuickAddData(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
                
                <Textarea
                  placeholder="Delivery instructions (optional)"
                  value={quickAddData.instructions}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, instructions: e.target.value }))}
                  className="min-h-[60px]"
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowQuickAdd(false)}
                    disabled={isSubmittingQuickAdd}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleQuickAddSubmit}
                    disabled={!quickAddData.line1.trim() || !quickAddData.city.trim() || isSubmittingQuickAdd}
                  >
                    {isSubmittingQuickAdd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add & Select
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Address Selection */}
      <div className="space-y-4">
        {/* Primary Address */}
        {primaryAddress && (
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedAddress?.id === primaryAddress.id 
                ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onAddressSelect(primaryAddress)}
          >
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {primaryAddress.label || 'Primary Address'}
                      </span>
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Primary
                      </Badge>
                    </div>
                    
                    <div className="text-muted-foreground">
                      {formatAddress(primaryAddress)}
                    </div>
                    
                    {/* GPS Coordinates */}
                    {primaryAddress.latitude && primaryAddress.longitude && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Navigation className="h-3 w-3" />
                        <span>GPS: {primaryAddress.latitude.toFixed(6)}, {primaryAddress.longitude.toFixed(6)}</span>
                      </div>
                    )}
                    
                    {/* Delivery Window */}
                    {formatDeliveryWindow(primaryAddress.delivery_window_start, primaryAddress.delivery_window_end) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Delivery window:</span>
                        <span className="font-medium">
                          {formatDeliveryWindow(primaryAddress.delivery_window_start, primaryAddress.delivery_window_end)}
                        </span>
                      </div>
                    )}
                    
                    {/* Instructions */}
                    {primaryAddress.instructions && (
                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">Instructions: </span>
                          <span>{primaryAddress.instructions}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Selection Indicator */}
                  <div className="flex flex-col items-center gap-2 ml-4">
                    {selectedAddress?.id === primaryAddress.id ? (
                      <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full" />
                    )}
                    
                    {/* Placeholder Map */}
                    <div className="w-16 h-12 bg-muted rounded border flex items-center justify-center">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Secondary Addresses */}
        {secondaryAddresses.map((address) => (
          <Card 
            key={address.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedAddress?.id === address.id 
                ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onAddressSelect(address)}
          >
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {address.label || 'Delivery Address'}
                      </span>
                      <Badge variant="secondary">Secondary</Badge>
                    </div>
                    
                    <div className="text-muted-foreground">
                      {formatAddress(address)}
                    </div>
                    
                    {/* GPS Coordinates */}
                    {address.latitude && address.longitude && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Navigation className="h-3 w-3" />
                        <span>GPS: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}</span>
                      </div>
                    )}
                    
                    {/* Delivery Window */}
                    {formatDeliveryWindow(address.delivery_window_start, address.delivery_window_end) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Delivery window:</span>
                        <span className="font-medium">
                          {formatDeliveryWindow(address.delivery_window_start, address.delivery_window_end)}
                        </span>
                      </div>
                    )}
                    
                    {/* Instructions */}
                    {address.instructions && (
                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">Instructions: </span>
                          <span>{address.instructions}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Selection Indicator */}
                  <div className="flex flex-col items-center gap-2 ml-4">
                    {selectedAddress?.id === address.id ? (
                      <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full" />
                    )}
                    
                    {/* Placeholder Map */}
                    <div className="w-16 h-12 bg-muted rounded border flex items-center justify-center">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Selection Warning */}
      {!selectedAddress && addresses.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            Please select a delivery address to continue with the order
          </div>
        </div>
      )}

      {/* Selected Address Summary */}
      {selectedAddress && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="font-medium">Selected for delivery:</span>
              <span>{selectedAddress.label || 'Address'} - {selectedAddress.city}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address Form Modal */}
      <AddressFormModal
        open={addressFormOpen}
        onOpenChange={setAddressFormOpen}
        customerId={customer.id}
        onSuccess={handleAddressFormSuccess}
      />
    </div>
  );
}