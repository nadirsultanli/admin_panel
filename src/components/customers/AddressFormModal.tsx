import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  MapPin, 
  Tag, 
  Building, 
  Navigation,
  Clock,
  FileText,
  Star,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/types/customer';

// Address form validation schema
const addressFormSchema = z.object({
  label: z
    .string()
    .max(60, 'Label must not exceed 60 characters')
    .optional()
    .or(z.literal('')),
  line1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(120, 'Address line 1 must not exceed 120 characters'),
  line2: z
    .string()
    .max(120, 'Address line 2 must not exceed 120 characters')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(1, 'City is required')
    .max(60, 'City must not exceed 60 characters'),
  state: z
    .string()
    .max(60, 'State must not exceed 60 characters')
    .optional()
    .or(z.literal('')),
  postal_code: z
    .string()
    .max(20, 'Postal code must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .length(2, 'Country code must be 2 characters')
    .default('US'),
  instructions: z
    .string()
    .max(500, 'Instructions must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  delivery_window_start: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
    }, 'Please enter a valid time (HH:MM)')
    .or(z.literal('')),
  delivery_window_end: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
    }, 'Please enter a valid time (HH:MM)')
    .or(z.literal('')),
  is_primary: z.boolean().default(false),
}).refine((data) => {
  // Validate delivery window logic
  if (data.delivery_window_start && data.delivery_window_end) {
    const start = data.delivery_window_start.split(':').map(Number);
    const end = data.delivery_window_end.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return startMinutes < endMinutes;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['delivery_window_end'],
});

type AddressFormData = z.infer<typeof addressFormSchema>;

interface AddressFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  address?: Address | null;
  onSuccess?: () => void;
}

// Country options
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'KE', name: 'Kenya' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
];

export function AddressFormModal({
  open,
  onOpenChange,
  customerId,
  address,
  onSuccess
}: AddressFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const isEditMode = !!address;

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      instructions: '',
      delivery_window_start: '',
      delivery_window_end: '',
      is_primary: false,
    },
  });

  // Reset form when dialog opens/closes or address changes
  useEffect(() => {
    if (open) {
      if (address) {
        // Edit mode - populate with existing data
        form.reset({
          label: address.label || '',
          line1: address.line1 || '',
          line2: address.line2 || '',
          city: address.city || '',
          state: address.state || '',
          postal_code: address.postal_code || '',
          country: address.country || 'US',
          instructions: address.instructions || '',
          delivery_window_start: address.delivery_window_start || '',
          delivery_window_end: address.delivery_window_end || '',
          is_primary: address.is_primary || false,
        });
      } else {
        // Create mode - reset to defaults
        form.reset({
          label: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US',
          instructions: '',
          delivery_window_start: '',
          delivery_window_end: '',
          is_primary: false,
        });
      }
    }
  }, [open, address, form]);

  // Geocoding function (mock implementation - replace with actual service)
  const geocodeAddress = async (addressData: AddressFormData): Promise<{ lat: number; lng: number } | null> => {
    setIsGeocoding(true);
    try {
      // Mock geocoding - in production, use Google Maps Geocoding API or similar
      const fullAddress = [
        addressData.line1,
        addressData.line2,
        addressData.city,
        addressData.state,
        addressData.postal_code,
        countries.find(c => c.code === addressData.country)?.name
      ].filter(Boolean).join(', ');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock coordinates (replace with actual geocoding)
      const mockCoordinates = {
        lat: -1.2921 + (Math.random() - 0.5) * 0.1, // Nairobi area
        lng: 36.8219 + (Math.random() - 0.5) * 0.1
      };

      toast.success('Address geocoded successfully');
      return mockCoordinates;
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to geocode address');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const checkPrimaryAddressConstraint = async (customerId: string, currentAddressId?: string): Promise<boolean> => {
    try {
      let query = supabase
        .from('addresses')
        .select('id')
        .eq('customer_id', customerId)
        .eq('is_primary', true);

      // If editing, exclude current address from check
      if (currentAddressId) {
        query = query.neq('id', currentAddressId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking primary address:', error);
        return true; // Allow submission if check fails
      }

      return data.length === 0;
    } catch (error) {
      console.error('Error checking primary address:', error);
      return true; // Allow submission if check fails
    }
  };

  const handleSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);

    try {
      // Check primary address constraint
      if (data.is_primary) {
        const canSetPrimary = await checkPrimaryAddressConstraint(customerId, address?.id);
        if (!canSetPrimary) {
          form.setError('is_primary', {
            type: 'manual',
            message: 'Another address is already set as primary. Please uncheck the primary flag on the existing address first.',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Geocode the address
      let coordinates: { lat: number; lng: number } | null = null;
      if (data.line1 && data.city) {
        coordinates = await geocodeAddress(data);
      }

      // Prepare data for submission
      const submitData = {
        customer_id: customerId,
        label: data.label?.trim() || null,
        line1: data.line1.trim(),
        line2: data.line2?.trim() || null,
        city: data.city.trim(),
        state: data.state?.trim() || null,
        postal_code: data.postal_code?.trim() || null,
        country: data.country,
        instructions: data.instructions?.trim() || null,
        delivery_window_start: data.delivery_window_start || null,
        delivery_window_end: data.delivery_window_end || null,
        is_primary: data.is_primary,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null,
      };

      if (isEditMode && address) {
        // Update existing address
        const { data: updatedAddress, error } = await supabase
          .from('addresses')
          .update(submitData)
          .eq('id', address.id)
          .select()
          .single();

        if (error) throw error;

        toast.success('Address updated successfully');
      } else {
        // Create new address
        const { data: newAddress, error } = await supabase
          .from('addresses')
          .insert({
            ...submitData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Address created successfully');
      }

      // Close modal and trigger refresh
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('Error saving address:', error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        toast.error('An address with this information already exists');
      } else {
        toast.error(
          error.message || 
          `Failed to ${isEditMode ? 'update' : 'create'} address`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      // Show confirmation if form has changes
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isEditMode ? 'Edit Address' : 'Add New Address'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the address information below. Required fields are marked with *.'
              : 'Enter the delivery address details. Required fields are marked with *.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Address Label */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Address Label
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Main Kitchen, Back Entrance, Loading Dock" 
                      {...field}
                      maxLength={60}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. A friendly name to identify this address. {field.value?.length || 0}/60 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 1 */}
            <FormField
              control={form.control}
              name="line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Address Line 1 *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Street address, building number" 
                      {...field}
                      maxLength={120}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/120 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 2 */}
            <FormField
              control={form.control}
              name="line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Address Line 2
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Apartment, suite, unit, floor" 
                      {...field}
                      maxLength={120}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. {field.value?.length || 0}/120 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City and State Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City name" 
                        {...field}
                        maxLength={60}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="State or province" 
                        {...field}
                        maxLength={60}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Postal Code and Country Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ZIP or postal code" 
                        {...field}
                        maxLength={20}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Country *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delivery Window */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Delivery Window</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="delivery_window_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Earliest delivery time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_window_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Latest delivery time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Delivery Instructions */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Delivery Instructions
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Special delivery instructions, access codes, contact person, etc."
                      className="min-h-[80px]"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Special instructions for delivery drivers. {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Address Checkbox */}
            <FormField
              control={form.control}
              name="is_primary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Set as Primary Address
                    </FormLabel>
                    <FormDescription>
                      The primary address will be used as the default delivery location for new orders.
                      Only one address can be primary per customer.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isGeocoding}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isGeocoding}
                className="min-w-[140px]"
              >
                {(isSubmitting || isGeocoding) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isGeocoding ? 'Geocoding...' : 
                 isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') :
                 (isEditMode ? 'Update Address' : 'Create Address')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}